using OrderService.Services;
using OrderService.Data;
using Microsoft.EntityFrameworkCore;
using Microservice.Payments.Grpc;
using Polly;
using Polly.Extensions.Http;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using Serilog;
using Serilog.Context;
using Serilog.Sinks.Grafana.Loki;
using System.Diagnostics;
using Microsoft.Extensions.Diagnostics.HealthChecks;

// Configure Serilog FIRST (before WebApplicationBuilder)
var lokiUrl = Environment.GetEnvironmentVariable("LOKI_URL") ?? "http://localhost:3100";

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .Enrich.FromLogContext()
    .Enrich.WithProperty("service_name", "OrderService")
    .Enrich.WithProperty("service_version", "1.0.0")
    .Enrich.WithProperty("environment", Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development")
    .Enrich.WithMachineName()
    .Enrich.WithThreadId()
    .WriteTo.Console()
    .WriteTo.GrafanaLoki(
        lokiUrl,
        labels: new List<LokiLabel>
        {
            new LokiLabel { Key = "service", Value = "OrderService" },
            new LokiLabel { Key = "environment", Value = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development" }
        },
        propertiesAsLabels: new[] { "level" })
    .CreateLogger();

try
{
    Log.Information("Starting OrderService");

    var builder = WebApplication.CreateBuilder(args);

    // Use Serilog for logging
    builder.Host.UseSerilog();

    // Add services to the container.
    builder.Services.AddGrpc();

// Configure OpenTelemetry
builder.Services.AddOpenTelemetry()
    .ConfigureResource(resource => resource
        .AddService(
            serviceName: "OrderService",
            serviceVersion: "1.0.0"))
    .WithTracing(tracing => tracing
        .AddAspNetCoreInstrumentation(options =>
        {
            options.RecordException = true;
        })
        .AddGrpcClientInstrumentation(options =>
        {
            options.SuppressDownstreamInstrumentation = false;
        })
        .AddHttpClientInstrumentation()
        .AddEntityFrameworkCoreInstrumentation(options =>
        {
            options.SetDbStatementForText = true;
        })
        .AddOtlpExporter(options =>
        {
            options.Endpoint = new Uri(builder.Configuration["OpenTelemetry:Endpoint"] ?? "http://localhost:4317");
        }));

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
app.MapGrpcService<OrderProcessingService>();

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
