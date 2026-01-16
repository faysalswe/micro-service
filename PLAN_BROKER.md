# Microservices Project Plan (Event-Driven / Broker)

## 1. Project Overview
An asynchronous, event-driven architecture using a Message Broker to achieve high decoupling and eventual consistency across distributed services.

- **Service A (.NET 8)**: Event Producer/Consumer + PostgreSQL.
- **Service B (Node.js)**: Event Producer/Consumer + MongoDB.
- **Message Broker**: RabbitMQ for asynchronous orchestration.

## 2. Core Architecture & Patterns

### Event-Driven Communication
- **Asynchronous Messaging**: All inter-service interaction is handled via events and commands over RabbitMQ.
- **Decoupled Queries**: Services use local read-models or asynchronous request-reply patterns via the broker for data retrieval.

### Distributed Transactions (Choreography Saga)
- **Decoupled Workflow**: Services react to domain events rather than direct commands.
- **Eventual Consistency**: State is synchronized across boundaries via message passing.
- **Transactional Outbox**: Guarantees that database updates and message publishing are atomic.

### Reliability & Resilience
- **Idempotent Consumers**: Every handler protects against duplicate messages ("at-least-once" delivery).
- **Dead Letter Queues (DLQ)**: Failed messages isolated for manual investigation or retry policies.
- **Consumer Retries**: Exponential backoff managed via broker/middleware.

### Observability & Security
- **Cross-Broker Tracing**: OpenTelemetry spans propagated through message headers.
- **Elastic Observability**: ELK stack for event logging; Prometheus for queue monitoring.
- **Keycloak IAM**: Standardized authentication for API entry points.

## 3. Technology Stack Summary

| Category | Tools |
| :--- | :--- |
| **Messaging** | RabbitMQ (MassTransit for .NET) |
| **Persistence** | PostgreSQL, MongoDB, Redis |
| **Patterns** | Transactional Outbox, Choreography Saga |
| **Communication** | RabbitMQ (Asynchronous Events/Commands) |
| **Infrastructure** | Docker Compose, Helm, Kubernetes |
| **Observability** | OpenTelemetry, ELK Stack, Prometheus, Grafana |
| **Testing/CD** | xUnit, Jest, Pact, k6, GitHub Actions |

## 4. Implementation Roadmap

### Phase 1: Foundation & Event Schema
- [ ] Define shared Event schemas (JSON).
- [ ] Scaffold .NET Service (PostgreSQL) and Node.js Service (MongoDB).
- [ ] RabbitMQ setup in Docker Compose.

### Phase 2: Infrastructure & Messaging
- [ ] Set up Keycloak for authentication.
- [ ] Integrate MassTransit (.NET) and Node.js producer/consumer logic.
- [ ] Implement Transactional Outbox for database-to-broker atomicity.

### Phase 3: Saga & Reliability
- [ ] Implement Choreography logic (e.g., OrderCreated -> PayOrder).
- [ ] Configure Dead Letter Queues (DLQ) and Idempotency logic for consumers.
- [ ] Implement compensating events (rollback logic).

### Phase 4: Observability & Quality
- [ ] Integrate OpenTelemetry (with Trace propagation via headers).
- [ ] Set up ELK Stack and Prometheus/Grafana dashboards.
- [ ] Load testing (k6) and GitHub Actions CI/CD setup.

