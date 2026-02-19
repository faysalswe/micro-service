# Development Run Instructions

## Prerequisites

- .NET 10 SDK
- Node.js 20+
- Docker & Docker Compose
- VS Code with C# and Node.js extensions

## Quick Start

### Option 1: Docker Compose (Full Stack)

```bash
# Start all services and infrastructure
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Option 2: Local Development with VS Code

#### Step 1: Start Databases

```bash
docker-compose up -d order-db payment-db
```

Or use VS Code task: `Ctrl+Shift+P` → "Tasks: Run Task" → `start-databases`

#### Step 2: Start Observability Stack (Optional)

```bash
docker-compose up -d otel-collector jaeger loki prometheus grafana
```

Or use VS Code task: `start-observability`

#### Step 3: Run Services

**Using VS Code Debugger (F5):**

1. Open the Run and Debug panel (`Ctrl+Shift+D`)
2. Select a configuration from dropdown:
   - `All Services` - Launches all services
   - `.NET Services Only` - OrderService + IdentityService
   - `OrderService (.NET)` - Single service
   - `IdentityService (.NET)` - Single service
   - `PaymentService (Node.js)` - Single service
   - `InventoryService (Go)` - Single service
   - `Storefront (React)` - Customer UI
   - `Admin Tool (Angular)` - Admin UI
3. Press `F5` to start debugging

**Using VS Code Tasks:**

`Ctrl+Shift+P` → "Tasks: Run Task":
- `run-order-service`
- `run-identity-service`
- `run-payment-service`
- `run-inventory-service`
- `run-storefront`
- `run-back-office`

**Using Terminal:**

```bash
# OrderService
dotnet run --project OrderService/

# IdentityService
dotnet run --project IdentityService/

# PaymentService
cd PaymentService && npm install && npm start

# InventoryService
cd InventoryService && go run cmd/server/main.go

# Storefront
cd storefront && npm install && npm run dev

# Admin Tool
cd back-office && npm install && npm start
```

## Service Ports

| Service | Port | Protocol | Description |
|---------|------|----------|-------------|
| OrderService | 8080 | gRPC | Order Orchestrator |
| PaymentService | 50051 | gRPC | Payment Processor |
| InventoryService | 50052 | gRPC | Inventory & Catalog |
| InventoryService | 8081 | HTTP | REST Management API |
| Storefront | 3000 | HTTP | Customer React App |
| Admin Tool | 4200 | HTTP | Admin Angular App |
| IdentityService | 5050 | HTTP | Auth Service |
| Kong Gateway | 8000 | HTTP | Public REST Entry |
| Kong Gateway | 9080 | gRPC | Public gRPC Entry |
| PostgreSQL | 5432 | TCP | Order DB |
| MongoDB | 27017 | TCP | Payment DB |
| PostgreSQL | 5433 | TCP | Inventory DB |
| Grafana | 3301 | HTTP | Observability |
| Jaeger | 16686 | HTTP | Tracing |
| Prometheus | 9090 | HTTP | Metrics |
| Loki | 3100 | HTTP | Logging |

## Environment Variables

### OrderService (.NET)

Set automatically in launch.json, or manually:

```bash
export ASPNETCORE_ENVIRONMENT=Development
export ASPNETCORE_URLS=http://localhost:8080
```

### IdentityService (.NET)

```bash
export ASPNETCORE_ENVIRONMENT=Development
export ASPNETCORE_URLS=http://localhost:5050
export Jwt__Key=ThisIsAVerySecretKeyForDevelopmentOnly123!
export Jwt__Issuer=IdentityService
export Jwt__Audience=MicroserviceApp
```

### PaymentService (Node.js)

Create `PaymentService/.env`:

```env
NODE_ENV=development
PORT=50051
MONGO_URI=mongodb://admin:password123@localhost:27017
MONGO_DB_NAME=payments_db
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
SERVICE_NAME=PaymentService
LOG_LEVEL=debug
```

## VS Code Tasks Reference

| Task | Description |
|------|-------------|
| `build-all` | Build all services (default build task) |
| `build-order-service` | Build OrderService |
| `build-identity-service` | Build IdentityService |
| `build-payment-service` | Build PaymentService (TypeScript) |
| `run-order-service` | Run OrderService |
| `run-identity-service` | Run IdentityService |
| `run-payment-service` | Run PaymentService |
| `watch-order-service` | Run with hot reload |
| `watch-identity-service` | Run with hot reload |
| `test-all` | Run all tests |
| `test-order-service` | Run OrderService tests |
| `test-payment-service` | Run PaymentService tests |
| `docker-up` | Start docker-compose |
| `docker-down` | Stop docker-compose |
| `docker-logs` | View docker logs |
| `start-databases` | Start PostgreSQL & MongoDB & Inventory Postgres |
| `start-observability` | Start tracing/metrics stack |
| `restore-dotnet` | Restore .NET packages |
| `install-payment-deps` | Install PaymentService deps |
| `install-inventory-deps` | Install InventoryService deps |
| `install-storefront-deps` | Install Storefront deps |
| `install-admin-deps` | Install Admin Tool deps |

## Debugging

### Option 1: Local Debugging (Recommended)

Services run locally, databases in Docker.

#### .NET Services

1. Set breakpoints in VS Code
2. Select `OrderService (.NET)` or `IdentityService (.NET)` configuration
3. Press `F5`

#### PaymentService (Node.js)

1. Set breakpoints in VS Code
2. Select `PaymentService (Node.js)` configuration
3. Press `F5`

---

### Option 2: Docker Debugging (Remote Attach)

Services run in Docker containers with debug agents enabled.

#### Step 1: Start Debug Containers

```bash
# All services with debugging
docker-compose -f docker-compose.yaml -f docker-compose.debug.yaml up -d --build

# Or individual service
docker-compose -f docker-compose.yaml -f docker-compose.debug.yaml up -d --build order-service
```

Or use VS Code tasks:
- `docker-debug-up` - Start all services with debugging
- `docker-debug-order-service` - Start OrderService only
- `docker-debug-payment-service` - Start PaymentService only
- `docker-debug-identity-service` - Start IdentityService only

#### Step 2: Attach Debugger

1. Set breakpoints in VS Code
2. Open Run and Debug panel (`Ctrl+Shift+D`)
3. Select attach configuration:
   - `Docker: OrderService (.NET)`
   - `Docker: IdentityService (.NET)`
   - `Docker: PaymentService (Node.js)`
4. Press `F5`
5. For .NET: Select the `dotnet` process when prompted

#### Debug Ports

| Service | Debug Port | Protocol |
|---------|------------|----------|
| OrderService | 2222 | vsdbg |
| IdentityService | 2223 | vsdbg |
| PaymentService | 9229 | Node Inspector |

#### How Docker Debugging Works

```
┌─────────────────────────────────────────────────────────────┐
│  Docker Container                                           │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Service Process                                   │    │
│  │  ├── .NET: vsdbg debugger attached               │    │
│  │  └── Node.js: --inspect=0.0.0.0:9229             │    │
│  └──────────────────────┬─────────────────────────────┘    │
│                         │                                   │
└─────────────────────────┼───────────────────────────────────┘
                          │ Debug Port (2222/9229)
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  VS Code                                                    │
│  └── Attach configuration connects via port                 │
│      └── Breakpoints, step-through, variable inspection     │
└─────────────────────────────────────────────────────────────┘
```

#### Limitations of Docker Debugging

| Feature | Local Debug | Docker Debug |
|---------|-------------|--------------|
| Breakpoints | ✓ Instant | ✓ Works |
| Hot Reload | ✓ Fast | ✗ Rebuild needed |
| Startup Time | ✓ Fast | ✗ Slower |
| Production Parity | ✗ | ✓ Same as prod |

**Recommendation**: Use local debugging for daily development. Use Docker debugging when you need to test in a production-like environment.

## Testing

```bash
# All tests
dotnet test OrderService.Tests/
cd PaymentService && npm test

# Or use VS Code
Ctrl+Shift+P → "Tasks: Run Task" → test-all
```

## Observability URLs

| Tool | URL | Credentials |
|------|-----|-------------|
| Grafana | http://localhost:3301 | admin / admin |
| Jaeger | http://localhost:16686 | - |
| Prometheus | http://localhost:9090 | - |

## Troubleshooting

### Database Connection Errors

Ensure databases are running:

```bash
docker-compose ps order-db payment-db
```

### Port Already in Use

Check and kill processes:

```bash
lsof -i :8080  # OrderService
lsof -i :5050  # IdentityService
lsof -i :50051 # PaymentService
```

### .NET Build Errors

```bash
dotnet restore
dotnet build
```

### Node.js / React / Angular Errors

```bash
cd <service-folder>
rm -rf node_modules
npm install
```
