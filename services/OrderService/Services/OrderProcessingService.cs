using Grpc.Core;
using Orders.V1;
using Payments.V1;
using Inventory.V1;
using OrderService.Data;

namespace OrderService.Services;

public class OrderProcessingService : Orders.V1.OrderService.OrderServiceBase
{
    private readonly ILogger<OrderProcessingService> _logger;
    private readonly Payments.V1.PaymentService.PaymentServiceClient _paymentClient;
    private readonly Inventory.V1.InventoryService.InventoryServiceClient _inventoryClient;
    private readonly OrderDbContext _dbContext;
    private readonly ISagaService _sagaService;
    private readonly IIdempotencyService _idempotencyService;

    public OrderProcessingService(
        ILogger<OrderProcessingService> logger, 
        Payments.V1.PaymentService.PaymentServiceClient paymentClient,
        Inventory.V1.InventoryService.InventoryServiceClient inventoryClient,
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

    public override async Task<CreateOrderResponse> CreateOrder(CreateOrderRequest request, ServerCallContext context)
    {
        // Metadata is optional for propagation because OpenTelemetry 
        // will automatically inject the trace context into the call.
        
        // Check for existing correlation ID or create new one
        var correlationId = context.RequestHeaders.GetValue("x-correlation-id") ?? Guid.NewGuid().ToString();
        var metadata = new Metadata { { "x-correlation-id", correlationId } };
        
        // Check for idempotency key
        var idempotencyKey = context.RequestHeaders.GetValue("x-idempotency-key");
        if (!string.IsNullOrEmpty(idempotencyKey))
        {
            var requestJson = System.Text.Json.JsonSerializer.Serialize(request);
            var idempotencyResult = await _idempotencyService.CheckAndSaveAsync(
                idempotencyKey, "gRPC:CreateOrder", requestJson);

            if (idempotencyResult.IsDuplicate)
            {
                if (idempotencyResult.IsProcessing)
                {
                    throw new RpcException(new Status(StatusCode.AlreadyExists, "Request is already being processed."));
                }

                if (idempotencyResult.CachedResponse != null)
                {
                    _logger.LogInformation("Returning cached response for idempotency key: {Key}", idempotencyKey);
                    return System.Text.Json.JsonSerializer.Deserialize<CreateOrderResponse>(idempotencyResult.CachedResponse)!;
                }
            }
        }

        // Ensure quantity is at least 1 if not provided (though proto default is 0)
        // Note: Using standard request properties (Renamed in proto to camelCase in C#)
        // ... rest of implementation stays the same, just checking field names ...
        // We'll need to check the field names in the next step to be 100% sure.

        // For now, we take the first item as the primary order data
        // (Maintaining backward compatibility with the current DB schema)
        var firstItem = request.Items.FirstOrDefault() ?? new OrderItem { ProductId = "unknown", Quantity = 1 };
        string productId = firstItem.ProductId;
        int quantity = firstItem.Quantity > 0 ? firstItem.Quantity : 1;
        double amount = request.TotalAmount; 

        _logger.LogInformation(
            "Creating order for user {UserId}, Product: {ProductId}, Qty: {Qty}, Amount: {Amount}",
            request.UserId, productId, quantity, amount);

        // 1. Persist Initial Order to Database
        var order = new Order
        {
            UserId = request.UserId,
            ProductId = productId,
            Amount = amount,
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

            var inventoryResponse = await _inventoryClient.ReserveStockAsync(new ReserveStockRequest
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

                var response = new CreateOrderResponse
                {
                    OrderId = order.Id.ToString(),
                    Status = "FAILED"
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
            
            var paymentResponse = await _paymentClient.ProcessPaymentAsync(new ProcessPaymentRequest
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

                await _inventoryClient.ReleaseStockAsync(new ReleaseStockRequest
                {
                    OrderId = order.Id.ToString(),
                    ProductId = order.ProductId,
                    Quantity = order.Quantity
                }, metadata);

                await _sagaService.LogStepAsync(order.Id, "StockReleaseCompleted", "Completed");
                await _sagaService.LogStepAsync(order.Id, "SagaCompensated", "Completed");

                order.Status = "PAYMENT_FAILED_STOCK_RELEASED";
                await _dbContext.SaveChangesAsync();

                var response = new CreateOrderResponse
                {
                    OrderId = order.Id.ToString(),
                    Status = "FAILED"
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

            // SUCCESS
            order.Status = "COMPLETED";
            await _dbContext.SaveChangesAsync();
            await _sagaService.LogStepAsync(order.Id, "OrderCompleted", "Completed");
            await _sagaService.LogStepAsync(order.Id, "SagaCompleted", "Completed");
            _logger.LogInformation("SAGA COMPLETED SUCCESSFULLY for Order {OrderId}", order.Id);

            var successResponse = new CreateOrderResponse
            {
                OrderId = order.Id.ToString(),
                Status = "SUCCESS"
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

    private async Task<CreateOrderResponse> ErrorResponse(Order order, string message, string? idempotencyKey = null)
    {
        var response = new CreateOrderResponse
        {
            OrderId = order.Id.ToString(),
            Status = "ERROR"
        };

        if (!string.IsNullOrEmpty(idempotencyKey))
            await _idempotencyService.SaveResponseAsync(idempotencyKey, 500, response);

        return response;
    }
}
