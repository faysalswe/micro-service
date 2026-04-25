using IdentityService.Data;
using IdentityService.Configuration;
using IdentityService.Endpoints;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using Serilog;

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
    Log.Information("Starting IdentityService");

    var builder = WebApplication.CreateBuilder(args);

    // Dynamically log all configured Kestrel endpoints and API Documentation
    var kestrelEndpoints = builder.Configuration.GetSection("Kestrel:Endpoints").GetChildren();
    foreach (var endpoint in kestrelEndpoints)
    {
        var name = endpoint.Key;
        var url = endpoint["Url"] ?? "unknown";
        var protocols = endpoint["Protocols"] ?? "default";
        
        Log.Information("Configured Endpoint: {Name} -> {Url} ({Protocols})", name, url, protocols);

        // If this is an HTTP endpoint, log the Doc paths
        if (protocols.Contains("Http1", StringComparison.OrdinalIgnoreCase) || name.Contains("Http", StringComparison.OrdinalIgnoreCase))
        {
            var cleanUrl = url.Replace("0.0.0.0", "localhost").Replace("+", "localhost").Replace("*", "localhost");
            Log.Information("API Documentation (Scalar): {DocUrl}/scalar/v1", cleanUrl);
        }
    }

    // Use Serilog for logging
    builder.Host.UseSerilog();

    // Add services to the container.
    builder.Services.AddServiceTracing(builder.Configuration);
    builder.Services.AddOpenApi();
    builder.Services.AddGrpc();

    // Configure CORS for Storefront
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("StorefrontPolicy", policy =>
        {
            policy.WithOrigins("http://localhost:5009")
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
    });

    // Add SQLite database
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    builder.Services.AddDbContext<IdentityDbContext>(options =>
        options.UseSqlite(connectionString));

    var app = builder.Build();

    // Use CORS policy
    app.UseCors("StorefrontPolicy");

    // Apply migrations and seed default admin user
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
        db.Database.EnsureCreated();

        // Seed default users if no users exist
        if (!db.Users.Any())
        {
            var defaultUsers = DbSeeder.GetDefaultUsers();
            db.Users.AddRange(defaultUsers);
            db.SaveChanges();
            Log.Information("✅ System seeded with {Count} default users from DbSeeder", defaultUsers.Count);
        }
    }

    // Configure the HTTP request pipeline.
    if (app.Environment.IsDevelopment())
    {
        app.MapOpenApi();
        app.MapScalarApiReference();
    }

    // Map Endpoints
    var appVersion = builder.Configuration["Service:Version"]!;
    app.MapHealthEndpoints(appVersion);
    app.MapUserEndpoints();
    app.MapGrpcService<IdentityService.Services.LoyaltyServiceImpl>();

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "IdentityService terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
