# OrderService

Microservice for managing and processing orders.

## Ports Configuration

The service is configured to use the following ports for both local development and Docker:

| Protocol | Port | Description |
| :--- | :--- | :--- |
| **HTTP** | `5011` | REST API (HTTP/1.1) |
| **HTTPS** | `7108` | Secure REST API (Local only) |
| **gRPC** | `5011` | gRPC Service (HTTP/2) |

### Protocol Multiplexing
The service uses Kestrel's `Http1AndHttp2` protocol setting on port `5011`, allowing it to serve both REST and gRPC requests on the same port.

## API Endpoints

### REST API (Swagger/Scalar)
- **Scalar UI:** `http://localhost:5011/scalar/v1`
- **OpenAPI Spec:** `http://localhost:5011/openapi/v1.json`

### Health Checks
- **HTTP Liveness:** `http://localhost:5011/health/live`
- **HTTP Readiness:** `http://localhost:5011/health/ready`
- **gRPC Health:** Compatible with `grpc_health_probe` on port `5011`.

## Docker Usage

To build and run the service using Docker:

```bash
# Build the image
docker build -t orderservice -f Dockerfile .

# Run the container (mapping local port 5011 to container port 5011)
docker run -p 5011:5011 orderservice
```

The container uses port `5011` internally to align with the local development environment.
