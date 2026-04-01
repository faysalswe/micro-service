# Gemini Context: Microservices SRE & Observability Mastery

This project is a polyglot microservices architecture used as a testing ground for **High Availability**, **k3s Platform Engineering**, and **Advanced Observability**.

## Mastery Roadmap (The 3 Pillars)

1.  **Pillar 1: HA Platform Deployment**: Multi-node Kind cluster, Anti-affinity, Kong Gateway, and Persistent Databases.
2.  **Pillar 2: Lightweight Professional Cluster**: Bootstrapping k3s on Linux VMs with SSL automation.
3.  **Pillar 3: Observability & Ghost Diagnostics**: Distributed tracing (Jaeger), Metrics (Prometheus), and Log Aggregation (Loki).

## Architecture & Monorepo Structure

- **`apps/`**: Frontend applications (React Storefront, Angular Back-Office).
- **`services/`**: Backend microservices (.NET, Go, Node.js).
- **`platform/`**: The "Platform Engineering" hub.
  - `charts/`: Helm blueprints for apps and infrastructure.
  - `cluster/`: Definition for Kind and Docker Compose.
  - `config/`: Gateway and monitoring configuration.
- **`protos/`**: gRPC definitions.

## Key Learning Milestones

- ✅ **Security**: All containers run as non-root (UID 1001).
- ✅ **Connectivity**: Services discovery via K8s DNS fixed.
- ✅ **Monorepo**: Standardized folder structure for CI/CD readiness.
- 🚧 **Ghost Latency**: Investigation in progress using Jaeger and Prometheus.
- 🚧 **Architecture Expansion (Planned)**:
  - **Redis Integration**: Services will be updated to use Redis for distributed caching and state management.
  - **Infrastructure Monitoring**: cAdvisor and Node Exporter are now live in Docker Compose and scraped by Prometheus.

## Tools to Master
`kubectl`, `helm`, `Kind`, `k3s`, `Kong`, `OpenTelemetry`, `PromQL`, `LogQL`, `Jaeger`, `Cert-Manager`.
