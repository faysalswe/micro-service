# Cluster Setup

## Navigating with kubectl

```bash
# --- View ---
kubectl get pods -n default              # list pods
kubectl get pods -n default -o wide      # pods + which node each runs on
kubectl get pods -n default -w           # watch pods live (auto-refreshes)
kubectl get all -n default               # pods + services + deployments
kubectl get nodes                        # list cluster nodes

# --- Debug ---
kubectl logs <pod-name> -n default             # see pod output/errors
kubectl logs <pod-name> -n default --previous  # logs from before last crash
kubectl logs <pod-name> -n default -f          # stream logs live
kubectl describe pod <pod-name> -n default     # full details + events (why it won't start)
kubectl exec -it <pod-name> -n default -- sh   # open shell inside a pod

# --- Namespaces ---
kubectl get pods -n kong                 # kong namespace
kubectl get pods -A                      # ALL namespaces at once
```

> Pods are NOT visible in Docker Desktop — they run inside k3d node containers via containerd, not Docker.

---

## k9s — Terminal UI

Install: `brew install k9s` — Run: `k9s`

```
:pods        → go to pods view
:namespaces  → switch namespace
:nodes       → see all nodes
```

| Key | Action |
|-----|--------|
| `l` | View logs |
| `d` | Describe pod (events + details) |
| `e` | Edit resource |
| `ctrl+d` | Delete pod (forces restart) |
| `enter` | Drill into a resource |
| `esc` | Go back |
| `?` | Show all shortcuts |
| `:q` | Quit |

k9s reads your existing kubeconfig — no extra setup needed.

---

## Files

| File | Purpose |
|------|---------|
| `setup-k3d.sh` | Creates k3d cluster + MetalLB + Kong |
| `setup-kind.sh` | Creates kind cluster + MetalLB + Kong |
| `k3d-cluster.yaml` | k3d cluster definition (3 control-planes, 3 workers, registry) |
| `kind-cluster.yaml` | kind cluster definition (3 control-planes, 3 workers) |
| `deploy-services.sh` | Build → push → secret → Helm deploy |
| `create-secrets.sh` | Creates `db-credentials` Kubernetes secret from `.env` |
| `docker-compose.infra.yaml` | Run databases locally (outside Kubernetes) |
| `docker-compose.debug.yaml` | Debug configuration for local services |

---

## What Changed

### k3d (`k3d-cluster.yaml` + `setup-k3d.sh`)

**`k3d-cluster.yaml`:**
- `servers: 3` — 3 control-planes for HA (etcd quorum: 1 can die, cluster survives)
- `agents: 3` — 3 worker nodes to run app pods
- `--disable=traefik` — disabled k3s default ingress so Kong can take over
- Added registry mirror config — without this, nodes try `localhost:5001` on themselves and fail:
  ```yaml
  config: |
    mirrors:
      "localhost:5001":
        endpoint:
          - "http://micro-registry:5000"
  ```

**`setup-k3d.sh`:**
- Added MetalLB — replaces k3d's built-in HAProxy so both k3d and kind use the same LoadBalancer approach
- MetalLB IP pool auto-detected from k3d Docker network subnet (assigns `.200–.250` range)
- Kong installed as LoadBalancer (MetalLB assigns it a real IP: `172.20.0.200`)

---

### kind (`kind-cluster.yaml` + `setup-kind.sh`)

**`kind-cluster.yaml`:**
- `3 control-plane nodes` — HA setup, kind auto-creates HAProxy for multi-control-plane routing
- `3 worker nodes`
- `extraPortMappings` on first control-plane — maps Mac ports `8100:80` and `8543:443` into cluster
- `containerdConfigPatches` — configures containerd to pull from local registry at `localhost:5001`

**`setup-kind.sh`:**
- Added MetalLB — replaced NodePort workaround (kind has no built-in LoadBalancer)
- Added actual Kong install — was previously only printed as a tip, now runs directly
- Same MetalLB + Kong commands as k3d — both clusters are now identical in setup

---

## Architecture

```
Your Mac
  ├── localhost:8100 ──→ k3d HAProxy (serverlb) ──→ MetalLB (172.20.0.200) ──→ Kong
  │                                                                                ↓
  │                                                             ┌──────────────────┤
  │                                                             ↓                  ↓
  │                                                       order-service     payment-service
  │
  └── registry: localhost:5001 ──→ micro-registry container (Docker network)
                                        ↑ nodes pull from here via mirror config
```

### Traffic Flow
```
curl localhost:8100/api/orders
  → Kong (172.20.0.200:80)
    → Ingress rule: /api/orders → order-service:5011
      → order-service pod
```

