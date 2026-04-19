using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OrderService.Data;

public class Order
{
    [Key]
    public Guid Id { get; set; }
    
    [Required]
    public string UserId { get; set; } = string.Empty;
    
    [Range(0, double.MaxValue)]
    public double Amount { get; set; }

    [Required]
    public string Status { get; set; } = "PENDING";
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public string? PaymentId { get; set; }

    // Multi-product support
    public List<OrderItem> Items { get; set; } = new();
}

public class OrderItem
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid OrderId { get; set; }

    [Required]
    public string ProductId { get; set; } = string.Empty;

    [Range(1, int.MaxValue)]
    public int Quantity { get; set; }

    [Range(0, double.MaxValue)]
    public double UnitPrice { get; set; }
}
