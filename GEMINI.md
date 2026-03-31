# Gemini Context: Polyglot Microservices Prototype

This project is a polyglot microservices architecture demonstrating a **Synchronous Orchestration Saga** using gRPC, REST, and a full observability stack.

## Architecture & Monorepo Structure

The project has been overhauled into a structured monorepo:

- **`apps/`**: Frontend applications.
  - `storefront`: React (React Router v7) customer UI.
  - `back-office`: Angular 19 admin dashboard.
- **`services/`**: Backend microservices.
  - `IdentityService`: .NET 10 - JWT / STS.
  - `OrderService`: .NET 10 - Saga Orchestrator.
  - `PaymentService`: Node.js 20 (TS) - Payments (MongoDB).
  - `InventoryService`: Go 1.25 - Stock (PostgreSQL).
- **`platform/`**: Deployment and infrastructure.
  - `charts/`:
    - `apps/`: Microservices and frontend applications.
    - `shared/`: Umbrella and shared infrastructure charts.
    - `observability/`: Monitoring and tracing charts.
  - `cluster/`: Cluster definitions (Kind, Docker Compose).
  - `config/`: Gateway configuration (Kong).
- **`protos/`**: Shared gRPC definitions.

## Key Milestones & Fixes

### 1. Security & Production Grade
- All containers run as **non-root (UID 1001)**.
- Helm charts enforce `runAsNonRoot: true`.
- Resource limits and probes are configured for all services.

### 2. Connectivity & Discovery
- **OrderService Fix**: Corrected `InventoryServiceUrl` from `localhost` to `http://inventory-service:50013` via environment variables.
- **Tracing Fix**: Standardized OTel environment variables (`OTEL_EXPORTER_OTLP_ENDPOINT`) to link spans across services.

### 3. Ghost Latency Investigation
- Identified 3-second delay in `POST /orders`.
- **Primary Suspects**: Database row-level locking in Go (Inventory) and 3s Circuit Breaker timeouts in Node.js (Payment).

## Testing

- **Load Tests**: k6 scripts in `tests/load-tests/`.
- **Manual Testing**: Access frontend via Kong Gateway (Port 8000).

## Hybrid Development (VS Code)
- Use `.vscode/launch.json` to debug local services against cluster-hosted databases.
- Ensure `kubectl port-forward` is active for `postgresql` and `mongodb` when running locally.
