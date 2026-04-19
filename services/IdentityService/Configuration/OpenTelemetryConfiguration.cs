using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

namespace IdentityService.Configuration;

public static class OpenTelemetryConfiguration
{
    public static void AddServiceTracing(this IServiceCollection services, IConfiguration configuration)
    {
        var serviceName = configuration["Service:Name"]!;
        var serviceVersion = configuration["Service:Version"]!;

        // Check for the standard OTel environment variable
        var endpoint = Environment.GetEnvironmentVariable("OTEL_EXPORTER_OTLP_ENDPOINT");

        if (string.IsNullOrEmpty(endpoint))
        {
            Console.WriteLine("[OBSERVABILITY] ⚠️ OTEL_EXPORTER_OTLP_ENDPOINT not found. Tracing is DISABLED.");
            return;
        }

        Console.WriteLine($"[OBSERVABILITY] ✅ Tracing ENABLED for IdentityService. Exporting to: {endpoint} (Auto-Config)");

        services.AddOpenTelemetry()
            .ConfigureResource(resource => resource
                .AddService(
                    serviceName: serviceName,
                    serviceVersion: serviceVersion))
            .WithTracing(tracing => tracing
                .AddAspNetCoreInstrumentation(options =>
                {
                    options.RecordException = true;
                })
                .AddHttpClientInstrumentation()
                .AddEntityFrameworkCoreInstrumentation()
                .AddOtlpExporter()); // Auto-detects OTEL_EXPORTER_OTLP_ENDPOINT
    }
}
