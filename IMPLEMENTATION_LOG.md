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

## 🏗️ Project Context
- **Architecture**: Synchronous gRPC (Plan 1).
- **Strategy**: Deliberate, iterative implementation focused on architectural understanding.

---

## 📈 Current Status
- **Selected Path**: Plan 1 (Synchronous gRPC)
- **Overall Progress**: 0% Completed
- **Next Step**: Step 1: Define Protobuf Contracts

---

## Roadmap Overview

### Phase 1: Foundation
- **Step 1: Define Protobuf Contracts** - [ ] Not Started
- **Step 2: Scaffold .NET Order Service (Orchestrator)** - [ ] Not Started
- **Step 3: Scaffold Node.js Payment Service (Participant)** - [ ] Not Started
- **Step 4: Repository Setup & Git Architecture** - [ ] Not Started

### Phase 2: Local Environment & Infrastructure
- **Step 5: Docker Compose Infrastructure** - [ ] Not Started
- **Step 6: Database Persistence Layer (SQL vs NoSQL)** - [ ] Not Started
- **Step 7: Keycloak Identity Management** - [ ] Not Started
- **Step 8: API Gateway (Kong/NGINX)** - [ ] Not Started

### Phase 3: Business Logic & Saga Pattern
- **Step 9: gRPC Communication & Metadata** - [ ] Not Started
- **Step 10: Synchronous Orchestration Saga Implementation** - [ ] Not Started
- **Step 11: Resilience Integration (Polly & Opossum)** - [ ] Not Started
- **Step 12: Compensating Transactions (Undo logic)** - [ ] Not Started

### Phase 4: Quality, Verification & CI/CD
- **Step 13: Unit & Integration Testing Strategy** - [ ] Not Started
- **Step 14: Contract Testing with Pact** - [ ] Not Started
- **Step 15: GitHub Actions CI/CD Pipeline** - [ ] Not Started
- **Step 16: Load Testing with k6** - [ ] Not Started

### Phase 5: Observability & Production Readiness
- **Step 17: OpenTelemetry & Distributed Tracing** - [ ] Not Started
- **Step 18: ELK Stack Logging & Correlation IDs** - [ ] Not Started
- **Step 19: Prometheus & Grafana Dashboards** - [ ] Not Started
- **Step 20: Service Mesh (Istio) & Kubernetes Readiness** - [ ] Not Started

---

## Detailed Implementation Log

### Step 1: Define Protobuf Contracts
**Status**: [x] Completed

### Decision: Protocol Buffers (Binary) vs. JSON (Text)
- **Chosen**: **Protobuf**.
- **Reasoning**: In a multi-language environment (.NET & Node.js), a neutral "contract" is essential. Protobuf provides type safety and high performance with a formal schema.
- **Key Discovery**: Field numbers (e.g., `= 1`) are critical for binary identification and backward compatibility.
- **Alternative**: **OpenAPI/Swagger (JSON)**.
    - *Advantage*: Human-readable, easier to test via browser.
    - *Disadvantage*: Larger payload size, slower parsing, and no built-in streaming or multiplexing like gRPC.

### Step 2: Scaffold .NET Order Service (Orchestrator)
**Status**: [x] Completed

### Decision: Orchestration vs. Choreography
- **Chosen**: **Orchestration**.
- **Reasoning**: Service A (Order) will explicitly control the flow. This makes debugging distributed transactions easier because there is a single place to look for the logic.
- **Implementation Detail**: Linked the root `protos/orders.proto` to the project using `<Protobuf ... Link="..." />`. This keeps the source of truth in the shared folder.
- **Alternative**: **Choreography**.
    - *Disadvantage*: Difficult to visualize the entire business process without a centralized map.

### Step 3: Scaffold Node.js Payment Service (Participant)
**Status**: [x] Completed

### Decision: Pure TypeScript vs. NestJS
- **Chosen**: **Pure TypeScript/Node.js**.
- **Reasoning**: To understand the "under the hood" mechanics of gRPC in Node.js without the abstraction layers of a larger framework like NestJS.
- **Implementation Detail**: Used `@grpc/proto-loader` for **Dynamic Loading** of the `.proto` file.
- **Alternative**: **NestJS**.
    - *Disadvantage*: More overhead and hides implementation details important for learning.

### Step 4: Repository Setup & Git Architecture
**Status**: [x] Completed
- **Decision**: Monorepo vs. Polyrepo.
- **Reasoning**: We are using a **Monorepo** (one git folder) for this learning project to keep the shared `protos/` folder easily accessible to both services.

### Phase 2: Local Environment & Infrastructure
- **Step 5: Docker Compose Infrastructure** - [x] Completed
    - **Decision**: Docker Compose vs. Local Native Install.
    - **Reasoning**: Ensures environment parity and isolates dependencies like SQL, NoSQL, and Redis.
    - **Tools Added**: Postgres (Orders), MongoDB (Payments), Redis (Cache/State).
- **Step 6: Database Persistence Layer (SQL vs NoSQL)** - [x] In Progress

... (Details for further steps will be added as we reach them) ...
