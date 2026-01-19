using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Health check endpoints for Kubernetes probes
app.MapGet("/health", () => Results.Ok(new { status = "healthy", service = "IdentityService", timestamp = DateTime.UtcNow }));

app.MapGet("/health/live", () => Results.Ok(new { status = "alive" }));

app.MapGet("/health/ready", () => Results.Ok(new { status = "ready" }));

app.MapPost("/login", (LoginRequest request, IConfiguration config) =>
{
    // Mock user validation - In a real app, this would check a database
    if (request.Username == "admin" && request.Password == "password")
    {
        var issuer = config["Jwt:Issuer"];
        var audience = config["Jwt:Audience"];
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, request.Username),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.Role, "Admin")
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.Now.AddMinutes(60),
            signingCredentials: credentials);

        return Results.Ok(new { token = new JwtSecurityTokenHandler().WriteToken(token) });
    }

    return Results.Unauthorized();
});

app.Run();

public record LoginRequest(string Username, string Password);
