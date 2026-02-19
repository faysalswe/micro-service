using Grpc.Core;
using Microservice.Orders.Grpc;
using Microservice.Payments.Grpc;
using Inventory; // Inventory.Grpc
using OrderService.Data;

namespace OrderService.Services;

public class OrderProcessingService : Microservice.Orders.Grpc.OrderService.OrderServiceBase
{
    private readonly ILogger<OrderProcessingService> _logger;
    private readonly PaymentService.PaymentServiceClient _paymentClient;
    private readonly Inventory.InventoryService.InventoryServiceClient _inventoryClient;
    private readonly OrderDbContext _dbContext;

    public OrderProcessingService(
        ILogger<OrderProcessingService> logger, 
        PaymentService.PaymentServiceClient paymentClient,
        Inventory.InventoryService.InventoryServiceClient inventoryClient,
        OrderDbContext dbContext)
    {
        _logger = logger;
        _paymentClient = paymentClient;
        _inventoryClient = inventoryClient;
        _dbContext = dbContext;
    }

    public override async Task<OrderResponse> CreateOrder(CreateOrderRequest request, ServerCallContext context)
    {
        var correlationId = context.RequestHeaders.GetValue("x-correlation-id") ?? Guid.NewGuid().ToString();
        var metadata = new Metadata { { "x-correlation-id", correlationId } };
        
        // Ensure quantity is at least 1 if not provided (though proto default is 0)
        int quantity = request.Quantity > 0 ? request.Quantity : 1;

        _logger.LogInformation(
            "Creating order for user {UserId}, Product: {ProductId}, Qty: {Qty}, Amount: {Amount}",
            request.UserId, request.ProductId, quantity, request.Amount);

        // 1. Persist Initial Order to Database
        var order = new Order
        {
            UserId = request.UserId,
            ProductId = request.ProductId,
            Amount = request.Amount,
            Quantity = quantity,
            Status = "PENDING",
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Orders.Add(order);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Order persisted to database with ID: {OrderId}", order.Id);

        try 
        {
            // SAGA STEP 1: RESERVE INVENTORY
            _logger.LogInformation("SAGA STEP 1: Reserving stock for Order {OrderId}", order.Id);
            var inventoryResponse = await _inventoryClient.ReserveStockAsync(new ReserveRequest
            {
                OrderId = order.Id.ToString(),
                ProductId = order.ProductId,
                Quantity = order.Quantity
            }, metadata);

            if (!inventoryResponse.Success)
            {
                _logger.LogWarning("SAGA STEP 1 FAILED: {Message}", inventoryResponse.Message);
                order.Status = "INVENTORY_RESERVATION_FAILED";
                await _dbContext.SaveChangesAsync();

                return new OrderResponse
                {
                    OrderId = order.Id.ToString(),
                    Status = "FAILED",
                    Message = $"Inventory reservation failed: {inventoryResponse.Message}"
                };
            }

            _logger.LogInformation("SAGA STEP 1 SUCCESS: Stock reserved for Order {OrderId}", order.Id);

            // SAGA STEP 2: PROCESS PAYMENT
            _logger.LogInformation("SAGA STEP 2: Calling PaymentService for Order {OrderId}", order.Id);
            
            var paymentResponse = await _paymentClient.ProcessPaymentAsync(new PaymentRequest
            {
                OrderId = order.Id.ToString(),
                Amount = order.Amount,
                UserId = order.UserId
            }, metadata);

            if (!paymentResponse.Success)
            {
                _logger.LogWarning("SAGA STEP 2 FAILED: {Message}", paymentResponse.StatusMessage);
                
                // COMPENSATION FOR STEP 1
                _logger.LogInformation("TRIGGERING COMPENSATION: Releasing stock for Order {OrderId}", order.Id);
                await _inventoryClient.ReleaseStockAsync(new ReleaseRequest
                {
                    OrderId = order.Id.ToString(),
                    ProductId = order.ProductId,
                    Quantity = order.Quantity
                }, metadata);

                order.Status = "PAYMENT_FAILED_STOCK_RELEASED";
                await _dbContext.SaveChangesAsync();

                return new OrderResponse
                {
                    OrderId = order.Id.ToString(),
                    Status = "FAILED",
                    Message = $"Payment failed: {paymentResponse.StatusMessage}. Inventory has been released."
                };
            }

            _logger.LogInformation("SAGA STEP 2 SUCCESS: Payment processed for Order {OrderId}", order.Id);
            order.PaymentId = paymentResponse.PaymentId;
            await _dbContext.SaveChangesAsync();

            // SAGA STEP 3: FINALIZE
            // Force failure if product is "fail-me" to test full compensation chain
            if (request.ProductId == "fail-me")
            {
                _logger.LogWarning("SAGA STEP 3 FAILED: Mocked failure for testing compensation chain");

                // COMPENSATION FOR STEP 2: REFUND
                _logger.LogInformation("TRIGGERING COMPENSATION: Refunding payment {PaymentId}", paymentResponse.PaymentId);
                await _paymentClient.RefundPaymentAsync(new RefundRequest
                {
                    PaymentId = paymentResponse.PaymentId,
                    Reason = "Saga finalization failed"
                }, metadata);

                // COMPENSATION FOR STEP 1: RELEASE STOCK
                _logger.LogInformation("TRIGGERING COMPENSATION: Releasing stock for Order {OrderId}", order.Id);
                await _inventoryClient.ReleaseStockAsync(new ReleaseRequest
                {
                    OrderId = order.Id.ToString(),
                    ProductId = order.ProductId,
                    Quantity = order.Quantity
                }, metadata);

                order.Status = "FAILED_FULL_COMPENSATION_APPLIED";
                await _dbContext.SaveChangesAsync();

                return new OrderResponse
                {
                    OrderId = order.Id.ToString(),
                    Status = "FAILED",
                    Message = "Final processing failed. Payment refunded and inventory released."
                };
            }

            // SUCCESS
            order.Status = "COMPLETED";
            await _dbContext.SaveChangesAsync();
            _logger.LogInformation("SAGA COMPLETED SUCCESSFULLY for Order {OrderId}", order.Id);

            return new OrderResponse
            {
                OrderId = order.Id.ToString(),
                Status = "SUCCESS",
                Message = "Order created and processed successfully."
            };
        }
        catch (Polly.CircuitBreaker.BrokenCircuitException ex)
        {
            _logger.LogWarning(ex, "Circuit breaker OPEN. Failing fast for Order {OrderId}", order.Id);
            return ErrorResponse(order, "System is currently overloaded. Please try again later.");
        }
        catch (RpcException ex)
        {
            _logger.LogError(ex, "gRPC call failed: {StatusCode} - {Detail}", ex.StatusCode, ex.Status.Detail);
            return ErrorResponse(order, $"Communication error with downstream services: {ex.Status.Detail}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during Saga orchestration");
            return ErrorResponse(order, "An unexpected error occurred.");
        }
    }

    private OrderResponse ErrorResponse(Order order, string message)
    {
        return new OrderResponse
        {
            OrderId = order.Id.ToString(),
            Status = "ERROR",
            Message = message
        };
    }
}
