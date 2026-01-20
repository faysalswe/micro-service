using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OrderService.Data;
using Microservice.Payments.Grpc;
using Grpc.Core;

namespace OrderService.Controllers;

[ApiController]
[Route("api/orders")]
public class OrdersController : ControllerBase
{
    private readonly ILogger<OrdersController> _logger;
    private readonly OrderDbContext _dbContext;
    private readonly PaymentService.PaymentServiceClient _paymentClient;

    public OrdersController(
        ILogger<OrdersController> logger,
        OrderDbContext dbContext,
        PaymentService.PaymentServiceClient paymentClient)
    {
        _logger = logger;
        _dbContext = dbContext;
        _paymentClient = paymentClient;
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
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<OrderResponseDto>> CreateOrder([FromBody] CreateOrderDto request)
    {
        var correlationId = HttpContext.Request.Headers["X-Correlation-ID"].FirstOrDefault()
            ?? Guid.NewGuid().ToString();

        _logger.LogInformation(
            "REST: Creating order for user {UserId}, Product: {ProductId}, Amount: {Amount}",
            request.UserId, request.ProductId, request.Amount);

        // 1. Create and persist order
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

        _logger.LogInformation("Order persisted with ID: {OrderId}", order.Id);

        // 2. Call Payment Service via gRPC
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
                _logger.LogInformation("Payment successful for Order {OrderId}", order.Id);

                // Check for simulated failure
                if (request.ProductId == "fail-me")
                {
                    _logger.LogWarning("Simulated failure for Order {OrderId}, triggering refund", order.Id);

                    await _paymentClient.RefundPaymentAsync(new RefundRequest
                    {
                        PaymentId = paymentResponse.PaymentId,
                        Reason = "Simulated final step failure"
                    }, metadata);

                    order.Status = "CANCELLED_AFTER_FAILURE";
                    await _dbContext.SaveChangesAsync();

                    return Ok(new OrderResponseDto
                    {
                        OrderId = order.Id,
                        Status = "FAILED",
                        Message = "Order failed during processing. Payment refunded."
                    });
                }

                order.Status = "COMPLETED";
                order.PaymentId = paymentResponse.PaymentId;
                await _dbContext.SaveChangesAsync();

                return CreatedAtAction(nameof(GetOrder), new { id = order.Id }, new OrderResponseDto
                {
                    OrderId = order.Id,
                    Status = "SUCCESS",
                    Message = "Order completed successfully."
                });
            }
            else
            {
                order.Status = "PAYMENT_FAILED";
                await _dbContext.SaveChangesAsync();

                return BadRequest(new OrderResponseDto
                {
                    OrderId = order.Id,
                    Status = "FAILED",
                    Message = $"Payment failed: {paymentResponse.StatusMessage}"
                });
            }
        }
        catch (RpcException ex)
        {
            _logger.LogError(ex, "gRPC error for Order {OrderId}", order.Id);

            order.Status = "PAYMENT_SERVICE_ERROR";
            await _dbContext.SaveChangesAsync();

            return StatusCode(503, new OrderResponseDto
            {
                OrderId = order.Id,
                Status = "ERROR",
                Message = $"Payment service unavailable: {ex.Status.Detail}"
            });
        }
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
