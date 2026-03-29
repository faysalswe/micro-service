using System.ComponentModel.DataAnnotations;

namespace OrderService.Data;

/// <summary>
/// Tracks saga execution steps for recovery and auditing
/// </summary>
public class SagaLog
{
    [Key]
    public Guid Id { get; set; }

    /// <summary>
    /// Unique identifier for this saga instance (usually the OrderId)
    /// </summary>
    [Required]
    public Guid SagaId { get; set; }

    /// <summary>
    /// Type of saga (e.g., "CreateOrder", "CancelOrder")
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string SagaType { get; set; } = string.Empty;

    /// <summary>
    /// Current step in the saga (e.g., "OrderCreated", "PaymentRequested", "PaymentCompleted")
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string Step { get; set; } = string.Empty;

    /// <summary>
    /// Status of this step: Pending, Completed, Failed, Compensated
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Pending";

    /// <summary>
    /// JSON payload with step-specific data
    /// </summary>
    public string? Payload { get; set; }

    /// <summary>
    /// Error message if the step failed
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// Correlation ID for distributed tracing
    /// </summary>
    [MaxLength(100)]
    public string? CorrelationId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? CompletedAt { get; set; }
}
