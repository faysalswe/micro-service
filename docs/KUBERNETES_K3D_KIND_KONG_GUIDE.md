# Kubernetes, k3d, kind, and Kong — From Zero to Understanding

This guide explains every concept from scratch. Read it top to bottom.
Each section builds on the previous one.

---

## Part 1: What is Kubernetes?

### The Problem Kubernetes Solves

Imagine you have 5 services (OrderService, PaymentService, etc.).
You need to run them. Where do you run them?

**Option A — Run on one machine:**
```
Your Server
├── OrderService    (running)
├── PaymentService  (running)
├── InventoryService (running)
└── ...
```
Problem: If the server dies → everything dies. One machine = one point of failure.

**Option B — Run across multiple machines:**
```
Machine 1          Machine 2          Machine 3
├── OrderService   ├── PaymentService  ├── InventoryService
└── ...            └── ...             └── ...
```
Problem: Now you need to manage 3 machines. How do you:
- Start a service on the right machine?
- Restart it if it crashes?
- Move it if a machine dies?
- Scale it up when traffic increases?

**Kubernetes solves Option B.** It manages multiple machines as one unified system.

---

### What Kubernetes Actually Does

```
You tell Kubernetes:
  "Run 3 copies of OrderService"
  "If any copy dies, restart it"
  "Never put 2 copies on the same machine"

Kubernetes figures out:
  - Which machine has free space
  - Starts the container there
  - Watches it 24/7
  - Restarts it if it crashes
```

You don't manage individual machines anymore.
You tell Kubernetes WHAT you want, and it makes it happen.

---

### Kubernetes Vocabulary (The 4 Most Important Words)

| Word | What it means | Real world analogy |
|------|--------------|-------------------|
| **Cluster** | A group of machines managed together | A company (many employees working together) |
| **Node** | One machine inside the cluster | One employee |
| **Pod** | One running container (your app) | One task being done |
| **Control Plane** | The brain that manages everything | The manager/CEO |

---

## Part 2: Two Types of Nodes

Every Kubernetes cluster has two types of nodes:

```
┌─────────────────────────────────────────────────────────┐
│                   Kubernetes Cluster                     │
│                                                          │
│  ┌─────────────────────┐   ┌───────────────────────┐   │
│  │   Control-Plane      │   │    Worker Nodes        │   │
│  │   Node(s)            │   │                        │   │
│  │                      │   │                        │   │
│  │  THE BRAIN           │   │  THE MUSCLES           │   │
│  │                      │   │                        │   │
│  │  Runs:               │   │  Runs:                 │   │
│  │  - kube-apiserver    │   │  - Your app pods       │   │
│  │  - etcd (database)   │   │  - OrderService        │   │
│  │  - scheduler         │   │  - PaymentService      │   │
│  │  - controller-manager│   │  - InventoryService    │   │
│  │                      │   │                        │   │
│  │  kubectl talks HERE  │   │  No direct access      │   │
│  └─────────────────────┘   └───────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Control-Plane Node — The Brain

When you run `kubectl get pods`, your command goes to the **control-plane node**.
It knows:
- What pods are running
- Which node they are on
- Whether they are healthy

If the control-plane node dies → you cannot manage the cluster at all.
Your apps might still run, but you cannot restart, scale, or update anything.

### Worker Nodes — The Muscles

Your actual application containers (pods) run here.
Worker nodes just follow orders from the control-plane.

---

## Part 3: What is Docker? (Quick Recap)

Docker runs applications inside **containers**.
A container is like a lightweight virtual machine — it has its own filesystem, network, and processes, but shares the host's Linux kernel.

```
Your Mac
└── Docker Desktop
        ├── container-1  (OrderService)
        ├── container-2  (PaymentService)
        └── container-3  (Database)
```

Each container is isolated. They don't interfere with each other.

---

## Part 4: The Problem — Kubernetes on Your Laptop

Kubernetes is designed for real servers in a data center.
To run it on your laptop for learning, you need a workaround.

The workaround: **use Docker containers as fake machines (nodes)**.

```
Your Mac (1 real machine)
└── Docker Desktop
        ├── Docker container acting as "node 1"  ← fake machine
        ├── Docker container acting as "node 2"  ← fake machine
        └── Docker container acting as "node 3"  ← fake machine

Kubernetes thinks it has 3 machines.
Actually it's 3 containers on your laptop.
```

This is what both **k3d** and **kind** do.

---

## Part 5: What is k3d?

### First — What is k3s?

**k3s** is a lightweight version of Kubernetes made by Rancher (a company).
It strips out less-common features to make Kubernetes run with less memory and CPU.
Designed for edge devices and IoT (Raspberry Pi, etc.).

Changes k3s makes vs real Kubernetes:
- Replaces **etcd** (production DB) with **SQLite** (simple file DB)
- Removes some rarely-used APIs
- Bundles everything into one binary
- Adds Traefik as default ingress (instead of nothing)

### Then — What is k3d?

**k3d** is a tool that runs k3s **inside Docker containers**.

```
k3d = k3s + Docker

Your Mac
└── Docker Desktop
        ├── k3d-micro-cluster-serverlb   ← HAProxy container (explained later)
        ├── k3d-micro-cluster-server-0   ← k3s control-plane (inside Docker)
        ├── k3d-micro-cluster-agent-0    ← k3s worker node (inside Docker)
        └── k3d-micro-cluster-agent-1    ← k3s worker node (inside Docker)
```

k3d makes it easy to create/delete/manage k3s clusters on your laptop with one command.

### Your k3d config (k3d-cluster.yaml)

```yaml
servers: 1        # create 1 control-plane node
agents: 0         # create 0 worker nodes
```

So k3d created:
```
Docker containers on your Mac:
├── k3d-micro-cluster-serverlb  ← HAProxy (the fake LB)
└── k3d-micro-cluster-server-0  ← 1 control-plane node (no workers!)
```

---

## Part 6: What is kind?

**kind** = **K**ubernetes **IN** **D**ocker

Kind runs **real, vanilla Kubernetes** (not k3s) inside Docker containers.
It uses **kubeadm** — the same tool used to set up production Kubernetes clusters.

```
kind = real Kubernetes + Docker containers as nodes

Your Mac
└── Docker Desktop
        ├── micro-cluster-control-plane  ← real Kubernetes control-plane
        ├── micro-cluster-worker         ← real Kubernetes worker
        ├── micro-cluster-worker2        ← real Kubernetes worker
        └── micro-cluster-worker3        ← real Kubernetes worker
```

No HAProxy container. No lightweight replacement. Just real Kubernetes in Docker.

### Your kind config (kind-cluster.yaml)

```yaml
nodes:
  - role: control-plane   # 1 control-plane node
  - role: worker          # 3 worker nodes
  - role: worker
  - role: worker
```

---

## Part 7: k3d vs kind — Side by Side

```
                    k3d                     kind
                    ─────────────────────   ─────────────────────
What runs inside    k3s (lightweight)       real Kubernetes
the containers?

Database            SQLite                  etcd (production-grade)

Bootstrap tool      custom k3s bootstrap    kubeadm (same as prod)

Default ingress     Traefik (built-in)      none (must install)

LB container        YES — HAProxy           NO — no LB container

Port mapping        on HAProxy container    on control-plane node

Similar to          Raspberry Pi clusters   AWS EKS, Azure AKS

Closer to prod?     Less                    More
```

### Why kind is closer to production

Production Kubernetes on AWS (EKS), Azure (AKS), Google (GKE):
- Uses **etcd** → kind also uses etcd ✓
- Uses **kubeadm** bootstrap → kind also uses kubeadm ✓
- No SQLite → kind has no SQLite ✓
- No Traefik auto-install → kind doesn't auto-install anything ✓

k3s/k3d makes compromises (SQLite, stripped APIs) that don't exist in production.
kind makes no such compromises — it's the real thing inside Docker.

---

## Part 8: What is the HAProxy "Fake Load Balancer" in k3d?

### What is a Load Balancer?

A load balancer sits in front of multiple servers and distributes incoming traffic across them.

```
Users
  │
  ▼
[Load Balancer]
  ├──→ Server 1
  ├──→ Server 2
  └──→ Server 3

If Server 1 dies → LB sends traffic to Server 2 and 3 only.
```

### What does k3d's HAProxy do?

k3d automatically creates an **HAProxy Docker container** as a load balancer in front of your k3s control-plane nodes.

```
Your Mac
└── Docker Desktop
        │
        ├── k3d-micro-cluster-serverlb (HAProxy)
        │   - listens on port 8100, 8543, 6443
        │   - forwards traffic to control-plane nodes
        │
        ├── k3d-micro-cluster-server-0  (control-plane node 1)
        ├── k3d-micro-cluster-server-1  (control-plane node 2)  ← only if servers: 3
        └── k3d-micro-cluster-server-2  (control-plane node 3)  ← only if servers: 3
```

### Why it's "fake" with servers: 1

```
servers: 1                    servers: 3
──────────────────────────    ──────────────────────────
HAProxy                       HAProxy
   │                             │
   └──→ server-0 (only one)      ├──→ server-0
                                 ├──→ server-1
                                 └──→ server-2

HAProxy has nothing             HAProxy actually
to balance between.             balances across 3 targets.

= Fake (passthrough)            = Real load balancing
```

With `servers: 1`, HAProxy is just a tunnel — traffic goes in, comes out on the other side unchanged. No balancing happens.

### Why kind has no HAProxy

kind doesn't create an HAProxy container because kind expects you to bring your own LB tool (like MetalLB or cloud-provider-kind). It doesn't make assumptions.

The port mappings in kind go directly on the control-plane node:
```yaml
nodes:
  - role: control-plane
    extraPortMappings:
      - containerPort: 80
        hostPort: 8100
```

---

## Part 9: What is High Availability (HA)?

### The Problem

With 1 control-plane node:
```
kubectl get pods ──→ [control-plane] ──→ answer

Control-plane dies:

kubectl get pods ──→ [DEAD] ──→ ERROR: connection refused

You cannot manage your cluster.
Your apps might still run but you are blind and powerless.
```

### The Solution — 3 Control-Plane Nodes

```
kubectl get pods ──→ [HAProxy] ──→ [control-plane-1]  (leader)
                                ├──→ [control-plane-2]  (backup)
                                └──→ [control-plane-3]  (backup)

control-plane-1 dies:

kubectl get pods ──→ [HAProxy] ──→ [control-plane-2]  (new leader)
                                └──→ [control-plane-3]  (backup)

Still works! Cluster is still manageable.
```

### Why 3 and not 2?

Because of **etcd quorum**. etcd is the database that stores all cluster state.
For a decision to be valid, **more than half** of nodes must agree.

```
2 nodes: need 2/2 to agree → if 1 dies → only 1/2 agree → no quorum → cluster freezes
3 nodes: need 2/3 to agree → if 1 dies → still 2/3 agree → quorum → cluster works
5 nodes: need 3/5 to agree → if 2 die → still 3/5 agree → quorum → cluster works
```

Always use **odd numbers**: 1, 3, 5.

### Your Current State

```
k3d cluster:   servers: 1  →  1 control-plane  →  NO HA
kind cluster:  1 control-plane node  →  NO HA

To fix k3d:    change servers: 1  →  servers: 3
To fix kind:   add 2 more  role: control-plane  nodes
```

---

## Part 10: What is Kong?

### The Problem Kong Solves

You have 5 services. Users send HTTP requests to them.

Without Kong:
```
User ──→ http://yoursite.com/orders     ──→ ??? which IP? which port?
User ──→ http://yoursite.com/payments   ──→ ??? which IP? which port?
User ──→ http://yoursite.com/inventory  ──→ ??? which IP? which port?
```

The user doesn't know your internal service IPs and ports.
You can't expose all services directly to the internet.

With Kong:
```
User ──→ http://yoursite.com/orders     ──→ [Kong] ──→ OrderService:5011
User ──→ http://yoursite.com/payments   ──→ [Kong] ──→ PaymentService:5012
User ──→ http://yoursite.com/inventory  ──→ [Kong] ──→ InventoryService:5013

One entry point. Kong routes to the right service.
```

Kong is an **API Gateway** and **Ingress Controller**.

### What Kong Does Beyond Routing

```
Request comes in:
     │
     ▼
[Kong]
  ├── Check JWT token (authentication)
  ├── Check rate limits (don't allow 10000 req/sec from one IP)
  ├── Add CORS headers (allow frontend at localhost:5008)
  ├── Log the request
  └── Forward to the right service
```

All these policies are configured in Kong, not in your services.
Your services just handle business logic.

### Kong vs HAProxy — They Are NOT the Same Thing

This is the most important distinction:

```
HAProxy (k3d's LB)                Kong
──────────────────────────────    ──────────────────────────────
Layer 4 (TCP)                     Layer 7 (HTTP)
Routes kubectl/API traffic        Routes your app's HTTP traffic
Target: control-plane nodes       Target: your service pods
Port: 6443                        Port: 80, 443
Purpose: cluster management HA    Purpose: API gateway for users
```

They work at completely different levels and never replace each other.

### The Full Picture — All Layers Together

```
Your Browser
     │
     │  HTTP request: GET /api/orders
     ▼
[k3d HAProxy Container]  ←── routes port 8100 to cluster
     │
     │  port 8100 → worker node port 80
     ▼
[Kong Ingress Controller Pod]  ←── runs inside a worker node
     │
     │  path /api/orders → OrderService
     ▼
[OrderService Pod]  ←── your actual app
     │
     └── returns response


Your kubectl command
     │
     │  kubectl get pods
     ▼
[k3d HAProxy Container]  ←── routes port 6443 to control-plane
     │
     ▼
[Control-Plane Node]  ←── the brain
     │
     └── returns list of pods
```

Two separate traffic paths. HAProxy handles both, but routes them to different destinations.

---

## Part 11: What is Traefik? Why Not Use It?

### What is Traefik?

Traefik is another API Gateway / Ingress Controller — a competitor to Kong.
k3s/k3d automatically installs Traefik by default.

### Why This Project Uses Kong Instead

1. Your `platform/config/gateway/kong.yml` already configures Kong for Docker Compose
2. Kong has more enterprise features (JWT, rate limiting, plugins)
3. Learning goal: Kong is more widely used in production
4. Traefik and Kong cannot both be the active ingress controller — one must be disabled

### The Problem — Two Ingress Controllers Conflict

```
Request: GET /api/orders

Traefik says: "I'll handle this → OrderService"
Kong says:    "I'll handle this → OrderService"

Both respond? Neither responds? Conflict.
```

Solution: **Disable Traefik when installing Kong.**
In k3d-cluster.yaml you add `--disable=traefik` to k3s args.

---

## Part 12: Ingress — How Kong Knows Where to Route

### What is an Ingress?

An Ingress is a Kubernetes configuration file that tells Kong (or any ingress controller):
"When a request comes in with this path, send it to this service."

```yaml
# platform/charts/apps/order-service/templates/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
spec:
  ingressClassName: kong          ← tell Kubernetes to use Kong (not Traefik)
  rules:
    - http:
        paths:
          - path: /api/orders
            backend:
              service:
                name: order-service
                port: 5011        ← send matching requests here
```

When you apply this file, Kong automatically picks it up and starts routing.

### ingressClassName — How Kong Identifies Its Rules

Multiple ingress controllers can run in one cluster.
`ingressClassName: kong` tells Kubernetes:
"This rule belongs to Kong, not Traefik, not nginx."

Kong only processes rules with `ingressClassName: kong`.

---

## Part 13: NodePort vs LoadBalancer — Why Kind Uses NodePort

### Types of Kubernetes Services

When you expose a service outside the cluster, you choose a type:

| Type | How it works | Needs |
|------|-------------|-------|
| **ClusterIP** | Only inside cluster, no external access | Nothing |
| **NodePort** | Opens a port on every node, accessible externally | Nothing |
| **LoadBalancer** | Creates a real cloud LB with external IP | Cloud provider or MetalLB |

### Why k3d Uses LoadBalancer

k3d has its HAProxy container. When you create a `LoadBalancer` service, k3d maps it to a port on HAProxy.

```
User → localhost:8100 → HAProxy → Kong pod (via LoadBalancer service)
```

### Why kind Uses NodePort

kind has no HAProxy container, no LB mechanism.
`LoadBalancer` services in kind get stuck in `<pending>` state forever — no one assigns them an IP.

So for kind, you use `NodePort`:
```
User → localhost:8100 → (mapped via extraPortMappings) → control-plane node → Kong pod
```

The `extraPortMappings` in `kind-cluster.yaml` is what connects `localhost:8100` to the node's port 80.

```yaml
extraPortMappings:
  - containerPort: 80   ← port inside the node container
    hostPort: 8100      ← port on your Mac
```

---

## Part 14: Your Current Setup — Complete Picture

### What exists now

```
platform/cluster/
├── k3d-cluster.yaml    ← creates k3d cluster (your primary dev cluster)
├── setup-k3d.sh        ← script to start k3d cluster
├── kind-cluster.yaml   ← creates kind cluster (more prod-like)
└── setup-kind.sh       ← script to start kind cluster
```

### k3d cluster — current state and gaps

```
k3d-cluster.yaml:
  servers: 1    ← 1 control-plane (no HA — single point of failure)
  agents:  0    ← 0 workers (all pods run on control-plane — bad practice)

Docker containers created:
  k3d-micro-cluster-serverlb   ← HAProxy (fake LB — only 1 target)
  k3d-micro-cluster-server-0   ← control-plane (also running app pods)

Gaps:
  ✗ No HA (1 control-plane)
  ✗ No real workers
  ✗ Kong not installed yet
  ✗ Traefik not disabled yet
```

### kind cluster — current state and gaps

```
kind-cluster.yaml:
  1 control-plane node
  3 worker nodes
  image: kindest/node:v1.32.2  ← pinned (v1.35.0 breaks on macOS)

Docker containers created:
  micro-cluster-control-plane  ← real Kubernetes control-plane
  micro-cluster-worker         ← worker node
  micro-cluster-worker2        ← worker node
  micro-cluster-worker3        ← worker node

Gaps:
  ✗ No HA (still 1 control-plane — needs 3 for HA)
  ✗ No MetalLB (LoadBalancer services stay <pending>)
  ✗ Kong not installed yet
```

---

## Part 15: The Fix — What Needs to Change

### To get HA on k3d

Change `k3d-cluster.yaml`:
```yaml
servers: 1   →   servers: 3
agents:  0   →   agents:  3   (add workers too)
```

Result:
```
HAProxy ──→ server-0  (leader)
        ├──→ server-1  (backup)
        └──→ server-2  (backup)
             +
        agent-0, agent-1, agent-2  (workers for app pods)
```

### To get Kong working on k3d

1. Disable Traefik in `k3d-cluster.yaml`
2. Recreate cluster
3. Install Kong via Helm

### To get HA on kind

Add 2 more control-plane nodes:
```yaml
nodes:
  - role: control-plane   ← 3 total for etcd quorum
  - role: control-plane
  - role: control-plane
  - role: worker
  - role: worker
  - role: worker
```

---

## Summary — All Concepts in One Table

| Concept | What it is | In your setup |
|---------|-----------|--------------|
| Kubernetes | Manages containers across multiple machines | Running via k3d and kind |
| Control-plane node | The brain — manages the cluster | 1 node (needs 3 for HA) |
| Worker node | Runs your app containers | 0 in k3d, 3 in kind |
| k3s | Lightweight Kubernetes (SQLite, stripped) | Used by k3d |
| k3d | Tool to run k3s inside Docker | `platform/cluster/k3d-cluster.yaml` |
| kind | Tool to run real Kubernetes inside Docker | `platform/cluster/kind-cluster.yaml` |
| HAProxy (k3d LB) | Routes port 8100/6443 → control-plane nodes | Created auto by k3d, fake (1 target) |
| etcd | Production Kubernetes database | Used by kind, not k3d |
| HA | 3+ control-planes so cluster survives node failure | Not yet (need 3 control-planes) |
| Kong | API Gateway — routes HTTP requests to your services | Not installed yet |
| Traefik | Default ingress in k3s/k3d (conflicts with Kong) | Must disable before Kong |
| Ingress | Config file that tells Kong: path X → service Y | Already written for OrderService |
| NodePort | Exposes service via a port on every node | Used in kind for Kong |
| LoadBalancer | Exposes service via cloud LB or HAProxy (k3d) | Used in k3d for Kong |

---

## What to Read Next

- **Installing Kong**: See `LEARNING_TASK_CHECKLIST.md` task 1.3
- **Pod Anti-Affinity**: See task 1.2 (needs multiple workers first)
- **Full infrastructure reference**: See `INFRASTRUCTURE_REFERENCE.md`
