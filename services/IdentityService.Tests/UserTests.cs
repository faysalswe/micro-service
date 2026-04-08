using IdentityService.Models;
using FluentAssertions;

namespace IdentityService.Tests;

public class UserTests
{
    [Fact]
    public void User_ShouldHaveDefaultValues()
    {
        // Arrange & Act
        var user = new User();

        // Assert
        user.Role.Should().Be("User");
        user.CreatedAt.Should().BeBefore(DateTime.UtcNow.AddSeconds(1));
        user.Username.Should().BeEmpty();
        user.PasswordHash.Should().BeEmpty();
    }

    [Fact]
    public void User_ShouldAllowSettingProperties()
    {
        // Arrange
        var user = new User();
        var now = DateTime.UtcNow;

        // Act
        user.Username = "testuser";
        user.PasswordHash = "hash";
        user.Role = "Admin";
        user.LastLoginAt = now;

        // Assert
        user.Username.Should().Be("testuser");
        user.PasswordHash.Should().Be("hash");
        user.Role.Should().Be("Admin");
        user.LastLoginAt.Should().Be(now);
    }
}
