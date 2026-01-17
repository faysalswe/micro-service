using Grpc.Core;
using Microservice.Orders.Grpc;
using Microservice.Payments.Grpc;
using OrderService.Data;

namespace OrderService.Services;

public class OrderProcessingService : Microservice.Orders.Grpc.OrderService.OrderServiceBase
{
    private readonly ILogger<OrderProcessingService> _logger;
    private readonly PaymentService.PaymentServiceClient _paymentClient;
    private readonly OrderDbContext _dbContext;

    public OrderProcessingService(
        ILogger<OrderProcessingService> logger, 
        PaymentService.PaymentServiceClient paymentClient,
        OrderDbContext dbContext)
    {
        _logger = logger;
        _paymentClient = paymentClient;
        _dbContext = dbContext;
    }

    public override async Task<OrderResponse> CreateOrder(CreateOrderRequest request, ServerCallContext context)
    {
        var correlationId = context.RequestHeaders.GetValue("x-correlation-id") ?? Guid.NewGuid().ToString();
        _logger.LogInformation("[{CorrelationId}] Creating order for user {UserId}", correlationId, request.UserId);

        // 1. Persist Order to Database (Step 6)
        var order = new Order
        {
            UserId = request.UserId,
            ProductId = request.ProductId,
            Amount = request.Amount,
            Status = "PENDING",
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Orders.Add(order);
        await _dbContext.SaveChangesAsync();

        // 2. Call Payment Service (Step 9 - gRPC Communication)
        _logger.LogInformation("[{CorrelationId}] Calling PaymentService for Order {OrderId}", correlationId, order.Id);
        
        var metadata = new Metadata { { "x-correlation-id", correlationId } };
        
        try 
        {
            var paymentResponse = await _paymentClient.ProcessPaymentAsync(new PaymentRequest
            {
                OrderId = order.Id.ToString(),
                Amount = order.Amount,
                UserId = order.UserId
            }, metadata);

            if (paymentResponse.Success)
            {
                _logger.LogInformation("[{CorrelationId}] Payment successful. Proceeding to final step...", correlationId);

                // 3. Mock the "Final Step" (e.g., Inventory Reservation)
                // We will force a failure if the product ID is "fail-me" to test compensation
                if (request.ProductId == "fail-me")
                {
                    _logger.LogWarning("[{CorrelationId}] Final step failed! Triggering COMPENSATING TRANSACTION (Refund)...", correlationId);
                    
                    try 
                    {
                        await _paymentClient.RefundPaymentAsync(new RefundRequest
                        {
                            PaymentId = paymentResponse.PaymentId,
                            Reason = "Final order processing step failed."
                        }, metadata);
                        
                        _logger.LogInformation("[{CorrelationId}] Compensation: Refund processed successfully.", correlationId);
                    }
                    catch (Exception refundEx)
                    {
                        _logger.LogCritical(refundEx, "[{CorrelationId}] FATAL: Compensation (Refund) failed! Manual intervention required.", correlationId);
                    }

                    order.Status = "CANCELLED_AFTER_FAILURE";
                    await _dbContext.SaveChangesAsync();

                    return new OrderResponse
                    {
                        OrderId = order.Id.ToString(),
                        Status = "FAILED",
                        Message = "Order failed during final processing. Payment has been refunded."
                    };
                }

                order.Status = "COMPLETED";
                await _dbContext.SaveChangesAsync();

                return new OrderResponse
                {
                    OrderId = order.Id.ToString(),
                    Status = "SUCCESS",
                    Message = "Order completed successfully."
                };
            }
            else
            {
                order.Status = "PAYMENT_FAILED";
                await _dbContext.SaveChangesAsync();

                return new OrderResponse
                {
                    OrderId = order.Id.ToString(),
                    Status = "FAILED",
                    Message = $"Payment failed: {paymentResponse.StatusMessage}"
                };
            }
        }
        catch (Polly.CircuitBreaker.BrokenCircuitException ex)
        {
            _logger.LogWarning(ex, "[{CorrelationId}] Circuit represents as OPEN. Failing fast.", correlationId);
            order.Status = "SYSTEM_OVERLOADED_RETRY_LATER";
            await _dbContext.SaveChangesAsync();

            return new OrderResponse
            {
                OrderId = order.Id.ToString(),
                Status = "ERROR",
                Message = "System is currently overloaded. Please try again later."
            };
        }
        catch (RpcException ex)
        {
            _logger.LogError(ex, "[{CorrelationId}] gRPC call to PaymentService failed", correlationId);
            return new OrderResponse
            {
                OrderId = order.Id.ToString(),
                Status = "ERROR",
                Message = $"Communication error with Payment Service: {ex.Status.Detail}"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[{CorrelationId}] Unexpected error during gRPC call", correlationId);
            return new OrderResponse
            {
                OrderId = order.Id.ToString(),
                Status = "ERROR",
                Message = "An unexpected error occurred."
            };
        }
    }
}
