using System.ComponentModel.DataAnnotations;

namespace OrderService.Data;

public class Order
{
    [Key]
    public Guid Id { get; set; }
    
    [Required]
    public string UserId { get; set; } = string.Empty;
    
    [Required]
    public string ProductId { get; set; } = string.Empty;
    
    [Range(0.01, double.MaxValue)]
    public double Amount { get; set; }

    [Range(1, int.MaxValue)]
    public int Quantity { get; set; } = 1;
    
    [Required]
    public string Status { get; set; } = "PENDING";
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // This field will store the PaymentId once received from the Payment service
    public string? PaymentId { get; set; }
}
