# Implementation Progress & Architecture Decisions

## 🎯 Purpose & Instructions (Read First)
This document is the **Master Directive** for both Human developers and AI assistants. It ensures continuity, architectural integrity, and educational depth across all sessions.

### 📜 Guiding Principles for AI Assistants:
1.  **Context First**: Before suggesting or writing any code, read this file to identify the current step and the decisions already finalized.
2.  **Explain the "Why"**: Never provide a solution without explaining the architectural reasoning.
3.  **Compare Alternatives**: For every major tool or pattern choice, present at least one alternative and explain the trade-offs (Pros/Cons).
4.  **No Shortcuts**: Prioritize robust, enterprise-grade patterns (e.g., Idempotency, Tracing) even if they add initial complexity.
5.  **Audit the Progress**: Update the `Status` and `Action Log` for each step as work is completed.

### 📜 Goals for the Human Developer:
1.  **Conceptual Mastery**: Use each step to understand the "under the hood" mechanics of microservices.
2.  **Tracking**: Use this as a checklist to ensure the implementation doesn't drift from the original high-level plan.

---

## 🏗️ Project Overview

A robust microservices architecture using synchronous gRPC communication and an Orchestration Saga for distributed transactions.

### Services
| Service | Technology | Database | Logging |
|---------|------------|----------|---------|
| **OrderService** | .NET 10 | PostgreSQL | Serilog → Loki |
| **PaymentService** | Node.js/TypeScript | MongoDB | Winston → Loki |
| **InventoryService** | Go 1.23 | PostgreSQL | Zap → Loki |
| **IdentityService** | .NET 10 | In-Memory | Custom JWT STS |
| **Storefront** | React/Remix | - | Console → Loki |
| **Admin Tool** | Angular 19 | - | Console → Loki |

### Core Architecture & Patterns

**Communication & API**
- **gRPC/Protobuf**: Primary inter-service transport
- **Gateway**: Kong (DB-less mode) for routing and CORS

**Distributed Transactions (Saga)**
- **Synchronous Orchestration**: OrderService manages the flow via sequential gRPC calls (Inventory → Payment → Finalize)
- **Compensating Transactions**: Orchestrator triggers "undo" operations (ReleaseStock, RefundPayment) on failure

**Resilience**
- **Circuit Breaker & Retries**: Managed by Polly (.NET) and Opossum (Node.js)

**Observability**
- **Distributed Tracing**: OpenTelemetry + Jaeger for cross-service spans
- **Centralized Logging**: Grafana Loki with automatic trace correlation
- **Metrics**: Prometheus + Grafana dashboards (RED metrics)

### Technology Stack

| Category | Tools |
|----------|-------|
| **Languages/Frameworks** | C# (.NET 10), TypeScript (Node.js), Go 1.23, React, Angular 19 |
| **Databases** | PostgreSQL, MongoDB |
| **Communication** | gRPC, Protobuf |
| **Resilience** | Polly, Opossum |
| **Infrastructure** | Docker Compose (Local), Helm/Kubernetes (Production) |
| **Security** | Custom STS (JWT), RBAC (Admin/User) |
| **Testing** | xUnit, Jest, Pact (Contract), k6 (Load) |
| **Observability** | OpenTelemetry, Jaeger, Grafana Loki, Prometheus, Grafana |
| **CI/CD** | GitHub Actions |

### Service Ports

| Service | Port | Protocol | Description |
|---------|------|----------|-------------|
| **IdentityService** | 5010 | HTTP | JWT authentication |
| **OrderService** | 5011 | HTTP | REST API (local), 8080 (Docker/K8s) |
| **PaymentService** | 50051 | gRPC | Payment processing |
| **PaymentService** | 5012 | HTTP | REST API / Swagger |
| **InventoryService** | 50052 | gRPC | Inventory & Product Catalog |
| **InventoryService** | 8081 | HTTP | Management REST API |
| **Storefront** | 3000 | HTTP | Customer React App |
| **Admin Tool** | 4200 | HTTP | Admin Angular App |
| **Kong Gateway** | 8000 | HTTP | API Gateway proxy |
| **Kong Gateway** | 9080 | gRPC | gRPC proxy |
| **PostgreSQL** | 5432 | TCP | OrderService database |
| **MongoDB** | 27017 | TCP | PaymentService database |
| **PostgreSQL** | 5433 | TCP | InventoryService database |
| **OTel Collector** | 4317 | gRPC | OTLP receiver |
| **OTel Collector** | 8888 | HTTP | Collector health metrics |
| **OTel Collector** | 8889 | HTTP | Service metrics (Prometheus) |
| **Jaeger** | 16686 | HTTP | Tracing UI |
| **Loki** | 3100 | HTTP | Log aggregation |
| **Prometheus** | 9090 | HTTP | Metrics UI |
| **Grafana** | 3301 | HTTP | Dashboards UI |

---

## 📈 Current Status
- **Selected Path**: Plan 1 (Synchronous gRPC)
- **Overall Progress**: 100% Completed (Core), Expanding with Go & Angular
- **Current Step**: Step 23 - Angular Admin Integration
- **Git State**: Multi-language Saga + Admin Tool implementation complete

---

## Roadmap Overview

### Phase 1: Foundation
- **Step 1: Define Protobuf Contracts** - [x] Completed
- **Step 2: Scaffold .NET Order Service (Orchestrator)** - [x] Completed
- **Step 3: Scaffold Node.js Payment Service (Participant)** - [x] Completed
- **Step 4: Repository Setup & Git Architecture** - [x] Completed

### Phase 2: Local Environment & Infrastructure
- **Step 5: Docker Compose Infrastructure** - [x] Completed
- **Step 6: Database Persistence Layer (SQL vs NoSQL)** - [x] Completed
- **Step 7: Custom Identity Service (STS)** - [x] Completed
- **Step 8: API Gateway (Kong/NGINX)** - [x] Completed

### Phase 3: Business Logic & Saga Pattern
- **Step 9: gRPC Communication & Metadata** - [x] Completed
- **Step 10: Synchronous Orchestration Saga Implementation** - [x] Completed
- **Step 11: Resilience Integration (Polly & Opossum)** - [x] Completed
- **Step 12: Compensating Transactions (Undo logic)** - [x] Completed

### Phase 4: Quality, Verification & CI/CD
- **Step 13: Unit & Integration Testing Strategy** - [x] Completed
- **Step 14: Contract Testing with Pact** - [x] Completed
- **Step 15: GitHub Actions CI/CD Pipeline** - [x] Completed
- **Step 16: Load Testing with k6** - [x] Completed

### Phase 5: Observability & Production Readiness
- **Step 17: OpenTelemetry & Distributed Tracing** - [x] Completed
- **Step 18: Grafana Loki Logging & Correlation IDs** - [x] Completed
- **Step 19: Prometheus & Grafana Dashboards** - [x] Completed
- **Step 20: Kubernetes Readiness** - [x] Completed

### Phase 6: Polyglot Expansion (Go & Angular)
- **Step 21: Go Inventory Service & PostgreSQL** - [x] Completed
- **Step 22: Contract Testing (Pact) for Go** - [x] Completed
- **Step 23: Angular 19 Admin Tool with PrimeNG** - [x] Completed
- **Step 24: Storefront (React) & Quantity Support** - [x] Completed