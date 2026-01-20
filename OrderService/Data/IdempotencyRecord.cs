using System.ComponentModel.DataAnnotations;

namespace OrderService.Data;

/// <summary>
/// Stores idempotency keys to prevent duplicate request processing
/// </summary>
public class IdempotencyRecord
{
    [Key]
    [MaxLength(100)]
    public string IdempotencyKey { get; set; } = string.Empty;

    /// <summary>
    /// HTTP method + path that was called
    /// </summary>
    [Required]
    [MaxLength(255)]
    public string RequestPath { get; set; } = string.Empty;

    /// <summary>
    /// Hash of the request body for validation
    /// </summary>
    [MaxLength(64)]
    public string? RequestHash { get; set; }

    /// <summary>
    /// HTTP status code of the response
    /// </summary>
    public int ResponseStatusCode { get; set; }

    /// <summary>
    /// Cached response body (JSON)
    /// </summary>
    public string? ResponseBody { get; set; }

    /// <summary>
    /// When this record was created
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// When this record expires (for cleanup)
    /// </summary>
    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddHours(24);
}
