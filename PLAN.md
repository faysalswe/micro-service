# Microservices Project Plan (Synchronous gRPC)

## 1. Project Overview
A robust microservices architecture using synchronous gRPC communication and an Orchestration Saga for distributed transactions.

- **Service A (.NET 8)**: Orchestrator + PostgreSQL.
- **Service B (Node.js)**: Participant + MongoDB.
- **Shared Infrastructure**: Redis (Caching/Saga State), Custom Identity Service (STS).

## 2. Core Architecture & Patterns

### Communication & API
- **gRPC/Protobuf**: Primary inter-service transport.
- **Gateway & Documentation**: Kong/NGINX with gRPC-JSON Transcoding for Swagger-enabled REST access.

### Distributed Transactions (Saga)
- **Synchronous Orchestration**: Service A manages the flow via sequential gRPC calls.
- **Compensating Transactions**: Orchestrator triggers "undo" operations on failure.
- **Idempotency**: Services must handle duplicate requests safely to support retries.

### Resilience (Zero-Trust Network)
- **Circuit Breaker & Retries**: Managed by **Polly** (.NET) and **Opossum** (Node.js).
- **Service Mesh**: Istio handles mTLS and network-level traffic management.
- **Saga Persistence**: Active saga state stored in Redis to survive service restarts.

### Observability & Tracing
- **Unified Tracing**: OpenTelemetry for cross-service spans.
- **Correlation**: `X-Correlation-ID` propagated through gRPC metadata.
- **Analysis**: ELK Stack for logs; Prometheus/Grafana for metrics.

## 3. Technology Stack Summary

| Category | Tools |
| :--- | :--- |
| **Languages/Frameworks** | C# (.NET 8), TypeScript (Node.js) |
| **Databases** | PostgreSQL, MongoDB, Redis |
| **Communication** | gRPC, Protobuf, gRPC-JSON Transcoding |
| **Resilience** | Polly, Opossum, Istio |
| **Infrastructure** | Docker Compose (Local IaC), Helm, Kubernetes |
| **Security/Config** | Keycloak (OIDC), .env, K8s ConfigMaps |
| **Testing** | xUnit, Jest, Pact (Contract), k6 (Load) |
| **Observability** | OpenTelemetry, ELK Stack, Prometheus, Grafana |
| **CI/CD** | GitHub Actions |

## 4. Implementation Roadmap

### Phase 1: Foundation
- [ ] Protobuf contracts & scaffolding (Swagger included).
- [ ] Basic gRPC communication with Correlation ID propagation.

### Phase 2: Infrastructure & Security
- [ ] `docker-compose` for all dependencies (DBs, Redis, Keycloak, ELK).
- [ ] API Gateway and Service Mesh configuration.

### Phase 3: Transaction Logic & Resilience
- [ ] Synchronous Saga flow with compensating logic.
- [ ] Integration of Polly/Opossum for Circuit Breakers.

### Phase 4: Quality & Verification
- [ ] Unit, Integration, and **Pact** contract tests.
- [ ] **k6** load testing and GitHub Actions pipeline setup.

### Phase 5: Full Observability
- [ ] OpenTelemetry instrumentation and Grafana dashboarding.

