# SRE & Observability Mastery Checklist

This document tracks your journey from local development to production-grade SRE. 
**Goal:** Implement independently and master the "Why" for technical interviews.

---

## 🛠 Tools to Master (Learning Goals)
Master these tools through the implementation of the tasks below.

| Tool | Focus Area | Primary Tasks |
| :--- | :--- | :--- |
| **kubectl** | Cluster Management | All Phases |
| **k3d / k3s** | Infrastructure Provisioning | 1.1, 4.1, 4.4 |
| **Helm** | Package & Lifecycle Management | 1.3, 2.1, 4.3 |
| **Kong** | API Gateway & Ingress | 1.3, 1.4 |
| **Jaeger** | Distributed Tracing | 3.1, 3.2, 5.3 |
| **Prometheus** | Metrics & PromQL | 5.1, 5.2 |
| **Loki** | Log Aggregation & LogQL | 3.2 |
| **ArgoCD** | GitOps & Continuous Delivery | 6.1 |
| **Cert-Manager** | Security & SSL Automation | 4.3 |
| **Azure AKS** | Managed Cloud Kubernetes | 6.2 |

---

## 📋 Part 1: High-Level Roadmap (The Overview)

### Phase 1: Local HA Foundations
- [x] **1.1 Multi-node k3d Cluster** (The Infrastructure)
- [ ] **1.2 Pod Anti-Affinity** (High Availability Scheduling)
- [~] **1.3 Kong Ingress Controller** (Traffic Management)
- [ ] **1.4 Basic Ingress Routing** (North-South Traffic)

### Phase 2: Persistence & State
- [ ] **2.1 Helm-based PostgreSQL** (Package Management & Workloads)
- [ ] **2.2 PV/PVC & Persistence Challenge** (Data Durability)

### Phase 3: Observability Baseline
- [ ] **3.1 Trace Gap Identification (Jaeger)** (Visualizing Latency)
- [ ] **3.2 TraceID Correlation (Loki)** (Connecting Traces to Logs)

### Phase 4: Remote "Production" (k3s)
- [x] **4.1 k3s VM Bootstrapping** (Bare Metal/VM Kubernetes)
- [~] **4.2 TLS-SAN & Remote Access** (Secure Cluster Management)
- [ ] **4.3 Cert-Manager & Let's Encrypt** (Automated Trust)
- [ ] **4.4 Multi-Node Expansion** (Scaling the Control Plane/Workers)

### Phase 5: Advanced Diagnostics & Optimization
- [ ] **5.1 Connection Pool Analysis (Prometheus)** (Identifying Saturation)
- [ ] **5.2 P99 Latency Mapping** (Performance Benchmarking)
- [ ] **5.3 The "Ghost Latency" Fix** (The Capstone Challenge)

### Phase 6: GitOps & Cloud Scale
- [ ] **6.1 ArgoCD & App-of-Apps** (Source of Truth Deployment)
- [ ] **6.2 Azure AKS & Key Vault** (Public Cloud SRE)

---

## 🧠 Part 2: Deep Dive & Mastery Details

### 1.1 Multi-node k3d Cluster
*   **The Action:** Create a cluster using `k3d cluster create --servers 1 --agents 3`.
*   **The Result:** A functioning 4-node Kubernetes environment on your local machine.
*   **The Mastery:** 
    *   *Understand:* The difference between the Control Plane (API Server, Scheduler, etcd) and Worker nodes (Kubelet, Container Runtime).
    *   *Interview Answer:* "I run multiple worker nodes so that if one fails, the Control Plane can automatically reschedule my applications onto the remaining healthy nodes, preventing downtime."

### 1.2 Pod Anti-Affinity
*   **The Action:** Modify the `OrderService` deployment to include `podAntiAffinity` with `topologyKey: "kubernetes.io/hostname"`.
*   **The Result:** Two replicas of the same service will never be scheduled on the same physical node.
*   **The Mastery:** 
    *   *Understand:* How the Scheduler evaluates affinity rules before placing a pod.
    *   *Interview Answer:* "Anti-affinity is a 'hard' or 'soft' constraint that ensures high availability. It prevents a single node failure from taking down all instances of a critical service."

### 1.3 Kong Ingress Controller
*   **The Action:** Use Helm to install the Kong Ingress Controller into a dedicated namespace.
*   **The Result:** A load balancer entry point that can receive and route traffic from outside the cluster.
*   **The Mastery:** 
    *   *Understand:* The role of an Ingress Controller as a reverse proxy and its interaction with the Kubernetes API.
    *   *Interview Answer:* "I use Kong as an API Gateway because it centralizes security, rate-limiting, and routing at the edge of the cluster, rather than managing these in every individual microservice."

### 1.4 Basic Ingress Routing
*   **The Action:** Create an `Ingress` resource mapping paths (e.g., `/orders`) to backend services.
*   **The Result:** Accessing `http://localhost/orders` successfully returns data from the `OrderService`.
*   **The Mastery:** 
    *   *Understand:* Host-based vs. Path-based routing and the concept of "North-South" traffic.
    *   *Interview Answer:* "Ingress resources define how external requests are mapped to internal ClusterIP services. This allows me to expose multiple services through a single public IP/Domain."

### 2.1 Helm-based PostgreSQL
*   **The Action:** Deploy a production-ready PostgreSQL instance using a certified Helm chart.
*   **The Result:** A database running in K8s with automated secret generation and configuration.
*   **The Mastery:** 
    *   *Understand:* How Helm templates simplify complex deployments and manage release versions.
    *   *Interview Answer:* "Helm is the package manager for Kubernetes. I use it to deploy stateful workloads because it packages the deployment, service, secrets, and storage requirements into a single, version-controlled unit."

### 2.2 Persistence Challenge
*   **The Action:** Insert data into the DB, force-delete the pod, and wait for K8s to restart it.
*   **The Result:** The new pod automatically re-mounts the same disk (PV) and the data is still there.
*   **The Mastery:** 
    *   *Understand:* The lifecycle of a Persistent Volume (PV) vs. a Persistent Volume Claim (PVC).
    *   *Interview Answer:* "In Kubernetes, pods are ephemeral. By using PVs and PVCs, I decouple the data from the container lifecycle, ensuring that database state survives even if the underlying pod or node is replaced."

### 3.1 Trace Gap Identification
*   **The Action:** Analyze a request in Jaeger and find a "gap" where no work is being done.
*   **The Result:** Identification of a specific service causing a 3-second delay.
*   **The Mastery:** 
    *   *Understand:* How OpenTelemetry spans are nested to show parent-child relationships in a request.
    *   *Interview Answer:* "Distributed tracing allowed me to find a 3-second 'white space' gap in a request chain. This proved the issue wasn't slow code, but a timeout waiting for a downstream service that wasn't responding."

### 3.2 TraceID Correlation
*   **The Action:** Copy a TraceID from Jaeger and use it to filter logs in Loki/Grafana.
*   **The Result:** A single view showing every log line from every service involved in that specific request.
*   **The Mastery:** 
    *   *Understand:* Why structured logging and TraceID injection are mandatory for microservice debugging.
    *   *Interview Answer:* "Correlation is the 'glue' of observability. By using a TraceID, I can instantly see the logs of five different services on one screen, allowing me to trace a bug's path across the entire system."

### 4.1 k3s VM Bootstrapping
*   **The Action:** Execute the k3s install script on a clean Linux VM and verify the systemd service.
*   **The Result:** A production-certified, lightweight Kubernetes cluster running on actual hardware/VMs.
*   **The Mastery:** 
    *   *Understand:* Why k3s is preferred for edge/small-scale production over "heavy" distributions like kubeadm.
    *   *Interview Answer:* "I chose k3s for the production pilot because it's a single 50MB binary that replaces bloated cloud providers with lightweight alternatives (like SQLite instead of etcd), making it much faster to maintain."

### 4.2 TLS-SAN & Remote Access
*   **The Action:** Update k3s configuration with the VM's Public IP and copy the kubeconfig locally.
*   **The Result:** Running `kubectl get nodes` from your laptop securely manages the remote VM cluster.
*   **The Mastery:** 
    *   *Understand:* How SSL certificates validate the identity of the API server to prevent man-in-the-middle attacks.
    *   *Interview Answer:* "To manage the cluster remotely, I added the Public IP to the TLS-SAN (Subject Alternative Name) list. This ensures the API server's certificate is valid for remote connections, allowing secure 'kubectl' access from my local machine."

### 4.3 Cert-Manager & Let's Encrypt
*   **The Action:** Install Cert-Manager and a ClusterIssuer to automatically request SSL certificates.
*   **The Result:** Your public URL shows a valid, trusted HTTPS connection in any browser.
*   **The Mastery:** 
    *   *Understand:* The ACME protocol and how automated certificate renewal prevents "expired certificate" outages.
    *   *Interview Answer:* "I automated SSL with Cert-Manager and Let's Encrypt to ensure our services are always encrypted. This eliminates the manual risk of certificate expiration, which is a common cause of production downtime."

### 4.4 Multi-Node Expansion
*   **The Action:** Generate a token on the master node and use it to join a second VM as a worker.
*   **The Result:** A truly distributed cluster spanning multiple physical or virtual hosts.
*   **The Mastery:** 
    *   *Understand:* How the Kubelet on the new node registers itself with the API server using the shared token.
    *   *Interview Answer:* "Expanding the cluster horizontally is as simple as joining new nodes using a secure token. This allows the system to scale its compute power as the application demand grows."

### 5.1 Connection Pool Analysis
*   **The Action:** Create a PromQL query to monitor `go_sql_stats_connections_wait` in Grafana.
*   **The Result:** A graph showing exactly when your app is "waiting" for a database connection.
*   **The Mastery:** 
    *   *Understand:* The concept of 'Saturation'—when a resource is not yet 'failed' but is too busy to respond.
    *   *Interview Answer:* "Average latency can be misleading. By monitoring connection pool saturation (wait time), I can predict a database bottleneck before it causes the application to crash under high load."

### 5.2 P99 Latency Mapping
*   **The Action:** Configure Grafana to show the 99th percentile (P99) of request durations.
*   **The Result:** Visibility into the worst user experiences that "averages" usually hide.
*   **The Mastery:** 
    *   *Understand:* Why P99 is the industry standard for SRE Service Level Objectives (SLOs).
    *   *Interview Answer:* "I prioritize P99 latency over averages because it represents the actual experience of our most frustrated users. An 'average' of 200ms is useless if 1% of our users are waiting 10 seconds for a page to load."

### 5.3 The "Ghost Latency" Fix
*   **The Action:** Use Jaeger, Prometheus, and Loki together to solve the 3s bottleneck found in Task 3.1.
*   **The Result:** A verified code or config change that removes the latency and stabilizes the P99 graph.
*   **The Mastery:** 
    *   *Understand:* The full debugging lifecycle: Detect (Prometheus) -> Trace (Jaeger) -> Diagnose (Loki) -> Fix.
    *   *Interview Answer:* "I solved a 'ghost latency' issue where requests spiked intermittently. By correlating Jaeger traces with Prometheus metrics, I found it was a specific downstream timeout and fixed it by adjusting the retry policy."

### 6.1 ArgoCD & App-of-Apps
*   **The Action:** Connect ArgoCD to your Git repo and define a root "App-of-Apps" manifest.
*   **Result:** The cluster automatically syncs to whatever is in your Git `main` branch.
*   **The Mastery:** 
    *   *Understand:* The 'Pull-based' GitOps model and the benefit of "Self-Healing" (drift detection).
    *   *Interview Answer:* "With ArgoCD, Git is our single source of truth. If someone manually changes a deployment in the cluster, ArgoCD detects the 'drift' and automatically reverts it to match the code in Git."

### 6.2 Azure AKS & Key Vault
*   **The Action:** Provision a managed AKS cluster and use a CSI driver to inject secrets from Azure Key Vault.
*   **The Result:** Your app reads sensitive keys as if they were local files, but they never touch the Git repo.
*   **The Mastery:** 
    *   *Understand:* The security difference between 'Base64 encoded' K8s secrets and 'Encrypted-at-rest' Key Vault secrets.
    *   *Interview Answer:* "I integrated Azure Key Vault with AKS to meet enterprise security standards. This ensures that sensitive credentials like database passwords are encrypted in a dedicated vault and never stored in plain text or Git."

---
*Last updated: Tuesday, April 21, 2026*
