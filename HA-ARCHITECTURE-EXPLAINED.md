# High Availability (HA) Architecture: Task 2 Explained

This document explains the three critical pillars of Task 2, moving from a simple developer setup to an industry-standard production environment.

## Step 1: The Infrastructure (Kind & Docker Runtime)

### Why we need a Kind Cluster?
In a standard local setup (like Docker Compose), everything runs on one "server." If that server fails, your whole system dies.
- **Kind (Kubernetes in Docker)** allows us to create **Multi-Node** environments on a single Mac.
- We created a **4-node cluster** (1 Control Plane, 3 Workers). 
- *Why:* This allows us to test **High Availability**. We can now simulate a real data center where different pods run on different "physical" machines.

### Why we need a Production Docker Runtime?
Standard Dockerfiles run as `root`. In production, this is a major security risk.
- **Security Hardening:** We refactored the Dockerfile to use a numeric non-root user (**UID 1001**).
- **Compliance:** Kubernetes `runAsNonRoot` policy requires this.
- **Stability:** We included `libgssapi-krb5-2` so the application can communicate with PostgreSQL using modern authentication standards.

## Step 2: The Blueprint (Helm Charts, Templates, and Values)

Helm is the "Package Manager" for Kubernetes. It separates **What** we deploy from **How** it is configured.

1.  **`templates/` (The Logic):** These are YAML blueprints. For example, `deployment.yaml` defines that we need a "Web Server," but it doesn't hardcode the image name or port.
2.  **`values.yaml` (The Config):** This is the user-facing settings file. You can change the `replicaCount` or `image.tag` here without touching the complex templates.
3.  **The Full Umbrella:** We used an **Infrastructure Chart** to manage databases (PostgreSQL/MongoDB) and an **Application Chart** for our code. This modularity is how professional teams manage thousands of services.

## Step 3: The HA Process (Persistence & Anti-Affinity)

How do we ensure the system *never* goes down?

### 1. Data Persistence (PVC)
- **Problem:** If a database pod restarts, its data is deleted.
- **Solution:** We implemented **Persistent Volume Claims (PVC)**. These tell Kubernetes: *"I need 1GB of disk space that exists outside the pod."*
- **Result:** Even if we delete the PostgreSQL pod, the data survives on the Kind node's disk.

### 2. Service HA (Anti-Affinity)
- **Problem:** If we have 2 replicas, Kubernetes might put them both on the same node to save space. If that node fails, both replicas die.
- **Solution:** We added **Pod Anti-Affinity** to the Helm chart.
- **Result:** Kubernetes is **forbidden** from putting two `OrderService` pods on the same worker node. They are forced to spread out, ensuring 100% uptime even if a worker node crashes.

### 3. Traffic Gateway (Kong)
- We used **Kong** as an Ingress Controller. It acts as the "Traffic Police," dynamically discovering where our pods are living across the 3 workers and routing users to the healthy ones.
