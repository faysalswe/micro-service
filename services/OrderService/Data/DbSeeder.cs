using OrderService.Data;

namespace OrderService.Data;

public static class DbSeeder
{
    public static List<Order> GetDefaultOrders()
    {
        return new List<Order>
        {
            new Order
            {
                Id = Guid.NewGuid(),
                UserId = "user_1",
                Amount = 149.99,
                Status = "COMPLETED",
                CreatedAt = DateTime.UtcNow.AddDays(-2),
                Items = new List<OrderItem>
                {
                    new OrderItem { ProductId = "prod_001", Quantity = 1, UnitPrice = 149.99 }
                }
            },
            new Order
            {
                Id = Guid.NewGuid(),
                UserId = "user_2",
                Amount = 89.50,
                Status = "PENDING",
                CreatedAt = DateTime.UtcNow.AddMinutes(-30),
                Items = new List<OrderItem>
                {
                    new OrderItem { ProductId = "prod_002", Quantity = 2, UnitPrice = 44.75 }
                }
            }
        };
    }
}
