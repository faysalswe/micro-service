using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using OrderService.Data;
using Serilog;

namespace OrderService.Endpoints;

public static class HealthEndpoints
{
    public static void MapHealthEndpoints(this IEndpointRouteBuilder app, string appVersion)
    {
        app.MapGet("/health", () => Results.Ok(new { 
            status = "healthy", 
            service = "OrderService", 
            version = appVersion, 
            timestamp = DateTime.UtcNow 
        }));

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
    }
}
