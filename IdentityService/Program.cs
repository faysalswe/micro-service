using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using IdentityService.Data;
using IdentityService.Models;
using IdentityService.Configuration;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddOpenApi();
builder.Services.AddSwaggerDocumentation();

// Add SQLite database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<IdentityDbContext>(options =>
    options.UseSqlite(connectionString));

var app = builder.Build();

// Apply migrations and seed default admin user
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
    db.Database.EnsureCreated();

    // Seed default admin user if no users exist
    if (!db.Users.Any())
    {
        var adminUsername = builder.Configuration["DefaultAdmin:Username"] ?? "admin";
        var adminPassword = builder.Configuration["DefaultAdmin:Password"] ?? "password";
        db.Users.Add(new User
        {
            Username = adminUsername,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword),
            Role = "Admin",
            CreatedAt = DateTime.UtcNow
        });
        db.SaveChanges();
        Console.WriteLine($"Default admin user created (username: {adminUsername})");
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
app.UseSwaggerDocumentation(app.Environment);

// Health check endpoints for Kubernetes probes
app.MapGet("/health", () => Results.Ok(new { status = "healthy", service = "IdentityService", timestamp = DateTime.UtcNow }));

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

// Login endpoint - validates user credentials and returns JWT
app.MapPost("/login", async (LoginRequest request, IConfiguration config, IdentityDbContext db) =>
{
    var user = await db.Users.FirstOrDefaultAsync(u => u.Username == request.Username);

    if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
    {
        return Results.Unauthorized();
    }

    // Update last login time
    user.LastLoginAt = DateTime.UtcNow;
    await db.SaveChangesAsync();

    var issuer = config["Jwt:Issuer"];
    var audience = config["Jwt:Audience"];
    var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!));
    var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

    var claims = new[]
    {
        new Claim(JwtRegisteredClaimNames.Sub, user.Username),
        new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        new Claim(ClaimTypes.Role, user.Role),
        new Claim("user_id", user.Id.ToString())
    };

    var token = new JwtSecurityToken(
        issuer: issuer,
        audience: audience,
        claims: claims,
        expires: DateTime.UtcNow.AddMinutes(60),
        signingCredentials: credentials);

    return Results.Ok(new { token = new JwtSecurityTokenHandler().WriteToken(token) });
});

// Register endpoint - creates a new user
app.MapPost("/register", async (RegisterRequest request, IdentityDbContext db) =>
{
    // Check if username already exists
    if (await db.Users.AnyAsync(u => u.Username == request.Username))
    {
        return Results.Conflict(new { error = "Username already exists" });
    }

    // Validate password length
    if (request.Password.Length < 6)
    {
        return Results.BadRequest(new { error = "Password must be at least 6 characters" });
    }

    var user = new User
    {
        Username = request.Username,
        PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
        Role = request.Role ?? "User",
        CreatedAt = DateTime.UtcNow
    };

    db.Users.Add(user);
    await db.SaveChangesAsync();

    return Results.Created($"/users/{user.Id}", new { id = user.Id, username = user.Username, role = user.Role });
});

// Get all users (admin only in production - simplified for learning)
app.MapGet("/users", async (IdentityDbContext db) =>
{
    var users = await db.Users
        .Select(u => new { u.Id, u.Username, u.Role, u.CreatedAt, u.LastLoginAt })
        .ToListAsync();
    return Results.Ok(users);
});

// Get user by ID
app.MapGet("/users/{id:int}", async (int id, IdentityDbContext db) =>
{
    var user = await db.Users
        .Where(u => u.Id == id)
        .Select(u => new { u.Id, u.Username, u.Role, u.CreatedAt, u.LastLoginAt })
        .FirstOrDefaultAsync();

    return user is not null ? Results.Ok(user) : Results.NotFound();
});

// Delete user by ID
app.MapDelete("/users/{id:int}", async (int id, IdentityDbContext db) =>
{
    var user = await db.Users.FindAsync(id);
    if (user is null)
    {
        return Results.NotFound();
    }

    db.Users.Remove(user);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

app.Run();

public record LoginRequest(string Username, string Password);
public record RegisterRequest(string Username, string Password, string? Role);
