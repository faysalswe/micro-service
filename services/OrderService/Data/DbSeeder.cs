using System;
using System.Collections.Generic;
using OrderService.Data;

namespace OrderService.Data;

/// <summary>
/// Static registry for default orders.
/// Physically separated from Program.cs but strictly type-safe.
/// </summary>
public static class DbSeeder
{
    public static List<Order> GetDefaultOrders()
    {
        return new List<Order>
        {
            new Order 
            { 
                Id = Guid.Parse("f284b868-e7c6-4318-8743-3453b3b44b20"), 
                UserId = "admin", 
                ProductId = "prod-001", 
                Amount = 999.99, 
                Quantity = 1, 
                Status = "COMPLETED", 
                CreatedAt = DateTime.UtcNow.AddDays(-1) 
            },
            new Order 
            { 
                Id = Guid.Parse("d7f57c5e-8e8e-4a4a-9b9b-1c1c1c1c1c1c"), 
                UserId = "admin", 
                ProductId = "prod-002", 
                Amount = 1199.00, 
                Quantity = 1, 
                Status = "COMPLETED", 
                CreatedAt = DateTime.UtcNow.AddHours(-5) 
            }
        };
    }
}
