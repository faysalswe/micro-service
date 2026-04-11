# Technical Deep Dive: Cloud-Native Architecture & CD Simulation

This document provides a rigorous technical analysis of the DevOps infrastructure implemented in this project.

---

## 1. Cluster Orchestration: K3d & K3s

### The K3s Architecture
K3d runs **K3s** (a lightweight Kubernetes distribution) inside Docker containers. Unlike Kind, K3s is optimized for edge and local environments by removing legacy cloud drivers and using SQLite for the state store instead of Etcd.

### Networking & Port Mirroring (The macOS Solution)
*   **External Access**: We use port **5001** for the Docker Registry on your Mac to avoid conflicts with the macOS AirPlay Receiver (which uses port 5000).
*   **Internal Resolution**: Within the cluster, Kubernetes pulls from `k3d-micro-registry:5000`. K3d handles the bridge between your host's 5001 and the cluster's internal 5000.

---

## 2. Configuration Management: Helm

### The Rendering Pipeline
Helm operates as a pre-processor that merges three distinct layers into a single Kubernetes manifest:
1.  **The Schema (`Chart.yaml`)**: Defines API versioning and chart metadata.
2.  **The Default Configuration (`values.yaml`)**: Stores the key-value pairs used for variable interpolation.
3.  **The Template Layer (`templates/*.yaml`)**: Uses the Go `text/template` library to generate standard YAML manifests.

---

## 3. Symmetry & Standard Structure

Every service in this project uses the **"Core 3 Files"** pattern:
1.  **`deployment.yaml`**: Manages the application container logic (Image, Resources, Env).
2.  **`service.yaml`**: Manages the cluster-internal networking (Ports, Load Balancing).
3.  **`_helpers.tpl`**: Standardizes naming and labeling conventions across the architecture.

---

## 4. Resource Scheduling: Requests & Limits

Kubernetes uses the **Linux Cgroups** subsystem to manage resources:
*   **`requests` (Soft Limit)**: Used by the **Scheduler** to find a node with enough capacity.
*   **`limits` (Hard Limit)**: Used by the **Kubelet** to throttle or kill the container. 
    *   **CPU**: Throttled if limit exceeded.
    *   **Memory**: **OOMKilled** if limit exceeded.

---

## 6. Local CD Pipeline Operations

The pipeline follows the **Build -> Tag -> Push -> Deploy** cycle:
1.  **Build**: Injects the Git SHA as `APP_VERSION`.
2.  **Tag**: Points the image to `localhost:5001`.
3.  **Push**: Transfers the binary to the local `micro-registry`.
4.  **Deploy**: Helm performs an idempotent `upgrade` to the cluster.

---

## 7. Kubernetes Operations Cheat Sheet (`kubectl`)

As a DevOps Expert, `kubectl` is your primary tool for "Day 2 Operations." Here are the essential commands used in this project.

### A. The "Health Check" (Inspection)
*   **`kubectl get pods`**: Lists all running microservices.
*   **`kubectl get svc`**: Shows the internal IP addresses and ports of your services.
*   **`kubectl describe pod [name]`**: The most important command for debugging. It shows "Events" (e.g., why a pod is stuck in `Pending` or `CrashLoopBackOff`).

### B. The "Detective" (Troubleshooting)
*   **`kubectl logs -f [pod-name]`**: Streams the live logs of your app. Use this to see C# exceptions or Go panic messages.
*   **`kubectl logs [pod-name] --previous`**: See the logs of a container *before* it crashed.
*   **`kubectl exec -it [pod-name] -- sh`**: Opens a terminal **inside** the running container. Use this to verify environment variables or database connectivity.

### C. The "Traffic Bridge" (Port Forwarding)
*   **`kubectl port-forward svc/identity-service 8002:80`**: Maps port 8002 on your Mac to the internal Kubernetes service. **Note**: We use 8002 because 8000 (Local Kong) and 8100 (k3d Kong) are already reserved. Essential for running `k6` load tests before the Gateway is fully ready.
*   **`kubectl port-forward svc/identity-service 8000:80`**: Maps port 8000 on your Mac to the internal Kubernetes service. Essential for running `k6` load tests before the Gateway is fully ready.

### D. The "Orchestrator" (Management)
*   **`kubectl delete pod [name]`**: Kills a pod. Kubernetes will immediately notice and start a brand-new one.
*   **`kubectl scale deployment/[name] --replicas=3`**: Instantly scales your microservice to 3 instances for high-availability testing.
*   **`kubectl rollout restart deployment/[name]`**: Forces a clean restart of all instances of a service.

### E. The "Janitor" (Cleanup)
*   **`k3d cluster delete micro-cluster`**: Completely removes the cluster and all containers from your Docker engine.
*   **`docker exec -it k3d-micro-cluster-server-0 crictl rmi --prune`**: Cleans up unused Docker images *inside* the Kubernetes node to save disk space.

