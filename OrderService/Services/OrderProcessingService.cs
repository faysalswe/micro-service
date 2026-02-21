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
    private readonly ISagaService _sagaService;
    private readonly IIdempotencyService _idempotencyService;

    public OrderProcessingService(
        ILogger<OrderProcessingService> logger, 
        PaymentService.PaymentServiceClient paymentClient,
        Inventory.InventoryService.InventoryServiceClient inventoryClient,
        OrderDbContext dbContext,
        ISagaService sagaService,
        IIdempotencyService idempotencyService)
    {
        _logger = logger;
        _paymentClient = paymentClient;
        _inventoryClient = inventoryClient;
        _dbContext = dbContext;
        _sagaService = sagaService;
        _idempotencyService = idempotencyService;
    }

    public override async Task<OrderResponse> CreateOrder(CreateOrderRequest request, ServerCallContext context)
    {
        var correlationId = context.RequestHeaders.GetValue("x-correlation-id") ?? Guid.NewGuid().ToString();
        var metadata = new Metadata { { "x-correlation-id", correlationId } };
        
        // Check for idempotency key
        var idempotencyKey = context.RequestHeaders.GetValue("x-idempotency-key");
        if (!string.IsNullOrEmpty(idempotencyKey))
        {
            var requestJson = System.Text.Json.JsonSerializer.Serialize(request);
            var idempotencyResult = await _idempotencyService.CheckAndSaveAsync(
                idempotencyKey, "gRPC:CreateOrder", requestJson);

            if (idempotencyResult.IsDuplicate && idempotencyResult.CachedResponse != null)
            {
                _logger.LogInformation("Returning cached response for idempotency key: {Key}", idempotencyKey);
                return System.Text.Json.JsonSerializer.Deserialize<OrderResponse>(idempotencyResult.CachedResponse)!;
            }
        }

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

        // Start saga and log first step
        await _sagaService.StartSagaAsync(order.Id, "CreateOrder", correlationId);
        await _sagaService.LogStepAsync(order.Id, "OrderCreated", "Completed",
            new { order.Id, order.UserId, order.ProductId, order.Amount, order.Quantity });

        _logger.LogInformation("Order persisted to database with ID: {OrderId}", order.Id);

        try 
        {
            // SAGA STEP 1: RESERVE INVENTORY
            _logger.LogInformation("SAGA STEP 1: Reserving stock for Order {OrderId}", order.Id);
            await _sagaService.LogStepAsync(order.Id, "InventoryReservationRequested", "Pending",
                new { order.Id, order.ProductId, order.Quantity });

            var inventoryResponse = await _inventoryClient.ReserveStockAsync(new ReserveRequest
            {
                OrderId = order.Id.ToString(),
                ProductId = order.ProductId,
                Quantity = order.Quantity
            }, metadata);

            if (!inventoryResponse.Success)
            {
                _logger.LogWarning("SAGA STEP 1 FAILED: {Message}", inventoryResponse.Message);
                await _sagaService.LogStepAsync(order.Id, "InventoryReservationFailed", "Failed",
                    new { inventoryResponse.Message });
                await _sagaService.LogStepAsync(order.Id, "SagaFailed", "Failed");

                order.Status = "INVENTORY_RESERVATION_FAILED";
                await _dbContext.SaveChangesAsync();

                var response = new OrderResponse
                {
                    OrderId = order.Id.ToString(),
                    Status = "FAILED",
                    Message = $"Inventory reservation failed: {inventoryResponse.Message}"
                };

                if (!string.IsNullOrEmpty(idempotencyKey))
                    await _idempotencyService.SaveResponseAsync(idempotencyKey, 200, response);

                return response;
            }

            await _sagaService.LogStepAsync(order.Id, "InventoryReservationCompleted", "Completed");
            _logger.LogInformation("SAGA STEP 1 SUCCESS: Stock reserved for Order {OrderId}", order.Id);

            // SAGA STEP 2: PROCESS PAYMENT
            _logger.LogInformation("SAGA STEP 2: Calling PaymentService for Order {OrderId}", order.Id);
            await _sagaService.LogStepAsync(order.Id, "PaymentRequested", "Pending",
                new { order.Id, order.Amount });
            
            var paymentResponse = await _paymentClient.ProcessPaymentAsync(new PaymentRequest
            {
                OrderId = order.Id.ToString(),
                Amount = order.Amount,
                UserId = order.UserId
            }, metadata);

            if (!paymentResponse.Success)
            {
                _logger.LogWarning("SAGA STEP 2 FAILED: {Message}", paymentResponse.StatusMessage);
                await _sagaService.LogStepAsync(order.Id, "PaymentFailed", "Failed",
                    new { paymentResponse.StatusMessage });
                
                // COMPENSATION FOR STEP 1
                _logger.LogInformation("TRIGGERING COMPENSATION: Releasing stock for Order {OrderId}", order.Id);
                await _sagaService.LogStepAsync(order.Id, "StockReleaseRequested", "Pending");

                await _inventoryClient.ReleaseStockAsync(new ReleaseRequest
                {
                    OrderId = order.Id.ToString(),
                    ProductId = order.ProductId,
                    Quantity = order.Quantity
                }, metadata);

                await _sagaService.LogStepAsync(order.Id, "StockReleaseCompleted", "Completed");
                await _sagaService.LogStepAsync(order.Id, "SagaCompensated", "Completed");

                order.Status = "PAYMENT_FAILED_STOCK_RELEASED";
                await _dbContext.SaveChangesAsync();

                var response = new OrderResponse
                {
                    OrderId = order.Id.ToString(),
                    Status = "FAILED",
                    Message = $"Payment failed: {paymentResponse.StatusMessage}. Inventory has been released."
                };

                if (!string.IsNullOrEmpty(idempotencyKey))
                    await _idempotencyService.SaveResponseAsync(idempotencyKey, 200, response);

                return response;
            }

            await _sagaService.LogStepAsync(order.Id, "PaymentCompleted", "Completed",
                new { paymentResponse.PaymentId });
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
                await _sagaService.LogStepAsync(order.Id, "RefundRequested", "Pending",
                    new { paymentResponse.PaymentId });

                await _paymentClient.RefundPaymentAsync(new RefundRequest
                {
                    PaymentId = paymentResponse.PaymentId,
                    Reason = "Saga finalization failed"
                }, metadata);

                await _sagaService.LogStepAsync(order.Id, "RefundCompleted", "Completed");

                // COMPENSATION FOR STEP 1: RELEASE STOCK
                _logger.LogInformation("TRIGGERING COMPENSATION: Releasing stock for Order {OrderId}", order.Id);
                await _sagaService.LogStepAsync(order.Id, "StockReleaseRequested", "Pending");

                await _inventoryClient.ReleaseStockAsync(new ReleaseRequest
                {
                    OrderId = order.Id.ToString(),
                    ProductId = order.ProductId,
                    Quantity = order.Quantity
                }, metadata);

                await _sagaService.LogStepAsync(order.Id, "StockReleaseCompleted", "Completed");
                await _sagaService.LogStepAsync(order.Id, "SagaCompensated", "Completed");

                order.Status = "FAILED_FULL_COMPENSATION_APPLIED";
                await _dbContext.SaveChangesAsync();

                var response = new OrderResponse
                {
                    OrderId = order.Id.ToString(),
                    Status = "FAILED",
                    Message = "Final processing failed. Payment refunded and inventory released."
                };

                if (!string.IsNullOrEmpty(idempotencyKey))
                    await _idempotencyService.SaveResponseAsync(idempotencyKey, 200, response);

                return response;
            }

            // SUCCESS
            order.Status = "COMPLETED";
            await _dbContext.SaveChangesAsync();
            await _sagaService.LogStepAsync(order.Id, "OrderCompleted", "Completed");
            await _sagaService.LogStepAsync(order.Id, "SagaCompleted", "Completed");
            _logger.LogInformation("SAGA COMPLETED SUCCESSFULLY for Order {OrderId}", order.Id);

            var successResponse = new OrderResponse
            {
                OrderId = order.Id.ToString(),
                Status = "SUCCESS",
                Message = "Order created and processed successfully."
            };

            if (!string.IsNullOrEmpty(idempotencyKey))
                await _idempotencyService.SaveResponseAsync(idempotencyKey, 200, successResponse);

            return successResponse;
        }
        catch (Polly.CircuitBreaker.BrokenCircuitException ex)
        {
            _logger.LogWarning(ex, "Circuit breaker OPEN. Failing fast for Order {OrderId}", order.Id);
            await _sagaService.FailStepAsync(order.Id, "ServiceCall", "Circuit breaker OPEN");
            return await ErrorResponse(order, "System is currently overloaded. Please try again later.", idempotencyKey);
        }
        catch (RpcException ex)
        {
            _logger.LogError(ex, "gRPC call failed: {StatusCode} - {Detail}", ex.StatusCode, ex.Status.Detail);
            await _sagaService.FailStepAsync(order.Id, "ServiceCall", ex.Message);
            return await ErrorResponse(order, $"Communication error with downstream services: {ex.Status.Detail}", idempotencyKey);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during Saga orchestration");
            await _sagaService.FailStepAsync(order.Id, "SagaOrchestration", ex.Message);
            return await ErrorResponse(order, "An unexpected error occurred.", idempotencyKey);
        }
    }

    private async Task<OrderResponse> ErrorResponse(Order order, string message, string? idempotencyKey = null)
    {
        var response = new OrderResponse
        {
            OrderId = order.Id.ToString(),
            Status = "ERROR",
            Message = message
        };

        if (!string.IsNullOrEmpty(idempotencyKey))
            await _idempotencyService.SaveResponseAsync(idempotencyKey, 500, response);

        return response;
    }
}
