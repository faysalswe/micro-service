using Moq;
using Grpc.Core;
using Orders.V1;
using Payments.V1;
using Inventory.V1;
using OrderService.Data;
using OrderService.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using FluentAssertions;
using Xunit;

using Microsoft.Extensions.Configuration;
using System.Net.Http;

namespace OrderService.Tests;

public class OrderProcessingServiceTests
{
    private readonly Mock<ILogger<OrderProcessingService>> _loggerMock;
    private readonly Mock<Payments.V1.PaymentService.PaymentServiceClient> _paymentClientMock;
    private readonly Mock<Inventory.V1.InventoryService.InventoryServiceClient> _inventoryClientMock;
    private readonly Mock<ISagaService> _sagaServiceMock;
    private readonly Mock<IIdempotencyService> _idempotencyServiceMock;
    private readonly Mock<IHttpClientFactory> _httpClientFactoryMock;
    private readonly Mock<IConfiguration> _configurationMock;
    private readonly OrderDbContext _dbContext;
    private readonly OrderProcessingService _service;

    public OrderProcessingServiceTests()
    {
        _loggerMock = new Mock<ILogger<OrderProcessingService>>();
        _paymentClientMock = new Mock<Payments.V1.PaymentService.PaymentServiceClient>();
        _inventoryClientMock = new Mock<Inventory.V1.InventoryService.InventoryServiceClient>();
        _sagaServiceMock = new Mock<ISagaService>();
        _idempotencyServiceMock = new Mock<IIdempotencyService>();
        _httpClientFactoryMock = new Mock<IHttpClientFactory>();
        _configurationMock = new Mock<IConfiguration>();

        _httpClientFactoryMock.Setup(x => x.CreateClient(It.IsAny<string>())).Returns(new HttpClient());

        var options = new DbContextOptionsBuilder<OrderDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _dbContext = new OrderDbContext(options);

        _service = new OrderProcessingService(
            _loggerMock.Object, 
            _paymentClientMock.Object, 
            _inventoryClientMock.Object,
            _dbContext,
            _sagaServiceMock.Object,
            _idempotencyServiceMock.Object,
            _httpClientFactoryMock.Object,
            _configurationMock.Object);
    }

    [Fact]
    public async Task CreateOrder_WhenPaymentSucceeds_ReturnsSuccess()
    {
        // Arrange
        var request = new CreateOrderRequest
        {
            UserId = "user-123",
        };
        request.Items.Add(new Orders.V1.OrderItem { ProductId = "prod-456", Quantity = 1, UnitPrice = 100.0 });

        var paymentResponse = new ProcessPaymentResponse
        {
            PaymentId = "pay-789",
            Success = true,
            StatusMessage = "Success"
        };

        var inventoryResponse = new BatchReserveStockResponse
        {
            Success = true,
            Message = "Success"
        };

        var mockPaymentCall = TestCalls.AsyncUnaryCall(paymentResponse, Task.FromResult(new Metadata()), () => Status.DefaultSuccess, () => new Metadata(), () => { });
        var mockInventoryCall = TestCalls.AsyncUnaryCall(inventoryResponse, Task.FromResult(new Metadata()), () => Status.DefaultSuccess, () => new Metadata(), () => { });

        _inventoryClientMock
            .Setup(c => c.BatchReserveStockAsync(It.IsAny<BatchReserveStockRequest>(), It.IsAny<Metadata>(), null, default))
            .Returns(mockInventoryCall);

        _paymentClientMock
            .Setup(c => c.ProcessPaymentAsync(It.IsAny<ProcessPaymentRequest>(), It.IsAny<Metadata>(), null, default))
            .Returns(mockPaymentCall);

        var context = new TestServerCallContext(new Metadata());

        // Act
        var result = await _service.CreateOrder(request, context);

        // Assert
        result.Status.Should().Be("SUCCESS");
        var savedOrder = await _dbContext.Orders.FirstOrDefaultAsync();
        savedOrder.Should().NotBeNull();
        savedOrder!.Status.Should().Be("COMPLETED");
    }
}

// Helper to mock gRPC AsyncUnaryCall
public static class TestCalls
{
    public static AsyncUnaryCall<TResponse> AsyncUnaryCall<TResponse>(
        TResponse response,
        Task<Metadata> responseHeaders,
        Func<Status> getStatus,
        Func<Metadata> getTrailers,
        Action dispose)
    {
        return new AsyncUnaryCall<TResponse>(
            Task.FromResult(response),
            responseHeaders,
            getStatus,
            getTrailers,
            dispose);
    }
}
