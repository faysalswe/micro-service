# Mastery Roadmap: SRE & Observability

This roadmap is designed to help you master Kubernetes, High-Availability, and Observability using a polyglot microservices system as the "Patient."

---

## Pillar 1: High-Availability (HA) Platform Deployment
**Objective:** Move from Docker Compose to a Production-grade Kubernetes environment.

- **Kind Cluster Configuration:** 
  - Create a 4-node cluster (1 Control Plane + 3 Workers).
  - Use `podAntiAffinity` to ensure `OrderService` replicas never live on the same node.
- **Gateway & Ingress:** 
  - Configure **Kong** as the Ingress Controller.
  - Route traffic to 6 different services using a single Gateway.
- **Persistence:** 
  - Deploy PostgreSQL and MongoDB using Helm with Persistent Volumes.
  - **The Challenge:** Kill a database pod and verify that K8s restarts it with all data intact.

---

## Pillar 2: The "Lightweight Professional" Cluster (k3s)
**Objective:** Deploy a production-ready, internet-facing cluster on a Linux VM.

- **k3s Bootstrapping:** 
  - Install a certified K8s cluster (k3s) on a single Ubuntu VM.
  - Understand the SQLite-based control plane.
- **Networking & SSL:** 
  - Expose the cluster securely to the public internet.
  - Automate SSL certificates using **Cert-Manager** and Let's Encrypt.
- **The Challenge: "The Multi-Node Expansion":** 
  - Join a second worker node to the cluster using the k3s node token.

---

## Pillar 3: Observability & "Ghost" Diagnostics
**Objective:** Master the "Three Pillars" to find bottlenecks that logs cannot see.

- **Jaeger (Tracing):** 
  - Find a trace with a 3s "gap" (white space).
  - Identify exactly which service or database call is causing the "wait."
- **Prometheus (Metrics):** 
  - Analyze `go_sql_stats_connections_wait` and `nodejs_eventloop_lag`.
  - Correlate high P99 latency with low database connection pool availability.
- **Loki (Logs):** 
  - Use `TraceID` to instantly pull logs from 5 different services into one screen.
- **The Challenge:** Fix the 3s "Ghost Latency" using data from Jaeger and Prometheus.

---

## Tools to Master
- **Infrastructure:** `kubectl`, `helm`, `Kind`, `k3s`, `Kong`.
- **Observability:** `OpenTelemetry`, `PromQL`, `LogQL`, `Jaeger`.
- **Security:** `Cert-Manager`, `Non-Root Users`, `Secrets`.
