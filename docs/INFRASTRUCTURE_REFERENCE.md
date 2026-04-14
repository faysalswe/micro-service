# Infrastructure & Operations Reference

This document centralizes the technical architecture, deployment patterns, and operational commands for the microservices platform.

---

## 1. Local Kubernetes Environment (k3d/k3s)

We use **k3d** to run **k3s** (a lightweight Kubernetes distribution) inside Docker.

### Comparison of Local K8s Tools
| Option | Best For | Description | Selection Rationale |
| :--- | :--- | :--- | :--- |
| **k3d (k3s)** | **Multi-Node Testing** | Runs k3s inside Docker containers. | **Realism.** Best for multi-node, LoadBalancers, and mimicking production. |
| **OrbStack** | **macOS Performance** | Lightweight Docker Desktop alternative. | **Speed.** Lowest overhead on macOS. |
| **Kind** | **CI/CD Pipelines** | "Kubernetes in Docker" nodes as containers. | **Consistency.** Ideal for automated pipelines. |
| **Docker Desktop** | **Simplicity** | Integrated single-node K8s. | **Ease of Use.** Basic single-node setup. |

### Network Configuration
*   **External Access**: Registry uses port **5001** to avoid conflicts with macOS AirPlay (port 5000).
*   **Internal Resolution**: Cluster pulls from `k3d-micro-registry:5000`.

---

## 2. Deployment Patterns (Helm & K8s)

### Standard Service Structure ("Core 3 Files")
Every microservice follows this Helm pattern:
1.  **`deployment.yaml`**: App logic (Image, Resources, Env).
2.  **`service.yaml`**: Internal networking and load balancing.
3.  **`_helpers.tpl`**: Standardized naming and labeling.

### Resource Scheduling
*   **`requests` (Soft Limit)**: Used by the **Scheduler** to place pods on nodes.
*   **`limits` (Hard Limit)**: Used by the **Kubelet** to throttle CPU or OOMKill memory-exceeding pods.

### CD Operations Cycle
1.  **Build**: Injects Git SHA as `APP_VERSION`.
2.  **Tag/Push**: Targets the local registry at `localhost:5001`.
3.  **Deploy**: Idempotent `helm upgrade` to the cluster.

---

## 3. Operations Cheat Sheet (`kubectl`)

### Inspection & Health
*   `kubectl get pods`: List running services.
*   `kubectl get svc`: View internal IPs and ports.
*   `kubectl describe pod [name]`: View events and debug "Pending" or "CrashLoopBackOff".

### Troubleshooting
*   `kubectl logs -f [pod-name]`: Stream live logs.
*   `kubectl logs [pod-name] --previous`: View logs from the last crash.
*   `kubectl exec -it [pod-name] -- sh`: Open a terminal inside the container.

### Traffic & Scaling
### Cleanup
*   `k3d cluster delete micro-cluster`: Remove the entire environment.
*   `docker exec -it k3d-micro-cluster-server-0 crictl rmi --prune`: Clean internal node images.

