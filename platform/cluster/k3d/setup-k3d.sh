#!/bin/bash
# Full k3d cluster setup: creates cluster, registry (with mirror), and installs Kong.
# Run from the repo root: ./platform/cluster/k3d/setup-k3d.sh
set -e

CLUSTER_NAME="micro-cluster"
CONFIG_FILE="platform/cluster/k3d/k3d-cluster.yaml"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# --- Prerequisites ---
echo -e "${BLUE}Checking prerequisites...${NC}"

if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}ERROR: Docker is not running.${NC}"; exit 1
fi
for cmd in k3d helm kubectl; do
    if ! command -v $cmd > /dev/null 2>&1; then
        echo -e "${RED}ERROR: $cmd is not installed. Run: brew install $cmd${NC}"; exit 1
    fi
done

# --- Delete existing cluster ---
if k3d cluster list 2>/dev/null | grep -q "${CLUSTER_NAME}"; then
    echo -e "${BLUE}Deleting existing cluster '${CLUSTER_NAME}'...${NC}"
    k3d cluster delete "${CLUSTER_NAME}"
fi

# --- Create cluster ---
# k3d-cluster.yaml creates the registry and configures the mirror inside each node
# so that localhost:5001 resolves correctly from within the cluster
echo -e "${BLUE}Creating k3d cluster '${CLUSTER_NAME}'...${NC}"
k3d cluster create --config "${CONFIG_FILE}"
kubectl config use-context "k3d-${CLUSTER_NAME}"
echo -e "${GREEN}Cluster ready.${NC}"

# --- Install MetalLB ---
# Added: replaces k3d's built-in HAProxy LB so both k3d and kind use the same approach
echo -e "${BLUE}Installing MetalLB...${NC}"
helm repo add metallb https://metallb.github.io/metallb 2>/dev/null || true
helm repo update
helm upgrade --install metallb metallb/metallb --namespace metallb-system --create-namespace

echo -e "${BLUE}Waiting for MetalLB to be ready...${NC}"
kubectl rollout status deployment/metallb-controller --namespace metallb-system --timeout=180s

# Detect k3d Docker network subnet and assign last 50 IPs to MetalLB
SUBNET=$(docker network inspect k3d-${CLUSTER_NAME} --format '{{(index .IPAM.Config 0).Subnet}}' | cut -d'.' -f1-3)
kubectl apply -f - <<EOF
apiVersion: metallb.io/v1beta1
kind: IPAddressPool
metadata:
  name: local-pool
  namespace: metallb-system
spec:
  addresses:
  - ${SUBNET}.200-${SUBNET}.250
---
apiVersion: metallb.io/v1beta1
kind: L2Advertisement
metadata:
  name: local-advert
  namespace: metallb-system
EOF
echo -e "${GREEN}MetalLB configured with pool ${SUBNET}.200-${SUBNET}.250${NC}"

# --- Deploy Kong ConfigMaps (rbac Lua plugin only — routing is via Ingress CRDs) ---
echo -e "${BLUE}Creating Kong ConfigMaps...${NC}"
kubectl create configmap kong-plugin-rbac \
    --from-file=handler.lua=platform/config/gateway/plugins/rbac/handler.lua \
    --from-file=schema.lua=platform/config/gateway/plugins/rbac/schema.lua \
    --dry-run=client -o yaml | kubectl apply -f -

# --- Install Kong CRDs (raw kubectl — not Helm-owned, so no ownership conflicts) ---
echo -e "${BLUE}Installing Kong CRDs...${NC}"
kubectl apply -f https://raw.githubusercontent.com/Kong/charts/main/charts/kong/crds/custom-resource-definitions.yaml

# --- Install Kong with Ingress Controller enabled ---
echo -e "${BLUE}Installing Kong (Ingress Controller mode)...${NC}"
helm repo add kong https://charts.konghq.com 2>/dev/null || true
helm repo update
helm upgrade --install kong kong/kong \
    --namespace default \
    -f platform/config/gateway/kong-k8s-values.yaml \
    --skip-crds \
    --wait --timeout=5m

echo -e "${BLUE}Waiting for Kong to be ready...${NC}"
kubectl rollout status deployment/kong-kong --namespace default --timeout=180s

# --- Deploy Kong config chart (KongPlugin, KongConsumer, JWT credentials) ---
# jwt-auth-public uses anonymous: public-anon (username form) declared in the chart.
echo -e "${BLUE}Deploying Kong config (plugins, consumers)...${NC}"
helm upgrade --install kong-config platform/charts/kong-config --namespace default

echo -e "${GREEN}Setup complete.${NC}"
echo -e "${BLUE}Next steps — choose one:${NC}"
echo -e "${BLUE}  All at once : ./platform/scripts/deploy-umbrella.sh${NC}"
echo -e "${BLUE}  Granular    : ./platform/scripts/deploy-infra.sh then ./platform/scripts/deploy-services.sh${NC}"
