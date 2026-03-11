# Task 2 Execution Log: HA Production Deployment

This document tracks the step-by-step professional execution of Task 2, moving from local development to a multi-node Kubernetes cluster.

## Phase 1: Cluster & Ingress Setup
1.  **Tooling:** Installed `kind` and `helm` via Homebrew.
2.  **Cluster Creation:** Provisioned a 4-node cluster (1 control-plane, 3 workers) using `kind-cluster.yaml`.
    - *Purpose:* To test true High Availability by spreading pods across multiple "servers."
3.  **Ingress Gateway:** Installed **Kong Ingress Controller** via Helm in DB-less mode.
    - *Purpose:* Centralized entry point for all microservices at `http://localhost`.

## Phase 2: Infrastructure with Persistence
1.  **Chart Creation:** Developed `helm/infrastructure` to manage stateful dependencies.
2.  **Storage:** Configured **Persistent Volume Claims (PVC)** for PostgreSQL and MongoDB.
    - *Result:* Verified PVCs are `Bound` to local storage on the Kind nodes.
3.  **Image Optimization:** Pre-loaded Bitnami images into Kind nodes to bypass Docker Hub rate limits.

## Phase 3: OrderService Production-Grade Deployment
1.  **Dockerfile Refactoring:**
    - Switched to multi-stage build.
    - Implemented **Principle of Least Privilege** by creating a non-root `appuser` (UID 1001).
    - Added `grpc_health_probe` for professional Kubernetes readiness checks.
2.  **HA Configuration:**
    - Set `replicaCount: 2`.
    - Added **Pod Anti-Affinity** to ensure replicas never run on the same node.
3.  **Secrets Management:** Created `db-credentials` secret for secure database connection strings.
4.  **Successful Rollout:** Verified pods are `Running` and distributed across `worker`, `worker2`, and `worker3`.

## Phase 4: Current Status & Next Steps
- [x] Multi-node Cluster Live
- [x] Databases Live with PVCs
- [x] Application Live with HA
- [ ] **Canary Deployment (Pending):** Route 10% of traffic to OrderService V2.
- [ ] **Verification:** Run `k6` load tests to ensure zero-downtime during the shift.
