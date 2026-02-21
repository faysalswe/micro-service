# Polyglot Microservices Prototype

A robust microservices architecture demonstrating a **Synchronous Orchestration Saga** with gRPC, polyglot implementation, and comprehensive observability.

## Tech Stack
- **Languages**: .NET 10 (C#), Node.js 20 (TypeScript), Go 1.25
- **UIs**: React (Storefront), Angular 19 (Back Office)
- **Databases**: PostgreSQL (Order & Inventory), MongoDB (Payment)
- **API Gateway**: Kong (DB-less mode)
- **Observability**: OpenTelemetry, Jaeger (Tracing), Loki (Logs), Prometheus/Grafana (Metrics)

## Quick Start

### 1. Start Infrastructure (Databases & Observability)
```bash
docker-compose up -d
```

### 2. Run All Services in Debug Mode (Docker)
This starts all services with debug agents enabled and ports mapped.
```bash
docker-compose -f docker-compose.yaml -f docker-compose.debug.yaml up -d --build
```

### 3. Run Locally (Development)
Ensure infrastructure is running first via Docker Compose.

- **IdentityService (.NET)**: `dotnet run --project IdentityService/` (Port 5010)
- **OrderService (.NET)**: `dotnet run --project OrderService/` (Port 5011)
- **PaymentService (Node.js)**: `cd PaymentService && pnpm start` (Port 5012 / 50012)
- **InventoryService (Go)**: `cd InventoryService && go run cmd/server/main.go` (Port 5013 / 50013)
- **Storefront (React)**: `cd storefront && pnpm dev` (Port 5014)
- **Back Office (Angular)**: `cd back-office && pnpm start` (Port 5015)

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
| **Storefront** | 5014 | - | - | React Customer UI |
| **Back Office** | 5015 | - | - | Angular 19 Admin |
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
1. Start the debug stack: `docker-compose -f docker-compose.yaml -f docker-compose.debug.yaml up -d`
2. Go to **Run and Debug** (`Ctrl+Shift+D`).
3. Select the appropriate **"Docker: Attach"** configuration:
   - `Docker: Identity (.NET)`
   - `Docker: Order (.NET)`
   - `Docker: Payment (Node)`
   - `Docker: Inventory (Go)`
4. Set breakpoints and enjoy.

### Local Debugging
Use the standard launch configurations (e.g., `OrderService`, `PaymentService`) to run services directly on your host machine.

## Testing

- **OrderService Tests**: `dotnet test OrderService.Tests/`
- **PaymentService Tests**: `cd PaymentService && pnpm test`
- **Contract Tests**: Found in `OrderService.Tests/` using Pact.
- **Load Tests**: `k6 run load-tests/order-service.js`
