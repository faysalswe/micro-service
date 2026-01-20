using Serilog;
using Serilog.Events;
using Serilog.Sinks.Grafana.Loki;

namespace OrderService.Configuration;

public static class LoggingConfiguration
{
    public static void ConfigureLogging()
    {
        var lokiUrl = Environment.GetEnvironmentVariable("LOKI_URL") ?? "http://localhost:3100";

        Log.Logger = new LoggerConfiguration()
            .MinimumLevel.Information()
            .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
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
    }
}
