using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OrderService.Data;
using OrderService.Services;
using Microservice.Payments.Grpc;
using Grpc.Core;
using System.Text.Json;

namespace OrderService.Controllers;

[ApiController]
[Route("api/orders")]
public class OrdersController : ControllerBase
{
    private readonly ILogger<OrdersController> _logger;
    private readonly OrderDbContext _dbContext;
    private readonly PaymentService.PaymentServiceClient _paymentClient;
    private readonly ISagaService _sagaService;
    private readonly IIdempotencyService _idempotencyService;

    public OrdersController(
        ILogger<OrdersController> logger,
        OrderDbContext dbContext,
        PaymentService.PaymentServiceClient paymentClient,
        ISagaService sagaService,
        IIdempotencyService idempotencyService)
    {
        _logger = logger;
        _dbContext = dbContext;
        _paymentClient = paymentClient;
        _sagaService = sagaService;
        _idempotencyService = idempotencyService;
    }

    /// <summary>
    /// Get all orders (optionally filter by userId)
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<OrderDto>>> GetOrders([FromQuery] string? userId)
    {
        _logger.LogInformation("REST: Getting orders, userId filter: {UserId}", userId ?? "none");

        var query = _dbContext.Orders.AsQueryable();

        if (!string.IsNullOrEmpty(userId))
        {
            query = query.Where(o => o.UserId == userId);
        }

        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new OrderDto
            {
                Id = o.Id,
                UserId = o.UserId,
                ProductId = o.ProductId,
                Amount = o.Amount,
                Status = o.Status,
                PaymentId = o.PaymentId,
                CreatedAt = o.CreatedAt
            })
            .ToListAsync();

        return Ok(orders);
    }

    /// <summary>
    /// Get a specific order by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<OrderDto>> GetOrder(Guid id)
    {
        _logger.LogInformation("REST: Getting order {OrderId}", id);

        var order = await _dbContext.Orders.FindAsync(id);

        if (order == null)
        {
            return NotFound(new { message = $"Order {id} not found" });
        }

        return Ok(new OrderDto
        {
            Id = order.Id,
            UserId = order.UserId,
            ProductId = order.ProductId,
            Amount = order.Amount,
            Status = order.Status,
            PaymentId = order.PaymentId,
            CreatedAt = order.CreatedAt
        });
    }

    /// <summary>
    /// Create a new order (triggers payment processing)
    /// Uses saga pattern with step logging and idempotency support
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<OrderResponseDto>> CreateOrder([FromBody] CreateOrderDto request)
    {
        var correlationId = HttpContext.Request.Headers["X-Correlation-ID"].FirstOrDefault()
            ?? Guid.NewGuid().ToString();

        // Check for idempotency key
        var idempotencyKey = HttpContext.Request.Headers["X-Idempotency-Key"].FirstOrDefault();
        if (!string.IsNullOrEmpty(idempotencyKey))
        {
            var requestBody = JsonSerializer.Serialize(request);
            var idempotencyResult = await _idempotencyService.CheckAndSaveAsync(
                idempotencyKey, "POST /api/orders", requestBody);

            if (idempotencyResult.IsDuplicate && idempotencyResult.CachedResponse != null)
            {
                _logger.LogInformation("Returning cached response for idempotency key: {Key}", idempotencyKey);
                var cachedResponse = JsonSerializer.Deserialize<OrderResponseDto>(idempotencyResult.CachedResponse);
                return StatusCode(idempotencyResult.CachedStatusCode ?? 200, cachedResponse);
            }
        }

        _logger.LogInformation(
            "REST: Creating order for user {UserId}, Product: {ProductId}, Amount: {Amount}",
            request.UserId, request.ProductId, request.Amount);

        // SAGA STEP 1: Create and persist order
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

        // Start saga and log first step
        await _sagaService.StartSagaAsync(order.Id, "CreateOrder", correlationId);
        await _sagaService.LogStepAsync(order.Id, "OrderCreated", "Completed",
            new { order.Id, order.UserId, order.ProductId, order.Amount });

        _logger.LogInformation("Order persisted with ID: {OrderId}", order.Id);

        // SAGA STEP 2: Call Payment Service via gRPC
        await _sagaService.LogStepAsync(order.Id, "PaymentRequested", "Pending",
            new { order.Id, order.Amount });

        try
        {
            var metadata = new Metadata { { "x-correlation-id", correlationId } };

            var paymentResponse = await _paymentClient.ProcessPaymentAsync(new PaymentRequest
            {
                OrderId = order.Id.ToString(),
                Amount = order.Amount,
                UserId = order.UserId
            }, metadata);

            if (paymentResponse.Success)
            {
                await _sagaService.LogStepAsync(order.Id, "PaymentCompleted", "Completed",
                    new { paymentResponse.PaymentId });

                _logger.LogInformation("Payment successful for Order {OrderId}", order.Id);

                // Check for simulated failure (demonstrates compensating transaction)
                if (request.ProductId == "fail-me")
                {
                    _logger.LogWarning("Simulated failure for Order {OrderId}, triggering refund", order.Id);

                    // SAGA COMPENSATING TRANSACTION: Refund payment
                    await _sagaService.LogStepAsync(order.Id, "RefundRequested", "Pending",
                        new { paymentResponse.PaymentId, Reason = "Simulated final step failure" });

                    await _paymentClient.RefundPaymentAsync(new RefundRequest
                    {
                        PaymentId = paymentResponse.PaymentId,
                        Reason = "Simulated final step failure"
                    }, metadata);

                    await _sagaService.LogStepAsync(order.Id, "RefundCompleted", "Completed",
                        new { paymentResponse.PaymentId });
                    await _sagaService.LogStepAsync(order.Id, "SagaCompensated", "Completed");

                    order.Status = "CANCELLED_AFTER_FAILURE";
                    await _dbContext.SaveChangesAsync();

                    var failedResponse = new OrderResponseDto
                    {
                        OrderId = order.Id,
                        Status = "FAILED",
                        Message = "Order failed during processing. Payment refunded."
                    };

                    if (!string.IsNullOrEmpty(idempotencyKey))
                        await _idempotencyService.SaveResponseAsync(idempotencyKey, 200, failedResponse);

                    return Ok(failedResponse);
                }

                // SAGA STEP 3: Complete order
                await _sagaService.LogStepAsync(order.Id, "OrderCompleted", "Completed",
                    new { order.Id, paymentResponse.PaymentId });
                await _sagaService.LogStepAsync(order.Id, "SagaCompleted", "Completed");

                order.Status = "COMPLETED";
                order.PaymentId = paymentResponse.PaymentId;
                await _dbContext.SaveChangesAsync();

                var successResponse = new OrderResponseDto
                {
                    OrderId = order.Id,
                    Status = "SUCCESS",
                    Message = "Order completed successfully."
                };

                if (!string.IsNullOrEmpty(idempotencyKey))
                    await _idempotencyService.SaveResponseAsync(idempotencyKey, 201, successResponse);

                return CreatedAtAction(nameof(GetOrder), new { id = order.Id }, successResponse);
            }
            else
            {
                await _sagaService.LogStepAsync(order.Id, "PaymentFailed", "Failed",
                    new { paymentResponse.StatusMessage });
                await _sagaService.LogStepAsync(order.Id, "SagaFailed", "Failed",
                    null, $"Payment declined: {paymentResponse.StatusMessage}");

                order.Status = "PAYMENT_FAILED";
                await _dbContext.SaveChangesAsync();

                var failedResponse = new OrderResponseDto
                {
                    OrderId = order.Id,
                    Status = "FAILED",
                    Message = $"Payment failed: {paymentResponse.StatusMessage}"
                };

                if (!string.IsNullOrEmpty(idempotencyKey))
                    await _idempotencyService.SaveResponseAsync(idempotencyKey, 400, failedResponse);

                return BadRequest(failedResponse);
            }
        }
        catch (RpcException ex)
        {
            await _sagaService.FailStepAsync(order.Id, "PaymentRequested", ex.Message);
            await _sagaService.LogStepAsync(order.Id, "SagaFailed", "Failed",
                null, $"Payment service error: {ex.Status.Detail}");

            _logger.LogError(ex, "gRPC error for Order {OrderId}", order.Id);

            order.Status = "PAYMENT_SERVICE_ERROR";
            await _dbContext.SaveChangesAsync();

            var errorResponse = new OrderResponseDto
            {
                OrderId = order.Id,
                Status = "ERROR",
                Message = $"Payment service unavailable: {ex.Status.Detail}"
            };

            if (!string.IsNullOrEmpty(idempotencyKey))
                await _idempotencyService.SaveResponseAsync(idempotencyKey, 503, errorResponse);

            return StatusCode(503, errorResponse);
        }
    }

    /// <summary>
    /// Get saga history for an order
    /// </summary>
    [HttpGet("{id:guid}/saga")]
    public async Task<ActionResult<IEnumerable<SagaLogDto>>> GetSagaHistory(Guid id)
    {
        _logger.LogInformation("REST: Getting saga history for order {OrderId}", id);

        var history = await _sagaService.GetSagaHistoryAsync(id);

        var result = history.Select(s => new SagaLogDto
        {
            Id = s.Id,
            Step = s.Step,
            Status = s.Status,
            Payload = s.Payload,
            ErrorMessage = s.ErrorMessage,
            CreatedAt = s.CreatedAt,
            CompletedAt = s.CompletedAt
        });

        return Ok(result);
    }

    /// <summary>
    /// Cancel an order (if pending)
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> CancelOrder(Guid id)
    {
        _logger.LogInformation("REST: Cancelling order {OrderId}", id);

        var order = await _dbContext.Orders.FindAsync(id);

        if (order == null)
        {
            return NotFound(new { message = $"Order {id} not found" });
        }

        if (order.Status != "PENDING")
        {
            return BadRequest(new { message = $"Cannot cancel order with status: {order.Status}" });
        }

        order.Status = "CANCELLED";
        await _dbContext.SaveChangesAsync();

        return Ok(new { message = "Order cancelled", orderId = id });
    }
}

// DTOs
public record CreateOrderDto
{
    public required string UserId { get; init; }
    public required string ProductId { get; init; }
    public required double Amount { get; init; }
}

public record OrderDto
{
    public Guid Id { get; init; }
    public string UserId { get; init; } = string.Empty;
    public string ProductId { get; init; } = string.Empty;
    public double Amount { get; init; }
    public string Status { get; init; } = string.Empty;
    public string? PaymentId { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record OrderResponseDto
{
    public Guid OrderId { get; init; }
    public string Status { get; init; } = string.Empty;
    public string Message { get; init; } = string.Empty;
}

public record SagaLogDto
{
    public Guid Id { get; init; }
    public string Step { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string? Payload { get; init; }
    public string? ErrorMessage { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? CompletedAt { get; init; }
}
