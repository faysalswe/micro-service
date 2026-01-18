# Microservices Project Plan (Synchronous gRPC)

## 1. Project Overview
A robust microservices architecture using synchronous gRPC communication and an Orchestration Saga for distributed transactions.

- **OrderService (.NET 10)**: Orchestrator + PostgreSQL.
- **PaymentService (Node.js)**: Participant + MongoDB.
- **IdentityService (.NET 10)**: Custom STS for JWT authentication.

## 2. Core Architecture & Patterns

### Communication & API
- **gRPC/Protobuf**: Primary inter-service transport.
- **Gateway**: Kong (DB-less mode) for routing and CORS.

### Distributed Transactions (Saga)
- **Synchronous Orchestration**: OrderService manages the flow via sequential gRPC calls.
- **Compensating Transactions**: Orchestrator triggers "undo" operations (RefundPayment) on failure.
- **Saga Pattern**: Synchronous orchestration handles rollback; no external state persistence needed.

### Resilience
- **Circuit Breaker & Retries**: Managed by **Polly** (.NET) and **Opossum** (Node.js).

### Observability
- **Distributed Tracing**: OpenTelemetry + Jaeger for cross-service spans.
- **Centralized Logging**: Grafana Loki with automatic trace correlation.
- **Metrics**: Prometheus + Grafana dashboards (RED metrics).

## 3. Technology Stack Summary

| Category | Tools |
| :--- | :--- |
| **Languages/Frameworks** | C# (.NET 10), TypeScript (Node.js) |
| **Databases** | PostgreSQL, MongoDB |
| **Communication** | gRPC, Protobuf |
| **Resilience** | Polly, Opossum |
| **Infrastructure** | Docker Compose (Local), Helm/Kubernetes (Production) |
| **Security** | Custom STS (JWT), .env |
| **Testing** | xUnit, Jest, Pact (Contract), k6 (Load) |
| **Observability** | OpenTelemetry, Jaeger, Grafana Loki, Prometheus, Grafana |
| **CI/CD** | GitHub Actions |

## 4. Implementation Roadmap

### Phase 1: Foundation (Completed)
- [x] Step 1: Protobuf contracts
- [x] Step 2: OrderService scaffold (.NET gRPC)
- [x] Step 3: PaymentService scaffold (Node.js gRPC)
- [x] Step 4: Repository setup (Monorepo)

### Phase 2: Infrastructure & Security (Completed)
- [x] Step 5: Docker Compose (PostgreSQL, MongoDB)
- [x] Step 6: Database persistence (EF Core, MongoDB driver)
- [x] Step 7: Custom Identity Service (STS)
- [x] Step 8: API Gateway (Kong)

### Phase 3: Business Logic & Saga (Completed)
- [x] Step 9: gRPC communication & metadata propagation
- [x] Step 10: Synchronous Orchestration Saga
- [x] Step 11: Resilience (Polly, Opossum circuit breakers)
- [x] Step 12: Compensating transactions (RefundPayment)

### Phase 4: Quality & CI/CD (Completed)
- [x] Step 13: Unit & Integration testing (xUnit, Jest)
- [x] Step 14: Contract testing (Pact)
- [x] Step 15: GitHub Actions CI/CD pipeline
- [x] Step 16: Load testing (k6)

### Phase 5: Observability (Completed)
- [x] Step 17: OpenTelemetry & Jaeger tracing
- [x] Step 18: Grafana Loki logging
- [x] Step 19: Prometheus & Grafana dashboards

### Phase 6: Production Readiness (Next)
- [ ] Step 20: Service Mesh (Istio) & Kubernetes deployment
