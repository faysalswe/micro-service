using System.Diagnostics;
using Microsoft.EntityFrameworkCore;
using OrderService.Configuration;
using OrderService.Data;
using OrderService.Services;
using OrderService.Endpoints;
using Scalar.AspNetCore;
using Serilog;
using Serilog.Context;

try
{
    var builder = WebApplication.CreateBuilder(args);

    // The .NET Way: Standard configuration automatically includes JSON and Env Vars
    LoggingConfiguration.ConfigureLogging(builder.Configuration);
    Log.Information("Starting OrderService");

    // Add services to the container.
    builder.Services.AddServiceTracing(builder.Configuration);
    builder.Services.AddGrpc();
    builder.Services.AddGrpcHealthChecks();
    builder.Services.AddControllers();
    builder.Services.AddOpenApi();
    builder.Services.AddHttpClient();

    // Register local services
    builder.Services.AddScoped<ISagaService, SagaService>();
    builder.Services.AddScoped<IIdempotencyService, IdempotencyService>();

    // Register gRPC Clients
    builder.Services.AddGrpcClient<Payments.V1.PaymentService.PaymentServiceClient>(o =>
    {
        o.Address = new Uri(builder.Configuration["GrpcSettings:PaymentServiceUrl"]!);
    });

    builder.Services.AddGrpcClient<Inventory.V1.InventoryService.InventoryServiceClient>(o =>
    {
        o.Address = new Uri(builder.Configuration["GrpcSettings:InventoryServiceUrl"]!);
    });

    // Use Serilog for logging
    builder.Host.UseSerilog();

    // Database Configuration (PostgreSQL)
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    builder.Services.AddDbContext<OrderDbContext>(options =>
        options.UseNpgsql(connectionString));

    var app = builder.Build();

    // Apply database migrations on startup
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<OrderDbContext>();
        db.Database.Migrate();

        if (!db.Orders.Any())
        {
            var defaultOrders = DbSeeder.GetDefaultOrders();
            db.Orders.AddRange(defaultOrders);
            db.SaveChanges();
            Log.Information("✅ Order database seeded with {Count} sample orders from DbSeeder", defaultOrders.Count);
        }
    }

    // Add middleware to enrich logs with trace context
    app.Use(async (context, next) =>
    {
        var activity = Activity.Current;
        if (activity != null)
        {
            using (LogContext.PushProperty("trace_id", activity.TraceId.ToString()))
            using (LogContext.PushProperty("span_id", activity.SpanId.ToString()))
            {
                // Check for X-Correlation-ID header
                if (context.Request.Headers.TryGetValue("X-Correlation-ID", out var correlationId))
                {
                    using (LogContext.PushProperty("correlation_id", correlationId.ToString()))
                    {
                        await next();
                    }
                }
                else
                {
                    await next();
                }
            }
        }
        else
        {
            await next();
        }
    });

    // Configure the HTTP request pipeline.
    app.MapOpenApi();
    app.MapScalarApiReference();

    app.MapGrpcService<OrderProcessingService>();

    // Map REST API controllers
    app.MapControllers();

    // Map gRPC health check service for Kubernetes probes (grpc_health_probe)
    app.MapGrpcHealthChecksService();

    // HTTP health endpoints for compatibility with HTTP-based probes
    app.MapGet("/", () => "Communication with gRPC endpoints must be made through a gRPC client. To learn how to create a client, visit: https://go.microsoft.com/fwlink/?linkid=2086909");

    var appVersion = builder.Configuration["Service:Version"]!;
    app.MapHealthEndpoints(appVersion);

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "OrderService terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
