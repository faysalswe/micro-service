#!/bin/bash
set -e

CLUSTER_NAME="kind-cluster"
CONFIG_FILE="platform/cluster/kind/kind-cluster.yaml"
REGISTRY_NAME="micro-registry"
REGISTRY_PORT="5001"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔍 Checking environment for kind cluster setup...${NC}"

if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

if ! command -v kind > /dev/null 2>&1; then
    echo -e "${RED}❌ kind is not installed. Please install it (brew install kind) and try again.${NC}"
    exit 1
fi

# Create local registry (mirrors k3d's built-in registry at localhost:5001)
if docker ps -a --format '{{.Names}}' | grep -q "^${REGISTRY_NAME}$"; then
    echo -e "${GREEN}✅ Registry '${REGISTRY_NAME}' already running.${NC}"
else
    echo -e "${BLUE}📦 Starting local image registry on port ${REGISTRY_PORT}...${NC}"
    docker run -d --restart=always -p "127.0.0.1:${REGISTRY_PORT}:5000" \
        --name "${REGISTRY_NAME}" registry:2
fi

# Create cluster
if kind get clusters 2>/dev/null | grep -q "^${CLUSTER_NAME}$"; then
    echo -e "${GREEN}✅ Cluster '${CLUSTER_NAME}' already exists.${NC}"
else
    echo -e "${BLUE}🚀 Creating kind cluster '${CLUSTER_NAME}' from config...${NC}"
    if [ ! -f "$CONFIG_FILE" ]; then
        echo -e "${RED}❌ Config file not found at $CONFIG_FILE${NC}"
        exit 1
    fi
    kind create cluster --config "$CONFIG_FILE"
    echo -e "${GREEN}✨ Cluster '${CLUSTER_NAME}' created successfully!${NC}"
fi

# Connect registry to cluster network so nodes can pull from it
if ! docker network inspect kind | grep -q "${REGISTRY_NAME}"; then
    docker network connect kind "${REGISTRY_NAME}" 2>/dev/null || true
fi

# Apply registry ConfigMap so containerd knows about the local mirror
kubectl apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: local-registry-hosting
  namespace: kube-public
data:
  localRegistryHosting.v1: |
    host: "localhost:${REGISTRY_PORT}"
    help: "https://kind.sigs.k8s.io/docs/user/local-registry/"
EOF

kubectl config use-context "kind-${CLUSTER_NAME}"

# --- Install MetalLB ---
# Added: gives kind real LoadBalancer support — removed NodePort workaround below
echo -e "${BLUE}Installing MetalLB...${NC}"
helm repo add metallb https://metallb.github.io/metallb 2>/dev/null || true
helm repo update
helm upgrade --install metallb metallb/metallb --namespace metallb-system --create-namespace

echo -e "${BLUE}Waiting for MetalLB to be ready...${NC}"
kubectl rollout status deployment/metallb-controller --namespace metallb-system --timeout=180s

# Detect kind Docker network subnet and assign last 50 IPs to MetalLB
SUBNET=$(docker network inspect kind --format '{{(index .IPAM.Config 0).Subnet}}' | cut -d'.' -f1-3)
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
# Added: now runs directly (was only a printed tip before) — same command as k3d, no NodePort flags needed
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
echo -e "${BLUE}Next steps — choose one:${NC}"
echo -e "${BLUE}  All at once : ./platform/scripts/deploy-umbrella.sh${NC}"
echo -e "${BLUE}  Granular    : ./platform/scripts/deploy-infra.sh then ./platform/scripts/deploy-services.sh${NC}"
