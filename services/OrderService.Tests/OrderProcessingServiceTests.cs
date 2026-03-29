using Moq;
using Grpc.Core;
using Microservice.Orders.Grpc;
using Microservice.Payments.Grpc;
using OrderService.Data;
using OrderService.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using FluentAssertions;
using Xunit;

namespace OrderService.Tests;

public class OrderProcessingServiceTests
{
    private readonly Mock<ILogger<OrderProcessingService>> _loggerMock;
    private readonly Mock<PaymentService.PaymentServiceClient> _paymentClientMock;
    private readonly Mock<Inventory.InventoryService.InventoryServiceClient> _inventoryClientMock;
    private readonly Mock<ISagaService> _sagaServiceMock;
    private readonly Mock<IIdempotencyService> _idempotencyServiceMock;
    private readonly OrderDbContext _dbContext;
    private readonly OrderProcessingService _service;

    public OrderProcessingServiceTests()
    {
        _loggerMock = new Mock<ILogger<OrderProcessingService>>();
        _paymentClientMock = new Mock<PaymentService.PaymentServiceClient>();
        _inventoryClientMock = new Mock<Inventory.InventoryService.InventoryServiceClient>();
        _sagaServiceMock = new Mock<ISagaService>();
        _idempotencyServiceMock = new Mock<IIdempotencyService>();

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
            _idempotencyServiceMock.Object);
    }

    [Fact]
    public async Task CreateOrder_WhenPaymentSucceeds_ReturnsSuccess()
    {
        // Arrange
        var request = new CreateOrderRequest
        {
            UserId = "user-123",
            ProductId = "prod-456",
            Amount = 100
        };

        var paymentResponse = new PaymentResponse
        {
            PaymentId = "pay-789",
            Success = true,
            StatusMessage = "Success"
        };

        var mockCall = TestCalls.AsyncUnaryCall(paymentResponse, Task.FromResult(new Metadata()), () => Status.DefaultSuccess, () => new Metadata(), () => { });

        _paymentClientMock
            .Setup(c => c.ProcessPaymentAsync(It.IsAny<PaymentRequest>(), It.IsAny<Metadata>(), null, default))
            .Returns(mockCall);

        var context = new Mock<ServerCallContext>();
        context.Setup(c => c.RequestHeaders).Returns(new Metadata());

        // Act
        var result = await _service.CreateOrder(request, context.Object);

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
