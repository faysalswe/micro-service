#!/bin/bash
# Full k3d cluster setup: creates cluster, registry (with mirror), and installs Kong.
# Run from the repo root: ./platform/cluster/setup-k3d.sh
set -e

CLUSTER_NAME="micro-cluster"
CONFIG_FILE="platform/cluster/k3d-cluster.yaml"

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

# --- Install Kong ---
echo -e "${BLUE}Installing Kong ingress controller...${NC}"
helm repo add kong https://charts.konghq.com 2>/dev/null || true
helm repo update
helm upgrade --install kong kong/ingress \
    --namespace kong \
    --create-namespace \
    --set controller.ingressClass=kong \
    --wait --timeout=3m

echo -e "${BLUE}Waiting for Kong to be ready...${NC}"
kubectl wait --namespace kong --for=condition=ready pod --selector=app=kong-controller --timeout=180s
kubectl wait --namespace kong --for=condition=ready pod --selector=app=kong-gateway --timeout=180s

echo -e "${GREEN}Setup complete.${NC}"
echo -e "${BLUE}Next step: run ./platform/cluster/deploy-services.sh${NC}"
