# SRE & Observability Mastery Checklist

**Goal:** implement independently, master the *why* for technical interviews.

- **Section 1 — Local Dev:** runs entirely on this machine (k3d + Docker Compose). Ordered as a learning path — do top to bottom.
- **Section 2 — Remote/Cloud:** needs a VM, public IP, or cloud account. Parked until infra exists.

Every local task uses the same format: **Prove** (the skill), **Do** (the steps), **Pass** (binary check).

---

## 📊 Progress at a Glance

| Status | Tasks |
|---|---|
| ✅ Done | Phase 1 (k3d, anti-affinity, Kong) · 4.1 k3s VM bootstrap |
| 🎯 Now | 3.1 Jaeger gap → 3.2 Loki correlation (in order) |
| 🟢 Queued | 2.2 PV/PVC · 4.3 Cert-Manager · 5.1 Pool · 5.2 P99 · 6.1 ArgoCD |
| 🏁 Capstone | 5.3 Ghost Latency (after 3.x + 5.x) |
| ☁️ Parked | 4.2 TLS-SAN · 4.3b Let's Encrypt · 4.4 Multi-node · 6.2 AKS |

---

# 🖥 Section 1 — Local Dev

## 🎯 Now

### 1. Jaeger Trace Gap *(3.1)*

- **Prove:** you can spot *invisible* latency — time a parent span spends doing nothing observable.
- **Do:** generate ~50 requests through Kong → Jaeger UI → sort by duration → open the slowest → compare parent duration vs sum of children.
- **Pass:** you can point at one trace and say which service owns the gap and how many ms it is.

> *Interview:* "I found a 3s 'white space' gap in a request chain. Not slow code — a timeout waiting for an unresponsive downstream."

### 2. Loki TraceID Correlation *(3.2)*

- **Prove:** one TraceID stitches every service's logs into a single timeline.
- **Do:** copy the TraceID from task 1 → Grafana → Explore → Loki → `{job=~".+"} | json | trace_id="<id>"`.
- **Pass:** logs from ≥3 services appear for that one request, in timestamp order.

> *Interview:* "TraceID correlation is the glue. One ID, five services' logs on one screen — bug traced in under a minute."

## 🟢 Queued

### 3. PV/PVC Force-Delete Drill *(2.2 — 30 min)*

- **Prove:** data outlives the pod, not the container.
- **Do:** insert a marker row in Postgres → `kubectl delete pod postgresql-0 --force --grace-period=0` → wait for recreation → query the row.
- **Pass:** the row survives. Bonus: explain `kubectl get pvc` before/after.

> *Interview:* "Pods are cattle, volumes are pets. PVC decouples data from container lifecycle."

### 4. Cert-Manager, Self-Signed *(4.3)*

- **Prove:** certificate issuance is automated end-to-end — no manual openssl.
- **Do:** Helm install cert-manager → self-signed `ClusterIssuer` → annotate one Ingress with `cert-manager.io/cluster-issuer` → watch the `Certificate` resource.
- **Pass:** `kubectl get certificate` shows `READY=True` and `curl -kv` shows the issued cert on the Ingress.

> *Interview:* "I automated SSL to eliminate the #1 self-inflicted outage class — expired certs."

*Let's Encrypt half → Section 2 (needs public IP).*

### 5. Connection Pool Analysis *(5.1)*

- **Prove:** you can see pool saturation *before* it becomes an outage.
- **Do:** find the metric in Prometheus (`go_sql_stats_connections_wait_duration` for InventoryService, or .NET/Node equivalent) → run load → graph waits vs pool max.
- **Pass:** a saved PromQL query shows wait time rising under load, and you can state the pool limit it's hitting.

> *Interview:* "Average latency is misleading. Pool saturation predicts the bottleneck before the crash."

### 6. P99 Latency Mapping *(5.2)*

- **Prove:** you can quantify worst-case user experience, not averages.
- **Do:** Grafana panel with `histogram_quantile(0.99, sum(rate(<duration_bucket>[5m])) by (le, service))` → compare P50 vs P99 under load.
- **Pass:** panel exists; you can name the service with the worst P50→P99 spread and why.

> *Interview:* "P99 is the worst real user experience. Averages hide the 1% who wait 10 seconds."

### 7. ArgoCD App-of-Apps *(6.1)*

- **Prove:** Git is the source of truth — manual cluster changes get reverted automatically.
- **Do:** Helm install ArgoCD → connect this repo → root App-of-Apps pointing at `platform/charts/` → `kubectl edit` a deployment by hand and watch.
- **Pass:** the manual edit is auto-reverted and the app shows `Synced/Healthy`.

> *Interview:* "Git becomes the source of truth. Drift is auto-reverted — manual changes can't survive."

## 🏁 Capstone

### 8. Ghost Latency Investigation *(5.3 — blocked on tasks 1–2, 5–6)*

- **Prove:** all four skills combined — given a slow endpoint, produce a root-cause narrative using traces, logs, and metrics together.

---

# ☁️ Section 2 — Remote / Cloud

Not practical locally — each needs something this machine can't fake. **Do not start** until the prerequisite exists; then move the task into Section 1 with Prove/Do/Pass.

| Task | Why not local | Needs |
|---|---|---|
| **4.2** TLS-SAN & remote kubectl | The point is validating the API cert against a *remote public IP* — localhost defeats it | VM from 4.1 reachable over internet |
| **4.3b** Let's Encrypt issuer | ACME HTTP-01 needs a public domain + port 80 open to the internet | Public DNS → VM |
| **4.4** Multi-node k3s | Joining a real agent over the network (token, flannel across hosts) — k3d nodes share one kernel | Second VM |
| **6.2** Azure AKS + Key Vault | Managed control plane, cloud IAM, CSI secrets driver — nothing local emulates it | Funded Azure account |

---

## 🛠 Tool → Task Map

| Tool | Where it's exercised |
|---|---|
| kubectl / Helm | every task |
| Jaeger | 1, 8 |
| Loki / LogQL | 2 |
| Prometheus / PromQL | 5, 6, 8 |
| Cert-Manager | 4, 4.3b |
| ArgoCD | 7 |
| k3s / k3d | 4.2, 4.4 |
| Azure AKS | 6.2 |

---

*Last updated: Friday, June 12, 2026*
