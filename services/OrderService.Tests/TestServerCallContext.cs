using Grpc.Core;

namespace OrderService.Tests;

public class TestServerCallContext : ServerCallContext
{
    private readonly Metadata _requestHeaders;
    private Status _status;

    public TestServerCallContext(Metadata requestHeaders)
    {
        _requestHeaders = requestHeaders;
    }

    protected override string MethodCore => "TestMethod";
    protected override string HostCore => "localhost";
    protected override DateTime DeadlineCore => DateTime.MaxValue;
    protected override Metadata RequestHeadersCore => _requestHeaders;
    protected override CancellationToken CancellationTokenCore => CancellationToken.None;
    protected override Metadata ResponseTrailersCore => new Metadata();
    protected override Status StatusCore { get => _status; set => _status = value; }
    protected override WriteOptions WriteOptionsCore { get; set; } = new WriteOptions();
    protected override AuthContext AuthContextCore => null!;
    protected override string PeerCore => "127.0.0.1";

    protected override ContextPropagationToken CreatePropagationTokenCore(ContextPropagationOptions? options) => null!;
    protected override Task WriteResponseHeadersAsyncCore(Metadata responseHeaders) => Task.CompletedTask;
}
