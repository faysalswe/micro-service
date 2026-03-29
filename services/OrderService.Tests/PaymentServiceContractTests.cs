using PactNet;
using PactNet.Matchers;
using Xunit;
using FluentAssertions;
using Microservice.Payments.Grpc;
using Grpc.Net.Client;

namespace OrderService.Tests;

public class PaymentServiceContractTests
{
    private readonly IPactBuilderV4 _pactBuilder;

    public PaymentServiceContractTests()
    {
        var config = new PactConfig
        {
            PactDir = "/Users/faysal/SourceCode/micro-service/pacts/",
            LogLevel = PactLogLevel.Debug
        };

        var pact = Pact.V4("OrderService", "PaymentService", config);
        _pactBuilder = pact.WithHttpInteractions();
    }

    [Fact]
    public async Task ProcessPayment_WhenValidRequest_ReturnsSuccess()
    {
        _pactBuilder
            .UponReceiving("a request to process a payment")
            .WithRequest(HttpMethod.Post, "/payments.PaymentService/ProcessPayment")
            .WithHeader("Content-Type", "application/json")
            .WithJsonBody(new 
            { 
               order_id = "order-123",
               amount = 99.99,
               user_id = "user-456"
            })
            .WillRespond()
            .WithStatus(System.Net.HttpStatusCode.OK)
            .WithHeader("Content-Type", "application/json")
            .WithJsonBody(new 
            {
                payment_id = "pay-789",
                success = true,
                status_message = "Payment accepted"
            });

        _pactBuilder
            .UponReceiving("a request to refund a payment")
            .WithRequest(HttpMethod.Post, "/payments.PaymentService/RefundPayment")
            .WithHeader("Content-Type", "application/json")
            .WithJsonBody(new 
            { 
               payment_id = "pay-789",
               reason = "Customer cancelled"
            })
            .WillRespond()
            .WithStatus(System.Net.HttpStatusCode.OK)
            .WithHeader("Content-Type", "application/json")
            .WithJsonBody(new 
            {
                payment_id = "pay-789",
                success = true,
                status_message = "Refund processed"
            });

        await _pactBuilder.VerifyAsync(async ctx =>
        {
            var httpClient = new HttpClient { BaseAddress = ctx.MockServerUri };
            
            // 1. Verify ProcessPayment
            var processRequest = new { order_id = "order-123", amount = 99.99, user_id = "user-456" };
            var processContent = new StringContent(System.Text.Json.JsonSerializer.Serialize(processRequest), System.Text.Encoding.UTF8, "application/json");
            var processResponse = await httpClient.PostAsync("/payments.PaymentService/ProcessPayment", processContent);
            processResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

            // 2. Verify RefundPayment
            var refundRequest = new { payment_id = "pay-789", reason = "Customer cancelled" };
            var refundContent = new StringContent(System.Text.Json.JsonSerializer.Serialize(refundRequest), System.Text.Encoding.UTF8, "application/json");
            var refundResponse = await httpClient.PostAsync("/payments.PaymentService/RefundPayment", refundContent);
            refundResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
        });
    }
}
