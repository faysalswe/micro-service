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
    private readonly Loyalty.V1.LoyaltyService.LoyaltyServiceClient _loyaltyClient;
    private readonly OrderDbContext _dbContext;
    private readonly ISagaService _sagaService;
    private readonly IIdempotencyService _idempotencyService;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    public OrderProcessingService(
        ILogger<OrderProcessingService> logger, 
        Payments.V1.PaymentService.PaymentServiceClient paymentClient,
        Inventory.V1.InventoryService.InventoryServiceClient inventoryClient,
        Loyalty.V1.LoyaltyService.LoyaltyServiceClient loyaltyClient,
        OrderDbContext dbContext,
        ISagaService sagaService,
        IIdempotencyService idempotencyService,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration)
    {
        _logger = logger;
        _paymentClient = paymentClient;
        _inventoryClient = inventoryClient;
        _loyaltyClient = loyaltyClient;
        _dbContext = dbContext;
        _sagaService = sagaService;
        _idempotencyService = idempotencyService;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
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
        var firstItem = request.Items.FirstOrDefault() ?? new Orders.V1.OrderItem { ProductId = "unknown", Quantity = 1 };
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
            Status = "PENDING",
            CreatedAt = DateTime.UtcNow,
            LoyaltyPointsSpent = request.LoyaltyPointsToSpend,
            Items = request.Items.Select(i => new Data.OrderItem
            {
                ProductId = i.ProductId,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice
            }).ToList()
        };

        // Calculate total amount if not provided
        order.Amount = request.TotalAmount > 0 ? request.TotalAmount : order.Items.Sum(i => i.Quantity * i.UnitPrice);

        _dbContext.Orders.Add(order);
        await _dbContext.SaveChangesAsync();

        // Start saga and log first step
        await _sagaService.StartSagaAsync(order.Id, "CreateOrder", correlationId);
        await _sagaService.LogStepAsync(order.Id, "OrderCreated", "Completed",
            new { order.Id, order.UserId, order.Amount, ItemCount = order.Items.Count });

        _logger.LogInformation("Order persisted with {Count} items, ID: {OrderId}", order.Items.Count, order.Id);

        try 
        {
            // SAGA STEP 1: RESERVE INVENTORY (BATCH)
            _logger.LogInformation("SAGA STEP 1: Reserving batch stock for Order {OrderId}", order.Id);
            await _sagaService.LogStepAsync(order.Id, "InventoryReservationRequested", "Pending",
                new { order.Id, Items = order.Items.Select(i => new { i.ProductId, i.Quantity }) });

            var batchRequest = new BatchReserveStockRequest { OrderId = order.Id.ToString() };
            batchRequest.Items.AddRange(order.Items.Select(i => new BatchItem 
            { 
                ProductId = i.ProductId, 
                Quantity = i.Quantity 
            }));

            var inventoryResponse = await _inventoryClient.BatchReserveStockAsync(batchRequest, metadata);

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
            _logger.LogInformation("SAGA STEP 1 SUCCESS: Batch stock reserved for Order {OrderId}", order.Id);

            // SAGA STEP 2: DEDUCT LOYALTY POINTS (IF REQUESTED)
            if (order.LoyaltyPointsSpent > 0)
            {
                _logger.LogInformation("SAGA STEP 2: Deducting {Points} points for Order {OrderId}", order.LoyaltyPointsSpent, order.Id);
                await _sagaService.LogStepAsync(order.Id, "LoyaltyDeductionRequested", "Pending", new { order.LoyaltyPointsSpent });

                var loyaltyResponse = await _loyaltyClient.DeductLoyaltyPointsAsync(new Loyalty.V1.DeductLoyaltyPointsRequest
                {
                    UserId = order.UserId,
                    Points = order.LoyaltyPointsSpent,
                    OrderId = order.Id.ToString()
                }, metadata);

                if (!loyaltyResponse.Success)
                {
                    _logger.LogWarning("SAGA STEP 2 FAILED: {Message}", loyaltyResponse.Message);
                    await _sagaService.LogStepAsync(order.Id, "LoyaltyDeductionFailed", "Failed", new { loyaltyResponse.Message });

                    // COMPENSATION FOR STEP 1
                    await ReleaseStockAsync(order, metadata);
                    
                    order.Status = "LOYALTY_DEDUCTION_FAILED";
                    await _dbContext.SaveChangesAsync();
                    return await ErrorResponse(order, $"Loyalty error: {loyaltyResponse.Message}", idempotencyKey);
                }

                await _sagaService.LogStepAsync(order.Id, "LoyaltyDeductionCompleted", "Completed");
            }

            // SAGA STEP 3: PROCESS PAYMENT
            var amountToPay = order.Amount - (order.LoyaltyPointsSpent * 0.01); // 100 points = $1
            if (amountToPay < 0) amountToPay = 0;

            _logger.LogInformation("SAGA STEP 3: Calling PaymentService for Order {OrderId}. Net Amount: {Amount}", order.Id, amountToPay);
            await _sagaService.LogStepAsync(order.Id, "PaymentRequested", "Pending",
                new { order.Id, amountToPay });
            
            var paymentResponse = await _paymentClient.ProcessPaymentAsync(new ProcessPaymentRequest
            {
                OrderId = order.Id.ToString(),
                Amount = amountToPay,
                UserId = order.UserId
            }, metadata);

            if (!paymentResponse.Success)
            {
                _logger.LogWarning("SAGA STEP 3 FAILED: {Message}", paymentResponse.StatusMessage);
                await _sagaService.LogStepAsync(order.Id, "PaymentFailed", "Failed",
                    new { paymentResponse.StatusMessage });
                
                // COMPENSATION FOR STEP 2 (LOYALTY REFUND)
                if (order.LoyaltyPointsSpent > 0)
                {
                    _logger.LogInformation("TRIGGERING COMPENSATION: Refunding points for Order {OrderId}", order.Id);
                    await _sagaService.LogStepAsync(order.Id, "LoyaltyRefundRequested", "Pending");
                    await _loyaltyClient.RefundLoyaltyPointsAsync(new Loyalty.V1.RefundLoyaltyPointsRequest
                    {
                        UserId = order.UserId,
                        Points = order.LoyaltyPointsSpent,
                        OrderId = order.Id.ToString()
                    }, metadata);
                    await _sagaService.LogStepAsync(order.Id, "LoyaltyRefundCompleted", "Completed");
                }

                // COMPENSATION FOR STEP 1 (STOCK RELEASE)
                await ReleaseStockAsync(order, metadata);

                await _sagaService.LogStepAsync(order.Id, "SagaCompensated", "Completed");

                order.Status = "PAYMENT_FAILED_SAGA_REVERSED";
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
            _logger.LogInformation("SAGA STEP 3 SUCCESS: Payment processed for Order {OrderId}", order.Id);
            order.PaymentId = paymentResponse.PaymentId;

            // SAGA STEP 4: ADD EARNED POINTS (10% OF ORDER AMOUNT)
            order.LoyaltyPointsEarned = (int)(order.Amount * 10);
            _logger.LogInformation("SAGA STEP 4: Adding {Points} earned points for Order {OrderId}", order.LoyaltyPointsEarned, order.Id);
            await _sagaService.LogStepAsync(order.Id, "LoyaltyEarningRequested", "Pending", new { order.LoyaltyPointsEarned });
            
            await _loyaltyClient.AddLoyaltyPointsAsync(new Loyalty.V1.AddLoyaltyPointsRequest
            {
                UserId = order.UserId,
                Points = order.LoyaltyPointsEarned,
                OrderId = order.Id.ToString()
            }, metadata);
            
            await _sagaService.LogStepAsync(order.Id, "LoyaltyEarningCompleted", "Completed");

            await _dbContext.SaveChangesAsync();

            // SUCCESS
            order.Status = "COMPLETED";
            await _dbContext.SaveChangesAsync();
            await _sagaService.LogStepAsync(order.Id, "OrderCompleted", "Completed");

            // FIRE AND FORGET PDF GENERATION
            _ = TriggerPdfGeneration(order, correlationId);

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

    private async Task ReleaseStockAsync(Order order, Metadata metadata)
    {
        _logger.LogInformation("TRIGGERING COMPENSATION: Releasing batch stock for Order {OrderId}", order.Id);
        await _sagaService.LogStepAsync(order.Id, "StockReleaseRequested", "Pending");

        var releaseRequest = new BatchReleaseStockRequest { OrderId = order.Id.ToString() };
        releaseRequest.Items.AddRange(order.Items.Select(i => new BatchItem 
        { 
            ProductId = i.ProductId, 
            Quantity = i.Quantity 
        }));

        await _inventoryClient.BatchReleaseStockAsync(releaseRequest, metadata);
        await _sagaService.LogStepAsync(order.Id, "StockReleaseCompleted", "Completed");
    }

    private async Task TriggerPdfGeneration(Order order, string correlationId)
    {
        try
        {
            var pdfServiceUrl = _configuration["ExternalServices:PdfServiceUrl"];
            if (string.IsNullOrEmpty(pdfServiceUrl)) return;

            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Add("X-Correlation-ID", correlationId);

            var payload = new
            {
                order_id = order.Id.ToString(),
                user_id = order.UserId,
                customer_name = $"User {order.UserId}", // In reality, fetch from Identity
                total_amount = order.Amount,
                loyalty_spent = order.LoyaltyPointsSpent,
                loyalty_earned = order.LoyaltyPointsEarned,
                net_amount = order.Amount - (order.LoyaltyPointsSpent * 0.01),
                items = order.Items.Select(i => new 
                {
                    product_id = i.ProductId,
                    quantity = i.Quantity,
                    price = i.UnitPrice,
                    subtotal = i.Quantity * i.UnitPrice
                }).ToList()
            };

            var response = await client.PostAsJsonAsync($"{pdfServiceUrl}/api/pdf/generate/invoice", payload);
            
            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("PDF Invoice generation triggered for Order {OrderId}", order.Id);
            }
            else
            {
                _logger.LogWarning("Failed to trigger PDF for Order {OrderId}: {Status}", order.Id, response.StatusCode);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error triggering PDF generation for Order {OrderId}", order.Id);
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
