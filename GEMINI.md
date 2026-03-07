# Gemini Context: Polyglot Microservices Prototype

This project is a polyglot microservices architecture demonstrating a **Synchronous Orchestration Saga** using gRPC, REST, and a full observability stack.

## Project Overview

- **Architecture**: Microservices with a central orchestrator (`OrderService`) managing a saga.
- **Languages & Frameworks**:
  - **IdentityService**: .NET 10 (C#) - JWT Authentication / STS.
  - **OrderService**: .NET 10 (C#) - Orchestrator & Saga management.
  - **PaymentService**: Node.js 20 (TypeScript) - Payment processing (MongoDB).
  - **InventoryService**: Go 1.25 - Catalog & Stock management (PostgreSQL).
  - **Storefront**: React (Vite, React Router v7) - Customer UI.
  - **Back Office**: Angular 19 - Admin UI.
- **Communication**: gRPC for inter-service calls, REST for UI-facing APIs.
- **Gateway**: Kong (DB-less mode) at port 8000.
- **Observability**: OpenTelemetry (OTLP), Jaeger (Tracing), Loki (Logs), Prometheus/Grafana (Metrics).
- **Resilience**: Polly (.NET) for retries and circuit breakers; Opossum (Node.js).

## Port Mapping Scheme

The project uses a unified port scheme where the last two digits identify the service:
- **501x**: HTTP / REST Port
- **5001x**: gRPC Port
- **401x**: Debug Port (Host Mapping)

| Service | REST | gRPC | Debug |
|---------|------|------|-------|
| Identity | 5010 | - | 4010 |
| Order | 5011 | 50011 | 4011 |
| Payment | 5012 | 50012 | 4012 |
| Inventory | 5013 | 50013 | 4013 |
| Storefront | 5014 | - | - |
| Back Office | 5015 | - | - |

## Building and Running

### 1. Infrastructure Setup
Start databases (PostgreSQL, MongoDB) and the observability stack:
```bash
docker-compose up -d
```

### 2. Run All Services (Docker Debug Mode)
Starts all services with debug agents enabled:
```bash
docker-compose -f docker-compose.yaml -f docker-compose.debug.yaml up -d --build
```

### 3. Run Locally (Development)
Ensure infrastructure is running via Docker Compose first.

- **IdentityService**: `dotnet run --project IdentityService/`
- **OrderService**: `dotnet run --project OrderService/`
- **PaymentService**: `cd PaymentService && pnpm install && pnpm start`
- **InventoryService**: `cd InventoryService && go run cmd/server/main.go`
- **Storefront**: `cd storefront && pnpm install && pnpm dev`
- **Back Office**: `cd back-office && pnpm install && pnpm start`

## Testing

- **.NET Tests**: `dotnet test OrderService.Tests/`
- **Node.js Tests**: `cd PaymentService && pnpm test`
- **Contract Tests**: Uses Pact, located in `OrderService.Tests/`.
- **Load Tests**: Uses k6, located in `load-tests/`. Run with `k6 run load-tests/order-service.js`.

## Development Conventions

- **gRPC First**: Prefer gRPC for all internal service-to-service communication. Proto definitions are in the `/protos` directory.
- **Observability**: All services must export OTLP traces. .NET services use `AddServiceTracing`, Node.js uses `@opentelemetry/sdk-node`, and Go uses standard OTel instrumentation.
- **Logging**: Use structured logging. Include `trace_id` and `span_id` in logs for correlation.
- **Health Checks**: Every service should implement `/health`, `/health/live`, and `/health/ready` endpoints.
- **Contract Safety**: Maintain Pact contracts in the `pacts/` directory to ensure inter-service compatibility.
- **Database Migrations**:
  - .NET: Managed via EF Core (`dotnet ef migrations add ...`).
  - Go/Node: See respective service READMEs for migration strategies.
