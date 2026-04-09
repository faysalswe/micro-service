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

## 5. Local CD Pipeline Operations

The pipeline follows the **Build -> Tag -> Push -> Deploy** cycle:
1.  **Build**: Injects the Git SHA as `APP_VERSION`.
2.  **Tag**: Points the image to `localhost:5001`.
3.  **Push**: Transfers the binary to the local `micro-registry`.
4.  **Deploy**: Helm performs an idempotent `upgrade` to the cluster.
