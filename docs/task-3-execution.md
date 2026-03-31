# Task 3 Execution: Ghost Latency & Frontend Deployment

## Status: IN PROGRESS
**Milestone**: Frontend Deployed, Connectivity Fixed.

## Actions Taken

### 1. Root Cause Analysis (Ghost Latency)
- **Observation**: `POST /orders` intermittently takes >3s.
- **Analysis**: 
    - `InventoryService` (Go) uses `SELECT ... FOR UPDATE` (Pessimistic Locking). Under load, this causes transaction queuing.
    - `PaymentService` (Node.js) has an Opossum Circuit Breaker with a `3000ms` timeout.
- **Confirmation**: Reran `k6` load test. Confirmed `OrderService` traces are now linked after fixing the environment variable naming mismatch.

### 2. Service Connectivity Fixes
- **Inventory DNS**: `OrderService` was hardcoded to `localhost:50013`. Updated Helm chart to inject `GrpcSettings__InventoryServiceUrl=http://inventory-service:50013`.
- **OTel Standardization**: Standardized `OTEL_EXPORTER_OTLP_ENDPOINT` across all services to ensure Jaeger links spans correctly.

### 3. Frontend Deployment
- Created `apps/storefront/Dockerfile` (React Router v7 with multi-stage build).
- Fixed `apps/back-office/Dockerfile` (Angular 19 with non-root Nginx).
- Created Helm charts for both and deployed to `prod` namespace.
- **Verification**: Pods are running and reachable.

## Next Steps
1. **VS Code Overhaul**: Update `launch.json` and `tasks.json` to match monorepo paths.
2. **Ghost Fix**: Optimize PostgreSQL indexes or switch to Optimistic Locking in Go.
3. **Commit**: Perform a full commit of the overhauled state.
