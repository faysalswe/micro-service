using IdentityService.Data;
using IdentityService.Models;
using Microsoft.EntityFrameworkCore;
using FluentAssertions;

namespace IdentityService.Tests;

public class DatabaseTests
{
    private IdentityDbContext GetDbContext()
    {
        var options = new DbContextOptionsBuilder<IdentityDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new IdentityDbContext(options);
    }

    [Fact]
    public async Task CanAddAndRetrieveUser()
    {
        // Arrange
        using var context = GetDbContext();
        var user = new User { Username = "testuser", PasswordHash = "hash" };

        // Act
        context.Users.Add(user);
        await context.SaveChangesAsync();

        // Assert
        var retrievedUser = await context.Users.FirstOrDefaultAsync(u => u.Username == "testuser");
        retrievedUser.Should().NotBeNull();
        retrievedUser!.Username.Should().Be("testuser");
    }

    [Fact]
    public async Task DuplicateUsername_ShouldBeAllowedAtDbLevel()
    {
        // SQLite or Postgres would have unique constraints, but InMemory doesn't unless configured
        // This test just ensures basic DB operations work.
        
        // Arrange
        using var context = GetDbContext();
        var user1 = new User { Username = "testuser", PasswordHash = "hash1" };
        var user2 = new User { Username = "testuser", PasswordHash = "hash2" };

        // Act
        context.Users.Add(user1);
        context.Users.Add(user2);
        await context.SaveChangesAsync();

        // Assert
        var count = await context.Users.CountAsync(u => u.Username == "testuser");
        count.Should().Be(2);
    }
}
