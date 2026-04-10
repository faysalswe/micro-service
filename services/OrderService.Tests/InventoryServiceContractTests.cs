using PactNet;
using PactNet.Matchers;
using Xunit;
using System.Net.Http.Json;
using Inventory.V1; // The gRPC namespace

namespace OrderService.Tests
{
    public class InventoryServiceContractTests
    {
        private readonly IPactBuilderV4 _pactBuilder;

        public InventoryServiceContractTests()
        {
            var config = new PactConfig
            {
                PactDir = "../../../pacts/"
            };

            var pact = Pact.V4("OrderService", "InventoryService", config);
            _pactBuilder = pact.WithHttpInteractions(); // Using HTTP for the proxy-based gRPC contract
        }

        [Fact]
        public void GetStock_WhenProductExists_ReturnsStockLevel()
        {
            // Arrange
            _pactBuilder
                .UponReceiving("A request for product stock")
                    .Given("Product PROD-001 exists with 100 units")
                    .WithRequest(HttpMethod.Get, "/api/inventory/PROD-001")
                .WillRespond()
                    .WithStatus(System.Net.HttpStatusCode.OK)
                    .WithHeader("Content-Type", "application/json")
                    .WithJsonBody(new
                    {
                        productID = "PROD-001",
                        quantity = Match.Integer(100)
                    });

            // Act & Assert
            _pactBuilder.Verify(ctx =>
            {
                var client = new HttpClient { BaseAddress = ctx.MockServerUri };
                client.GetAsync("/api/inventory/PROD-001").GetAwaiter().GetResult().EnsureSuccessStatusCode();
            });
        }

        [Fact]
        public void ReserveStock_WhenSufficientStock_ReturnsSuccess()
        {
            // This defines the contract for the gRPC call conceptually via the REST interface
            _pactBuilder
                .UponReceiving("A request to reserve stock")
                    .Given("Product PROD-001 has 100 units")
                    .WithRequest(HttpMethod.Post, "/api/inventory/reserve")
                    .WithHeader("Content-Type", "application/json")
                    .WithJsonBody(new
                    {
                        orderId = Match.Type("order-123"),
                        productId = "PROD-001",
                        quantity = 5
                    })
                .WillRespond()
                    .WithStatus(System.Net.HttpStatusCode.OK)
                    .WithJsonBody(new
                    {
                        success = true,
                        message = Match.Type("Stock reserved successfully")
                    });

            _pactBuilder.Verify(ctx =>
            {
                var client = new HttpClient { BaseAddress = ctx.MockServerUri };
                var body = new { orderId = "order-123", productId = "PROD-001", quantity = 5 };
                client.PostAsJsonAsync("/api/inventory/reserve", body).GetAwaiter().GetResult().EnsureSuccessStatusCode();
            });
        }

        [Fact]
        public void RestockItems_WhenValidRequest_ReturnsSuccess()
        {
            _pactBuilder
                .UponReceiving("A request to restock items")
                    .WithRequest(HttpMethod.Post, "/api/inventory/restock")
                    .WithHeader("Content-Type", "application/json")
                    .WithJsonBody(new
                    {
                        productId = "PROD-001",
                        quantity = 10
                    })
                .WillRespond()
                    .WithStatus(System.Net.HttpStatusCode.OK)
                    .WithJsonBody(new
                    {
                        success = true,
                        message = Match.Type("Stock restocked successfully")
                    });

            _pactBuilder.Verify(ctx =>
            {
                var client = new HttpClient { BaseAddress = ctx.MockServerUri };
                var body = new { productId = "PROD-001", quantity = 10 };
                client.PostAsJsonAsync("/api/inventory/restock", body).GetAwaiter().GetResult().EnsureSuccessStatusCode();
            });
        }
    }
}
