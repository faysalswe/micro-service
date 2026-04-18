using System;
using System.Collections.Generic;
using IdentityService.Models;
using IdentityService.Configuration;

namespace IdentityService.Data;

/// <summary>
/// Static registry for default system users.
/// Physically separated from Program.cs but strictly type-safe.
/// </summary>
public static class DbSeeder
{
    public static List<User> GetDefaultUsers()
    {
        return new List<User>
        {
            new User
            {
                Username = "admin",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("password"),
                Role = SecurityRoles.Admin,
                CreatedAt = DateTime.UtcNow
            },
            new User
            {
                Username = "manager",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("manager123"),
                Role = SecurityRoles.Manager,
                CreatedAt = DateTime.UtcNow
            },
            new User
            {
                Username = "staff",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("staff123"),
                Role = SecurityRoles.User,
                CreatedAt = DateTime.UtcNow
            },
            new User
            {
                Username = "auditor",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("auditor123"),
                Role = SecurityRoles.Auditor,
                CreatedAt = DateTime.UtcNow
            },
            new User
            {
                Username = "john_doe",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"),
                Role = SecurityRoles.User,
                CreatedAt = DateTime.UtcNow
            },
            new User
            {
                Username = "jane_smith",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"),
                Role = SecurityRoles.User,
                CreatedAt = DateTime.UtcNow
            },
            new User
            {
                Username = "customer_test",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"),
                Role = SecurityRoles.User,
                CreatedAt = DateTime.UtcNow
            }
        };
    }
}
