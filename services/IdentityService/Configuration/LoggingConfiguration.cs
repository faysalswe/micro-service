using Microsoft.Extensions.Configuration;
using Serilog;
using Serilog.Events;
using Serilog.Sinks.OpenTelemetry;

namespace IdentityService.Configuration;

public static class LoggingConfiguration
{
    public static void ConfigureLogging(IConfiguration? configuration = null)
    {
        // Check for the standard OTel environment variable
        var endpoint = Environment.GetEnvironmentVariable("OTEL_EXPORTER_OTLP_ENDPOINT");
        
        var loggerConfig = new LoggerConfiguration()
            .MinimumLevel.Information()
            .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
            .Enrich.FromLogContext()
            .WriteTo.Console();

        if (!string.IsNullOrEmpty(endpoint)) {
            Console.WriteLine($"[OBSERVABILITY] ✅ Unified OTLP Logging ENABLED. Exporting to: {endpoint}");
            
            // Send logs to the OTel Collector via OTLP
            loggerConfig.WriteTo.OpenTelemetry(options => {
                options.Endpoint = endpoint;
                options.Protocol = OtlpProtocol.Grpc;
                options.ResourceAttributes = new Dictionary<string, object>
                {
                    ["service.name"] = configuration?["Service:Name"] ?? "IdentityService"
                };
            });
        } else {
            Console.WriteLine("[OBSERVABILITY] ⚠️ OTEL_EXPORTER_OTLP_ENDPOINT not found. OTLP Logging is DISABLED.");
        }

        Log.Logger = loggerConfig.CreateLogger();
    }
}
