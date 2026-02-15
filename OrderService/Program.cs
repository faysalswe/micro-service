using OrderService.Services;
using OrderService.Data;
using OrderService.Configuration;
using Microsoft.EntityFrameworkCore;
using Microservice.Payments.Grpc;
using Polly;
using Polly.Extensions.Http;
using Serilog;
using Serilog.Context;
using System.Diagnostics;
using Scalar.AspNetCore;

// Build initial configuration for logging
var initialConfig = new ConfigurationBuilder()
    .AddJsonFile("appsettings.json", optional: true)
    .AddJsonFile($"appsettings.{Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development"}.json", optional: true)
    .AddEnvironmentVariables()
    .Build();

// Configure Serilog FIRST
LoggingConfiguration.ConfigureLogging(initialConfig);

try
{
    Log.Information("Starting OrderService");

    var builder = WebApplication.CreateBuilder(args);

    // Use Serilog for logging
    builder.Host.UseSerilog();

    // Add services to the container.
    builder.Services.AddGrpc();

    // Add REST API controllers
    builder.Services.AddControllers();

    // Add native OpenAPI
    builder.Services.AddOpenApi();
    builder.Services.AddServiceTracing(builder.Configuration);

    // Add Saga and Idempotency services
    builder.Services.AddScoped<ISagaService, SagaService>();
    builder.Services.AddScoped<IIdempotencyService, IdempotencyService>();

// Define Resilience Policies
var retryPolicy = HttpPolicyExtensions
    .HandleTransientHttpError()
    .WaitAndRetryAsync(3, retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)));

var circuitBreakerPolicy = HttpPolicyExtensions
    .HandleTransientHttpError()
    .CircuitBreakerAsync(5, TimeSpan.FromSeconds(30));

// Register gRPC Client for PaymentService with Resilience
builder.Services.AddGrpcClient<PaymentService.PaymentServiceClient>(o =>
{
    o.Address = new Uri(builder.Configuration["GrpcSettings:PaymentServiceUrl"] ?? "http://localhost:50051");
})
.AddPolicyHandler(retryPolicy)
.AddPolicyHandler(circuitBreakerPolicy);

// Add DbContext
builder.Services.AddDbContext<OrderDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add gRPC Health Checks for Kubernetes probes
builder.Services.AddGrpcHealthChecks()
    .AddNpgSql(builder.Configuration.GetConnectionString("DefaultConnection")!, name: "postgresql");

var app = builder.Build();

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

app.MapGet("/health", () => Results.Ok(new { status = "healthy", service = "OrderService", timestamp = DateTime.UtcNow }));

app.MapGet("/health/live", () => Results.Ok(new { status = "alive" }));

app.MapGet("/health/ready", async (OrderDbContext db) =>
{
    try
    {
        await db.Database.CanConnectAsync();
        return Results.Ok(new { status = "ready", database = "connected" });
    }
    catch (Exception ex)
    {
        Log.Warning(ex, "Readiness check failed - database connection issue");
        return Results.Json(new { status = "not_ready", database = "disconnected" }, statusCode: 503);
    }
});

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
