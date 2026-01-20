using Microsoft.OpenApi;

namespace OrderService.Configuration;

public static class SwaggerConfiguration
{
    public static void AddSwaggerDocumentation(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "Order Service API",
                Version = "v1",
                Description = "API for managing orders and saga orchestration"
            });

            c.AddSecurityDefinition("IdempotencyKey", new OpenApiSecurityScheme
            {
                Description = "X-Idempotency-Key header for idempotent requests",
                In = ParameterLocation.Header,
                Name = "X-Idempotency-Key",
                Type = SecuritySchemeType.ApiKey,
                Scheme = "ApiKeyScheme"
            });

            c.AddSecurityRequirement(doc => new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecuritySchemeReference("IdempotencyKey", doc),
                    new List<string>()
                }
            });
        });
    }

    public static void UseSwaggerDocumentation(this IApplicationBuilder app, IWebHostEnvironment env)
    {
        if (env.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI(c =>
            {
                c.SwaggerEndpoint("/swagger/v1/swagger.json", "Order Service API v1");
            });
        }
    }
}
