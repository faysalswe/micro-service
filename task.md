# Learning Roadmap: Microservices Mastery

This document contains three high-signal tasks designed to help you master gRPC, Sagas, Kubernetes, and Observability.

## Task 1: Distributed "Order Cancellation & Refund" Saga
**Objective:** Implement a full cancellation flow that reverses the initial "Create Order" Saga. 

- **gRPC Updates:** 
  - Add `RefundPayment(RefundRequest)` to `payments.proto`.
  - Add `RestockItems(RestockRequest)` to `inventory.proto`.
- **Order Service (C#):** 
  - Implement `DELETE /orders/{id}`.
  - Orchestrate the "Undo" Saga: Call Payment Refund -> if success -> Call Inventory Restock.
  - **Complexity:** If Inventory restock fails, the Order must transition to `CANCELLATION_PENDING` with a background retry using **Polly**.
- **Payment Service (Node.js):** Implement the `RefundPayment` handler and update MongoDB.
- **Inventory Service (Go):** Implement `RestockItems` using a PostgreSQL transaction.

---

## Task 2: High-Availability (HA) Production Deployment
**Objective:** Move from Docker Compose to a Production-grade Kubernetes environment on your Mac.

- **Local Setup:** Use **Kind** or **Docker Desktop K8s**.
- **Infrastructure:** Deploy PostgreSQL and MongoDB using Helm charts with Persistent Volume Claims (PVC).
- **Gateway:** Configure **Kong** as an Ingress Controller with SSL termination.
- **The Challenge:** Perform a **Canary Deployment** of `OrderService` V2.
  - Route 10% of traffic to V2 using Kong traffic-splitting.
  - Run a Kubernetes `Job` for database migrations before the V2 pods start.
  - **Success Criteria:** Zero failed requests during the migration while running `k6` load tests.

---

## Task 3: The "Ghost Latency" & Observability Debugging
**Objective:** Use the observability stack to find a "hidden" bottleneck that doesn't appear in standard logs.

- **The Problem:** `POST /orders` intermittently takes > 3s. `OrderService` claims it is fast.
- **Diagnostic Steps:**
  - **Jaeger:** Find a trace with a large "gap" (white space) between service spans. This indicates a "hidden" delay (e.g., event loop blocking in Node.js or connection pool exhaustion in Go).
  - **Prometheus:** Analyze the `go_sql_stats_connections_open` and `nodejs_eventloop_lag_seconds` metrics.
- **The Fix:** 
  - Identify a missing MongoDB index in the `PaymentService` that causes slow lookups under load.
  - Fix a "Trace Leak" where the `trace_id` is lost when the Go service calls a third-party mock API.
- **The Enhancement:** Create a Grafana Dashboard that correlates "P99 Latency" with "Database Connection Wait Time."

## Tools to Master
- **Development:** `protoc`, `Pact`, `Polly`, `GORM`, `Mongoose`.
- **Infrastructure:** `kubectl`, `helm`, `Kind`, `Kong`.
- **Observability:** `OpenTelemetry SDKs`, `PromQL`, `LogQL`, `Jaeger Query`.
