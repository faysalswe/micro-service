# Claude Code Context: Microservices SRE & Observability Mastery

This project is a polyglot microservices architecture used as a testing ground for **High Availability**, **k3s Platform Engineering**, and **Advanced Observability**.

## Mastery Roadmap (The 3 Pillars)

1.  **Pillar 1: HA Platform Deployment**: Multi-node k3s/k3d cluster, Anti-affinity, Kong Gateway, and Persistent Databases.
2.  **Pillar 2: Lightweight Professional Cluster**: Bootstrapping k3s on Linux VMs with SSL automation.
3.  **Pillar 3: Observability & Ghost Diagnostics**: Distributed tracing (Jaeger), Metrics (Prometheus), and Log Aggregation (Loki).

## Architecture & Monorepo Structure

- **`apps/`**: Frontend applications (React Storefront, Angular Back-Office).
- **`services/`**: Backend microservices (.NET, Go, Node.js).
- **`platform/`**: The "Platform Engineering" hub.
  - `charts/`: Helm blueprints for apps and infrastructure.
  - `cluster/`: Definition for k3s/k3d and Docker Compose.
  - `config/`: Gateway and monitoring configuration.
- **`protos/`**: gRPC definitions.

## Learning Resources

- [SRE & Observability Master Guide](docs/OBSERVABILITY_SRE_MASTER_GUIDE.md) - Deep dive into metrics, traces, and logs.
- [Networking & OS Internals Guide](docs/NETWORKING_OS_MASTER_GUIDE.md) - Understanding namespaces, veth, and CNI.
- [Infrastructure Reference](docs/INFRASTRUCTURE_REFERENCE.md) - k3d/k3s setup and operations.

## Key Learning Milestones

- ✅ **Security**: All containers run as non-root (UID 1001).
- ✅ **Connectivity**: Services discovery via K8s DNS fixed.
- ✅ **Monorepo**: Standardized folder structure for CI/CD readiness.
- 🚧 **Ghost Latency**: Investigation in progress using Jaeger and Prometheus.
- 🚧 **Architecture Expansion (Planned)**:
  - **Redis Integration**: Services will be updated to use Redis for distributed caching and state management.
  - **Infrastructure Monitoring**: cAdvisor and Node Exporter are now live in Docker Compose and scraped by Prometheus.

## Service Port Reference

| Service          | Stack   | HTTP  | gRPC  |
|------------------|---------|-------|-------|
| OrderService     | .NET    | 5011  | 50011 |
| PaymentService   | Node.js | 5012  | —     |
| InventoryService | Go      | 5013  | —     |
| OTel Collector   | —       | —     | 4317  |

## Communication Style (Non-Negotiable)

### 2. Concept first, precise detail on request

Always explain in this order:
1. **The idea** — one or two sentences: what it is, why it exists
2. **Before vs Now** — if something changed, the shift in 2-3 lines max
3. **Stop** — do not add commands, file lists, or breakdowns unless asked

When the user asks for detail: give it, but keep it **precise and tight** — no padding, no repetition, no restating what was already said. Every line must carry information.

**Wrong:** Long bullet lists, restating the concept before the detail, showing every file and command unprompted.
**Right:** Short concept → user asks more → precise focused answer.

For large or complex prompts: give **one line of feedback first** on how the question could have been clearer — then answer. Skip for simple questions.

---

## Hard Rules (Non-Negotiable)

> These rules override auto mode, task urgency, and any other instruction.

### 1. Never commit without explicit user approval

Before every `git commit`, you must:
1. Show the proposed commit message and list every file being committed.
2. **Stop and wait** for the user to say "go ahead", "commit", or "yes".
3. Only then run `git commit`.

This applies in all modes — auto, manual, agent. No exceptions.

**Why:** The user must review every commit before it lands. Violated twice in prior sessions.

---

## Tools to Master
`kubectl`, `helm`, `k3s`, `k3d`, `Kong`, `OpenTelemetry`, `PromQL`, `LogQL`, `Jaeger`, `Cert-Manager`.

## Sub-Agents Available

Use `@agent-name` to invoke a specialist:

- **@sre-mentor** — SRE concepts, interview prep, learning task guidance.
- **@frontend-expert** — React (Storefront) and Angular (Back-Office) UI work.
- **@observability-expert** — Jaeger tracing, Prometheus metrics, Loki log correlation.
- **@senior-architect** — System design, refactoring, architectural reviews.

## Slash Commands Available

- `/commit-agent` — Analyze and execute atomic logical git commits across the monorepo.
- `/sre-troubleshooter` — Guided workflow for diagnosing latency/timeout issues via the observability stack.
- `/helm-deployment` — Standardized workflow for deploying and verifying Helm charts.
