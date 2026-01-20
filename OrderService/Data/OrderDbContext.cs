using Microsoft.EntityFrameworkCore;

namespace OrderService.Data;

public class OrderDbContext : DbContext
{
    public OrderDbContext(DbContextOptions<OrderDbContext> options) : base(options)
    {
    }

    public DbSet<Order> Orders { get; set; } = null!;
    public DbSet<SagaLog> SagaLogs { get; set; } = null!;
    public DbSet<IdempotencyRecord> IdempotencyRecords { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Ensure the ID is generated if not provided
        modelBuilder.Entity<Order>()
            .Property(o => o.Id)
            .ValueGeneratedOnAdd();

        // SagaLog indexes for efficient querying
        modelBuilder.Entity<SagaLog>()
            .HasIndex(s => s.SagaId);

        modelBuilder.Entity<SagaLog>()
            .HasIndex(s => new { s.SagaId, s.Step });

        // IdempotencyRecord - key is already primary key
        modelBuilder.Entity<IdempotencyRecord>()
            .HasIndex(i => i.ExpiresAt);  // For cleanup queries
    }
}
