using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

namespace OrderService.Configuration;

public static class OpenTelemetryConfiguration
{
    public static void AddServiceTracing(this IServiceCollection services, IConfiguration configuration)
    {
        var serviceName = configuration["Service:Name"] ?? "OrderService";
        var serviceVersion = configuration["Service:Version"] ?? "1.0.0";

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
                .AddGrpcClientInstrumentation(options =>
                {
                    options.SuppressDownstreamInstrumentation = false;
                })
                .AddHttpClientInstrumentation()
                .AddEntityFrameworkCoreInstrumentation()
                .AddOtlpExporter(options =>
                {
                    options.Endpoint = new Uri(configuration["OpenTelemetry:Endpoint"] ?? "http://localhost:4317");
                }));
    }
}
