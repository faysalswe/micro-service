# Project Study Guide — Every Topic, Tool & Technique

A complete map of what this project uses and what you need to understand about each. Organized in **study order** — each layer builds on the previous one.

Every entry follows the same format:
- **What** — the concept in one or two lines
- **Here** — where it lives in this repo (so you study against real code)
- **Master** — the questions you must be able to answer without looking

---

## Layer 1 — Architecture & Communication Patterns

### 1.1 Microservices & Polyglot Architecture

- **What:** independent services, each owning its data and deployable alone; different languages chosen per workload.
- **Here:** `services/` — .NET (Identity, Order), Node.js (Payment), Go (Inventory), Python (Cart, Pdf).
- **Master:**
  - Why split a monolith at all? What does it cost you (network hops, distributed failure modes, observability burden)?
  - Why might Go suit Inventory (high-throughput stock checks) but Python suit PdfService (library ecosystem)?
  - What is "database per service" and why does no service share a DB here?

### 1.2 Synchronous Orchestration Saga

- **What:** OrderService coordinates a multi-service transaction (reserve stock → take payment → confirm) and runs **compensating actions** on failure — distributed transactions without 2PC.
- **Here:** `services/OrderService/` (the orchestrator), gRPC calls into Payment + Inventory.
- **Master:**
  - Orchestration vs choreography sagas — trade-offs of each.
  - What happens if payment succeeds but the confirmation call fails? (idempotency, compensation)
  - Why not a distributed transaction / two-phase commit?

### 1.3 gRPC & Protocol Buffers

- **What:** binary RPC over HTTP/2 with contract-first schemas; `buf` generates client/server code per language.
- **Here:** `protos/` (`orders/`, `payments/`, `inventory/`, `auth/`, `loyalty/`), `buf.yaml` + `buf.gen.yaml`.
- **Master:**
  - gRPC vs REST: when does each win? (streaming, type safety, browser support)
  - How does one `.proto` file serve four languages? What does `buf generate` produce?
  - Field numbering & backward compatibility — why can't you reuse a deleted field number?

### 1.4 API Gateway (Kong, DB-less)

- **What:** single entry point that routes, authenticates, and rate-limits before traffic reaches any service; DB-less = config is a YAML file, not a database.
- **Here:** `platform/config/gateway/` (`kong.yml`, `kong.local.yml`), `make kong-local` / `make kong-docker` hybrid routing.
- **Master:**
  - Why must external clients never call services directly?
  - DB-less vs DB mode — why is declarative config better for GitOps?
  - How does the hybrid mode work — same Kong, two upstream target sets (host ports vs Docker DNS names)?

### 1.5 JWT Authentication (STS pattern)

- **What:** IdentityService is a Security Token Service — issues signed JWTs; other services validate the signature without calling back.
- **Here:** `services/IdentityService/`.
- **Master:**
  - Stateless validation: how does OrderService trust a token it didn't issue?
  - What's in a JWT (header/claims/signature)? Symmetric vs asymmetric signing?
  - Token expiry vs revocation — what's the trade-off of stateless auth?

---

## Layer 2 — Data Layer

### 2.1 PostgreSQL (relational)

- **What:** ACID store for Order & Inventory — data with relationships and integrity constraints.
- **Here:** Compose `postgres:16-alpine`; StatefulSet via Helm in k8s.
- **Master:** why relational for orders (transactions, foreign keys)? What is connection pooling and why does task 5.1 in the checklist monitor pool saturation?

### 2.2 MongoDB (document)

- **What:** schema-flexible store for Payment records.
- **Here:** Compose `mongo:7.0`.
- **Master:** when do documents beat rows? What consistency do you give up?

### 2.3 Redis (in-memory)

- **What:** key-value store holding cart state — fast, ephemeral-tolerant data.
- **Here:** Compose `redis:7.2-alpine`; `CartService` (`REDIS_URL` in its `.env`).
- **Master:** why is a cart the textbook Redis use case? TTL/eviction; what happens to carts if Redis restarts — and why is that acceptable?

### 2.4 MinIO (object storage)

- **What:** S3-compatible blob store (generated PDFs, file artifacts).
- **Here:** Compose `minio/minio`.
- **Master:** object vs block vs file storage; why S3-compatible API matters (cloud portability).

> **Cross-cutting question:** this project runs *four* storage technologies. Be able to justify each choice in one sentence — that's a classic system-design interview probe.

---

## Layer 3 — Containers & Local Orchestration

### 3.1 Docker & Dockerfiles

- **What:** each service ships as an image; all run as **non-root (UID 1001)**.
- **Here:** `services/*/Dockerfile`.
- **Master:**
  - Layers & caching: why does `COPY package.json` + `npm install` come before `COPY . .`?
  - Multi-stage builds — build SDK vs runtime image.
  - Why non-root? What attack does it mitigate?

### 3.2 Docker Compose (two-file pattern)

- **What:** `docker-compose.infra.yaml` (databases + observability) is separate from `docker-compose.debug.yaml` (the services) — so you can run infra in Docker but services bare-metal.
- **Here:** `platform/cluster/compose/`, driven by `make infra-up` / `make services-up`.
- **Master:** Compose networking (service name = DNS name); why split infra from services; how debug ports (401x) map into containers.

### 3.3 Multi-Environment Configuration

- **What:** one `.env` for localhost, `.env.docker` overlay for Docker hostnames, per-service `.env` for service-specific keys.
- **Here:** root `.env`, `.env.docker`, `services/*/.env` (see README "Environment" table).
- **Master:** why does the same service need `localhost:5432` in one env and `postgres:5432` in another? Precedence order when files merge.

---

## Layer 4 — Kubernetes & Platform Engineering

### 4.1 Kubernetes Fundamentals

- **What:** declarative desired-state orchestration — Deployments, Services, Ingress, ConfigMaps, Secrets, StatefulSets.
- **Here:** rendered by the Helm charts in `platform/charts/`.
- **Master:**
  - The reconciliation loop: what does "declarative" actually mean mechanically?
  - Deployment vs StatefulSet — why are the databases StatefulSets?
  - Service types (ClusterIP/NodePort/LoadBalancer) and how K8s DNS makes `order-service.default.svc` resolve.

### 4.2 k3s / k3d / kind (lightweight clusters)

- **What:** k3s = production-grade lightweight K8s; k3d = k3s inside Docker (local multi-node); kind = alternative local cluster.
- **Here:** `platform/cluster/k3d/`, `platform/cluster/kind/`; a real k3s VM exists (checklist 4.1 done).
- **Master:** what k3s strips out vs full K8s; how k3d fakes "nodes" as containers; why multi-node *locally* still can't prove real network behavior (see checklist Section 2).

### 4.3 Helm (charts, umbrella pattern)

- **What:** templated, versioned K8s manifests; the **umbrella chart** deploys the whole system as one release with sub-charts.
- **Here:** `platform/charts/` — `apps/` (8 service charts), `infra/`, `observability/`, `kong-config/`, `umbrella/`.
- **Master:**
  - Template + values = manifest: trace one value from `values.yaml` to rendered YAML.
  - Umbrella/sub-chart dependency mechanics (`Chart.yaml` dependencies, `Chart.lock`).
  - Release lifecycle: install/upgrade/rollback — what does Helm store to enable rollback?

### 4.4 Scheduling: Anti-Affinity

- **What:** rules forcing replicas of one service onto *different* nodes so a node failure can't kill all replicas.
- **Here:** all 8 app charts (Phase 1, done).
- **Master:** `podAntiAffinity` required vs preferred; topology key; what happens when there are more replicas than nodes under `required`?

### 4.5 Storage: PV / PVC / StorageClass

- **What:** volumes with a lifecycle independent of pods — the reason databases survive pod deletion.
- **Here:** database sub-charts in `platform/charts/infra/`; checklist task 2.2 is the live drill.
- **Master:** PV vs PVC vs StorageClass roles; reclaim policies; "pods are cattle, volumes are pets."

### 4.6 Ingress & Kong Ingress Controller

- **What:** Kong running *inside* the cluster as the Ingress implementation — same gateway concept as Layer 1.4, K8s-native form.
- **Here:** `platform/charts/kong-config/`.
- **Master:** Ingress resource vs Ingress controller (the spec vs the engine); how a path rule becomes a Kong route.

### 4.7 TLS & Cert-Manager

- **What:** in-cluster controller that issues and renews certificates automatically from a `ClusterIssuer`.
- **Here:** checklist task 4.3 (self-signed locally; Let's Encrypt needs the public VM).
- **Master:** Certificate/Issuer/Secret resource chain; ACME HTTP-01 challenge flow and why it requires public port 80; TLS-SAN — why a cert must name every IP/host clients use.

---

## Layer 5 — Observability (the project's identity)

### 5.1 OpenTelemetry (the foundation)

- **What:** vendor-neutral instrumentation standard — every service emits traces/metrics/logs to one **OTel Collector**, which fans out to Jaeger/Prometheus/Loki.
- **Here:** Collector in Compose (`otel/opentelemetry-collector-contrib`, gRPC :4317); each service's `OTEL_EXPORTER_OTLP_ENDPOINT`.
- **Master:**
  - The three signals and what question each answers (traces = *where*, metrics = *how much*, logs = *why*).
  - Collector pipeline: receiver → processor → exporter. Why a collector instead of exporting direct from services?
  - **Context propagation**: how does a TraceID cross a gRPC call boundary? (W3C `traceparent` header)

### 5.2 Distributed Tracing — Jaeger

- **What:** visualizes one request as a tree of spans across services; the "white-space gap" technique finds latency no log shows.
- **Here:** Jaeger UI :16686; checklist task 3.1.
- **Master:** span/parent/child anatomy; what a gap between parent and children means (lock wait, timeout, GC, DNS); sampling strategies and their cost trade-off.

### 5.3 Metrics — Prometheus & PromQL

- **What:** pull-based time-series scraping; PromQL turns counters into rates, histograms into percentiles.
- **Here:** Prometheus :9090, scrape config in `platform/charts/observability/config/`; checklist tasks 5.1, 5.2.
- **Master:**
  - Pull vs push model — why does Prometheus scrape?
  - Metric types: counter, gauge, histogram — why P99 needs histogram buckets.
  - Write from memory: `histogram_quantile(0.99, sum(rate(x_bucket[5m])) by (le))` and explain every function in it.
  - Why averages lie and P99 matters (checklist 5.2's whole point).

### 5.4 Logs — Loki & LogQL

- **What:** log aggregation that indexes *labels* not content (cheap vs Elasticsearch); LogQL filters streams like PromQL.
- **Here:** Loki :3100; checklist task 3.2.
- **Master:** label-index design and its query implications; structured (JSON) logging as a prerequisite; **TraceID injection** — how a log line gets the trace_id that links it to Jaeger.

### 5.5 Dashboards — Grafana

- **What:** single pane over all three backends; Explore mode is where trace→log correlation happens.
- **Here:** Grafana :3301 (admin/admin), datasources provisioned in the observability chart.
- **Master:** datasource provisioning as code; building a P50-vs-P99 panel; derived fields (auto-linking a trace_id in logs to Jaeger).

### 5.6 Infrastructure Metrics — cAdvisor & Node Exporter

- **What:** container-level (CPU/mem per container) and host-level (disk, network, load) metrics feeding Prometheus.
- **Here:** both in `docker-compose.infra.yaml`, scraped by Prometheus.
- **Master:** app metrics vs infra metrics — given high P99, how do you tell "slow code" from "starved container"? (this is the Ghost Latency capstone skill)

### 5.7 The Correlation Technique (ties 5.1–5.6 together)

- **What:** the workflow that makes observability *one system*: metric alert → find slow trace → copy TraceID → query logs → root cause.
- **Here:** checklist tasks 3.1 → 3.2 → 5.3 capstone; `/sre-troubleshooter` skill automates the workflow.
- **Master:** be able to narrate the full loop on a whiteboard in under two minutes. This is the interview story the whole project builds toward.

---

## Layer 6 — Testing Strategy

### 6.1 Unit Tests

- **Here:** `services/OrderService.Tests/`, `services/IdentityService.Tests/` (xUnit/.NET), `services/PaymentService` (`pnpm test`).
- **Master:** what belongs in a unit test vs integration test in a microservice (mock the gRPC clients, test the saga logic).

### 6.2 Contract Tests — Pact

- **What:** consumer-driven contracts — OrderService records what it *expects* from each provider; providers verify against the recording. Catches breaking changes without spinning up both services.
- **Here:** `tests/pacts/` (`OrderService-PaymentService.json`, etc.), `tests/pacts/HOWTO.md`.
- **Master:** consumer vs provider roles; why contract tests beat end-to-end tests for cross-team API safety; where Pact fits in CI.

### 6.3 Load Tests — k6

- **What:** scripted load generation in JS — also the tool that *creates* the traffic for observability exercises.
- **Here:** `tests/load-tests/` (one script per service).
- **Master:** VUs, iterations, thresholds; how to read a k6 summary; using k6 to make P99 visible (checklist 5.2's load source).

---

## Layer 7 — Roadmap Topics (study before you build)

| Topic | What to understand *before* starting | Checklist task |
|---|---|---|
| **ArgoCD / GitOps** | Pull-based deployment, App-of-Apps pattern, drift detection & auto-sync | 6.1 |
| **TLS-SAN remote access** | How kubeconfig auth works; why the API server cert must include the public IP | 4.2 |
| **Let's Encrypt / ACME** | HTTP-01 vs DNS-01 challenges; rate limits | 4.3b |
| **Multi-node k3s** | Node join tokens, flannel VXLAN across hosts | 4.4 |
| **Azure AKS + Key Vault** | Managed control plane, workload identity, CSI secrets driver | 6.2 |

---

## Suggested Study Sequence

1. **Layers 1–2** (architecture + data) — mostly reading code you have; 1 evening each.
2. **Layer 3** (containers) — you use it daily; fill gaps, don't re-learn.
3. **Layer 5** (observability) — *priority*: this is the active milestone and the project's identity. Pair each topic with its checklist task — theory then hands-on.
4. **Layer 4** (Kubernetes) — deepen alongside checklist tasks 2.2 and 4.3.
5. **Layer 6** (testing) — read the existing Pact files and k6 scripts; they're small.
6. **Layer 7** — just-in-time, when the prerequisite infra exists.

**Rule of thumb:** never study a tool without its checklist task open — every concept here has a hands-on counterpart in [LEARNING_TASK_CHECKLIST.md](LEARNING_TASK_CHECKLIST.md).

---

*Companion docs: [Observability & SRE Guide](OBSERVABILITY_SRE_MASTER_GUIDE.md) · [Networking & OS Internals](NETWORKING_OS_MASTER_GUIDE.md) · [Infrastructure Reference](INFRASTRUCTURE_REFERENCE.md)*

*Last updated: Friday, June 12, 2026*
