# Docker & k3d Networking Deep Dive

## The Real Picture — How Your Mac Talks to a Pod

```
Your Browser (localhost:8100)
        │
        │  TCP connection
        ▼
┌─────────────────────────────────────────────┐
│  Your Mac (macOS)                           │
│  Network interface: en0 (192.168.1.x)       │
│  Loopback:          lo0 (127.0.0.1)         │
└──────────────┬──────────────────────────────┘
               │  Docker Desktop creates a virtual
               │  network bridge on your Mac
               ▼
┌─────────────────────────────────────────────┐
│  Docker Desktop VM (Linux VM inside macOS)  │
│  Runs all Docker containers                 │
│                                             │
│  Bridge: docker0  (172.17.0.1/16)          │
│  Bridge: k3d-micro-cluster (172.20.0.1/16) │ ← k3d creates this
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  k3d Node Containers (Docker containers)    │
│                                             │
│  k3d-micro-cluster-server-0  172.20.0.2    │
│  k3d-micro-cluster-server-1  172.20.0.3    │
│  k3d-micro-cluster-server-2  172.20.0.4    │
│  k3d-micro-cluster-agent-0   172.20.0.5    │
│  k3d-micro-cluster-agent-1   172.20.0.6    │
│  k3d-micro-cluster-agent-2   172.20.0.7    │
│  k3d-micro-cluster-serverlb  172.20.0.100  │ ← k3d's built-in LB
│                                             │
│  MetalLB assigns: 172.20.0.200 → Kong svc  │
└─────────────────────────────────────────────┘
```

---

## Why 172.x.x.x?

IP addresses are divided into public and private ranges. Private ranges are reserved for internal networks and never routed on the public internet:

| Range | CIDR | Use |
|---|---|---|
| `10.0.0.0` – `10.255.255.255` | 10.0.0.0/8 | Large private networks |
| `172.16.0.0` – `172.31.255.255` | 172.16.0.0/12 | Medium private networks |
| `192.168.0.0` – `192.168.255.255` | 192.168.0.0/16 | Home/small networks |

Docker uses `172.16.0.0/12` by default for its bridge networks. Every time Docker creates a network it picks an available subnet from this range:

```
First Docker network:   172.17.0.0/16  (docker0 default bridge)
Second Docker network:  172.18.0.0/16
Third Docker network:   172.19.0.0/16
k3d cluster network:    172.20.0.0/16  (auto-assigned)
```

Your Mac's home network uses `192.168.x.x` — a completely different private range. They don't conflict.

---

## CIDR Notation — What Does /16 Mean?

`172.20.0.0/16` means:
- **First 16 bits are fixed**: `172.20` — this is the network address
- **Last 16 bits are free**: `0.0` to `255.255` — these are host addresses

```
172.20.0.0/16
│    │  │  │
│    │  └──┴── Last 16 bits: host addresses (0.0 → 255.255 = 65,534 hosts)
└────┴──────── First 16 bits: network prefix (fixed = 172.20)
```

So within `172.20.0.0/16`, valid addresses are:
- `172.20.0.1` through `172.20.255.254`
- That's **65,534** possible addresses

---

## Why MetalLB Needs an IP Range

When you install MetalLB you give it a pool of IPs to assign:

```yaml
spec:
  addresses:
  - 172.20.0.200-172.20.0.250   # 51 IPs available for LoadBalancer services
```

**Why this specific range?**
The setup script detects the k3d Docker network subnet at runtime:

```bash
SUBNET=$(docker network inspect k3d-${CLUSTER_NAME} \
  --format '{{(index .IPAM.Config 0).Subnet}}' | cut -d'.' -f1-3)
# SUBNET = "172.20.0"

# Then assigns last 50 IPs of that subnet to MetalLB
addresses: ${SUBNET}.200-${SUBNET}.250
# Result: 172.20.0.200-172.20.0.250
```

**Why the last 50 IPs?**
- `172.20.0.1` – `172.20.0.199` are used by k3d nodes, registry, and internal services
- `172.20.0.200` – `172.20.0.250` are reserved for MetalLB to hand out to `LoadBalancer` services
- This avoids IP conflicts between k3d-managed containers and MetalLB-managed services

**What MetalLB does with the pool:**
```
helm install kong ...       → Kong service requests LoadBalancer IP
MetalLB assigns: 172.20.0.200 → Kong
                                        
helm install prometheus ... → Prometheus requests LoadBalancer IP  
MetalLB assigns: 172.20.0.201 → Prometheus
```

---

## How Your Mac Connects to 172.20.0.x

Your Mac cannot directly reach `172.20.0.200` — that IP lives inside Docker Desktop's Linux VM.

k3d solves this with port mapping in `k3d-cluster.yaml`:

```yaml
ports:
  - port: 8100:80      # Mac localhost:8100 → cluster port 80
    nodeFilters:
      - loadbalancer   # via k3d's built-in loadbalancer container
```

The full path:

```
Browser → localhost:8100
              │
              │ Docker Desktop port mapping
              ▼
         k3d-serverlb container (172.20.0.100)
              │
              │ forwards to MetalLB IP
              ▼
         MetalLB 172.20.0.200 → Kong service
              │
              │ Kong routes by path
              ▼
         order-service pod / storefront pod / etc.
```

So there are two layers of routing:
1. **Mac → Docker**: `localhost:8100` → k3d's serverlb via Docker port mapping
2. **Inside Docker**: serverlb → MetalLB IP → Kong → pods

---

## Two Clusters — Same or Different Network?

When you run both k3d and kind clusters simultaneously, each gets its own Docker network with its own subnet:

```
k3d cluster:  172.20.0.0/16   (k3d-micro-cluster network)
kind cluster: 172.21.0.0/16   (kind network)
```

Docker auto-assigns the next available subnet so they **don't conflict**.

**But they CAN conflict** if:
- You delete and recreate clusters — Docker may reuse subnets
- You have many Docker networks and Docker cycles through its range
- You manually assign the same subnet to both

**Why does this matter?**

```
Cluster A: MetalLB pool 172.20.0.200-250
Cluster B: MetalLB pool 172.21.0.200-250

Kong in cluster A: 172.20.0.200
Kong in cluster B: 172.21.0.200
```

They're on different networks so they can coexist. Each cluster's pods can only see IPs in their own Docker network.

**What if two clusters share a subnet?** (conflict scenario)

```
Cluster A: 172.20.0.0/16  → MetalLB assigns 172.20.0.200 to Kong A
Cluster B: 172.20.0.0/16  → MetalLB tries to assign 172.20.0.200 to Kong B
```

Both MetalLB instances would announce the same IP via L2 — causing routing chaos. Packets destined for `172.20.0.200` would go to whichever cluster responded last. This is why the setup script **detects the subnet dynamically** instead of hardcoding it.

---

## Pod-to-Pod Networking Inside the Cluster

Inside k8s, every pod gets its own IP from the **Pod CIDR** — a completely separate range from the Docker network:

```
Docker network (node IPs):  172.20.0.0/16
Pod network (pod IPs):      10.42.0.0/16   ← k3s default (flannel CNI)
Service network (ClusterIP): 10.43.0.0/16  ← k3s default
```

Three separate IP spaces:

| Layer | IP Range | Who uses it |
|---|---|---|
| Docker bridge | `172.20.0.x` | k3d node containers, MetalLB IPs |
| Pod CIDR | `10.42.x.x` | Individual pods |
| Service CIDR | `10.43.x.x` | ClusterIP services (k8s DNS) |

When `order-service` calls `identity-service:5010` via k8s DNS:
```
order-service pod (10.42.1.5)
    │
    │ DNS lookup: identity-service → 10.43.0.25 (ClusterIP)
    ▼
kube-proxy rewrites to pod IP: 10.42.2.8
    │
    ▼
identity-service pod (10.42.2.8)
```

The `172.20.x.x` Docker IPs are never involved in pod-to-pod communication — that all happens in the `10.42.x.x` / `10.43.x.x` space.

---

## Complete Traffic Flow — Browser to Pod

```
1. You type: http://localhost:8100/api/orders

2. Mac OS resolves localhost → 127.0.0.1

3. Docker Desktop intercepts port 8100
   → routes to k3d-serverlb container (172.20.0.100)
   (configured by: ports: 8100:80 in k3d-cluster.yaml)

4. k3d-serverlb forwards to Kong's MetalLB IP
   → 172.20.0.200:80

5. Kong (pod IP: 10.42.3.12) receives request
   → matches Ingress rule: path /api/orders
   → routes to order-service ClusterIP: 10.43.0.45

6. kube-proxy rewrites ClusterIP to pod IP
   → order-service pod: 10.42.1.8:5011

7. order-service handles request, returns response

8. Response travels back through same path
   → pod → kube-proxy → Kong → MetalLB → serverlb → Docker → localhost:8100 → browser
```

---

## Summary

| Concept | Value in your setup | Why |
|---|---|---|
| Docker network | `172.20.0.0/16` | Auto-assigned by Docker |
| k3d nodes | `172.20.0.2` – `172.20.0.7` | Assigned by Docker DHCP |
| MetalLB pool | `172.20.0.200` – `172.20.0.250` | Last 50 IPs, away from nodes |
| Kong external IP | `172.20.0.200` | First IP MetalLB assigns |
| Pod network | `10.42.0.0/16` | k3s flannel CNI default |
| Service network | `10.43.0.0/16` | k3s default |
| Mac access | `localhost:8100` | k3d port mapping bridges Mac → Docker |
