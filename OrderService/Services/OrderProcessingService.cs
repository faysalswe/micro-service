using Grpc.Core;
using Microservice.Orders.Grpc;

namespace OrderService.Services;

public class OrderProcessingService : Microservice.Orders.Grpc.OrderService.OrderServiceBase
{
    private readonly ILogger<OrderProcessingService> _logger;

    public OrderProcessingService(ILogger<OrderProcessingService> logger)
    {
        _logger = logger;
    }

    public override Task<OrderResponse> CreateOrder(CreateOrderRequest request, ServerCallContext context)
    {
        _logger.LogInformation("Creating order for user {UserId} and product {ProductId}", request.UserId, request.ProductId);

        // Placeholder logic for Step 2
        return Task.FromResult(new OrderResponse
        {
            OrderId = Guid.NewGuid().ToString(),
            Status = "PENDING",
            Message = "Order received and is being processed by the Orchestrator."
        });
    }
}
