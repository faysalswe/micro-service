using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using IdentityService.Data;

namespace IdentityService.Endpoints;

public static class HealthEndpoints
{
    public static void MapHealthEndpoints(this IEndpointRouteBuilder app, string appVersion)
    {
        app.MapGet("/health", () => Results.Ok(new { 
            status = "healthy", 
            service = "IdentityService", 
            version = appVersion, 
            timestamp = DateTime.UtcNow 
        }));

        app.MapGet("/health/live", () => Results.Ok(new { status = "alive" }));

        app.MapGet("/health/ready", async (IdentityDbContext db) =>
        {
            try
            {
                await db.Database.CanConnectAsync();
                return Results.Ok(new { status = "ready", database = "connected" });
            }
            catch (Exception ex)
            {
                return Results.Json(new { status = "not_ready", database = "disconnected", error = ex.Message }, statusCode: 503);
            }
        });
    }
}
