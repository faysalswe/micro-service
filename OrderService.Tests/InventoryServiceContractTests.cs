using PactNet;
using PactNet.Matchers;
using Xunit;
using Inventory; // The gRPC namespace

namespace OrderService.Tests
{
    public class InventoryServiceContractTests
    {
        private readonly IPactBuilderV4 _pactBuilder;

        public InventoryServiceContractTests()
        {
            var config = new PactConfig
            {
                PactDir = "../../../pacts/",
                DefaultJsonSettings = new Newtonsoft.Json.JsonSerializerSettings
                {
                    ContractResolver = new Newtonsoft.Json.Serialization.CamelCasePropertyNamesContractResolver()
                }
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
                    .WithHeader("Content-Type", "application/json; charset=utf-8")
                    .WithJsonBody(new
                    {
                        productID = "PROD-001",
                        quantity = Match.Integer(100)
                    });

            // Act & Assert
            _pactBuilder.Verify(ctx =>
            {
                // In a real gRPC Pact test, we'd use the gRPC plugin.
                // For this learning step, we are validating the REST management API 
                // which shares the same business logic as the gRPC service.
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

            _pactBuilder.Verify(ctx => { });
        }
    }
}
