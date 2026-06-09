# Polyglot Microservices Prototype

A robust microservices architecture demonstrating a **Synchronous Orchestration Saga** with gRPC, polyglot implementation, and comprehensive observability.

## Tech Stack
- **Languages**: .NET 10 (C#), Node.js 20 (TypeScript), Go 1.25
- **UIs**: React (Storefront), Angular 19 (Back Office)
- **Databases**: PostgreSQL (Order & Inventory), MongoDB (Payment)
- **API Gateway**: Kong (DB-less mode)
- **Observability**: OpenTelemetry, Jaeger (Tracing), Loki (Logs), Prometheus/Grafana (Metrics)

## Quick Start

```bash
# 1. Start infrastructure (databases, redis, observability)
make infra-up

# 2. Run a service locally (bare-metal)
make run-payment      # Node.js  — port 5012 / gRPC 50012
make run-inventory    # Go       — port 5013 / gRPC 50013
make run-order        # .NET     — port 5011 / gRPC 50011
make run-identity     # .NET     — port 5010

# 3. Or run all services in Docker debug mode
make services-up
```

Run `make` to see all available commands.

## Environment

Three files manage config across environments:

| File | Used by | Contains |
|---|---|---|
| `.env` | bare-metal, VS Code, K8s | localhost URLs + all credentials |
| `.env.docker` | Docker Compose only | Docker hostnames that differ from `.env` |
| `services/*/.env` | bare-metal + VS Code | service-specific vars |

- **Bare-metal** (`make run-*`): loads root `.env` → service `.env` fills in service-specific gaps
- **Docker Compose** (`make infra-up` / `make services-up`): merges `.env` + `.env.docker`, Docker hostnames win
- **VS Code** (F5): `envFile: .env` as base + `env` block for service-specific keys
- **Kubernetes** (`make secrets`): reads credentials from root `.env` only; service URLs come from Helm

## Service Map

The project uses a unified port scheme where the last two digits identify the service:
- **501x**: HTTP / REST Port
- **5001x**: gRPC Port
- **401x**: Debug Port (Host Mapping)

| Service | REST | gRPC | Debug (Host) | Description |
|---------|------|------|--------------|-------------|
| **IdentityService** | 5010 | - | 4010 | JWT Auth / STS |
| **OrderService** | 5011 | 50011 | 4011 | Orchestrator & Saga |
| **PaymentService** | 5012 | 50012 | 4012 | Payment Processor |
| **InventoryService** | 5013 | 50013 | 4013 | Catalog & Stock |
| **Back Office** | 5008 | - | - | Angular 19 Admin |
| **Storefront** | 5009 | - | - | React Customer UI |
| **Kong Gateway** | 8000 | 9080 | - | API Entry Point |

## Observability

| Tool | URL | Description |
|------|-----|-------------|
| **Grafana** | http://localhost:3301 | Dashboards (admin/admin) |
| **Jaeger** | http://localhost:16686 | Distributed Tracing |
| **Prometheus** | http://localhost:9090 | Metrics UI |
| **Loki** | http://localhost:3100 | Log Aggregation |

## Debugging in VS Code

### Docker Debugging (Recommended)
1. Start the debug stack: `make services-up`
2. Go to **Run and Debug** (`Ctrl+Shift+D`).
3. Select the appropriate **"Docker: Attach"** configuration:
   - `Docker: Attach IdentityService`
   - `Docker: Attach OrderService`
   - `Docker: Attach PaymentService`
   - `Docker: Attach InventoryService`
4. Set breakpoints and enjoy.

### Local Debugging
Use the standard launch configurations (e.g., `OrderService`, `PaymentService`) to run services directly on your host machine.

## Testing

- **OrderService Tests**: `dotnet test OrderService.Tests/`
- **PaymentService Tests**: `cd PaymentService && pnpm test`
- **Contract Tests**: Found in `OrderService.Tests/` using Pact.
- **Load Tests**: `k6 run load-tests/order-service.js`
