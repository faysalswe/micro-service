using PactNet;
using PactNet.Matchers;
using Xunit;
using FluentAssertions;
using System.Net.Http;
using System.Text;
using System.Text.Json;

namespace OrderService.Tests;

public class IdentityServiceContractTests
{
    private readonly IPactBuilderV4 _pactBuilder;

    public IdentityServiceContractTests()
    {
        var config = new PactConfig
        {
            PactDir = "/Users/faysal/SourceCode/micro-service/pacts/",
            LogLevel = PactLogLevel.Debug
        };

        var pact = Pact.V4("OrderService", "IdentityService", config);
        _pactBuilder = pact.WithHttpInteractions();
    }

    [Fact]
    public async Task GetToken_WhenCredentialsAreValid_ReturnsToken()
    {
        // Arrange (The "Expectation")
        _pactBuilder
            .UponReceiving("A request for a login token")
            .Given("A user exists with username admin and password password")
            .WithRequest(HttpMethod.Post, "/login")
            .WithJsonBody(new
            {
                username = "admin",
                password = "password"
            })
            .WillRespond()
            .WithStatus(System.Net.HttpStatusCode.OK)
            .WithHeader("Content-Type", "application/json")
            .WithJsonBody(new
            {
                token = "static-token-for-test"
            });

        // Act (The "Actual Call" during the test)
        await _pactBuilder.VerifyAsync(async ctx =>
        {
            var httpClient = new HttpClient { BaseAddress = ctx.MockServerUri };
            var requestBody = new { username = "admin", password = "password" };
            var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

            var response = await httpClient.PostAsync("/login", content);

            // Assert
            if (response.StatusCode != System.Net.HttpStatusCode.OK)
            {
                var errorBody = await response.Content.ReadAsStringAsync();
                throw new Exception($"Pact Mock Server returned {response.StatusCode}. Body: {errorBody}");
            }

            response.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
            var responseString = await response.Content.ReadAsStringAsync();
            responseString.Should().Contain("token");
        });
    }
}
