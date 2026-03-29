using Microsoft.Extensions.Configuration;
using Serilog;
using Serilog.Events;
using Serilog.Sinks.Grafana.Loki;

namespace OrderService.Configuration;

public static class LoggingConfiguration
{
    public static void ConfigureLogging(IConfiguration? configuration = null)
    {
        var lokiUrl = configuration?["Loki:Url"]
            ?? Environment.GetEnvironmentVariable("LOKI_URL")
            ?? "http://localhost:3100";
        var serviceName = configuration?["Service:Name"] ?? "OrderService";
        var serviceVersion = configuration?["Service:Version"] ?? "1.0.0";
        var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development";

        Log.Logger = new LoggerConfiguration()
            .MinimumLevel.Information()
            .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
            .Enrich.FromLogContext()
            .Enrich.WithProperty("service_name", serviceName)
            .Enrich.WithProperty("service_version", serviceVersion)
            .Enrich.WithProperty("environment", environment)
            .Enrich.WithMachineName()
            .Enrich.WithThreadId()
            .WriteTo.Console()
            .WriteTo.GrafanaLoki(
                lokiUrl,
                labels: new List<LokiLabel>
                {
                    new LokiLabel { Key = "service", Value = serviceName },
                    new LokiLabel { Key = "environment", Value = environment }
                },
                propertiesAsLabels: new[] { "level" })
            .CreateLogger();
    }
}
