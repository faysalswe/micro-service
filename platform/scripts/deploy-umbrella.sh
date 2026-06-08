#!/bin/bash
# Builds all images, pushes to local registry, and deploys everything via the umbrella Helm chart.
# Includes infra, observability, and all app services in one helm release.
# Run from the repo root: ./platform/scripts/deploy-umbrella.sh
set -e

# Load environment variables from root .env
if [ -f ".env" ]; then
  set -a && source .env && set +a
fi

REGISTRY="localhost:5001"
UMBRELLA_DIR="platform/charts/umbrella"
KUBE_CONTEXT="k3d-micro-cluster"
NAMESPACE="default"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

ALL_SERVICES=(
  order-service
  payment-service
  inventory-service
  identity-service
  cart-service
  pdf-service
  storefront
  back-office
)

build_image() {
  local service=$1
  case "${service}" in
    order-service)     docker build -f services/OrderService/Dockerfile     -t ${REGISTRY}/order-service:latest . ;;
    inventory-service) docker build -f services/InventoryService/Dockerfile -t ${REGISTRY}/inventory-service:latest . ;;
    payment-service)   docker build -f services/PaymentService/Dockerfile   -t ${REGISTRY}/payment-service:latest . ;;
    identity-service)  docker build -f services/IdentityService/Dockerfile  -t ${REGISTRY}/identity-service:latest . ;;
    cart-service)      docker build -f services/CartService/Dockerfile      -t ${REGISTRY}/cart-service:latest services/CartService ;;
    pdf-service)       docker build -f services/PdfService/Dockerfile       -t ${REGISTRY}/pdf-service:latest  services/PdfService ;;
    storefront)        docker build -f apps/storefront/Dockerfile           -t ${REGISTRY}/storefront:latest   apps/storefront ;;
    back-office)       docker build -f apps/back-office/Dockerfile          -t ${REGISTRY}/back-office:latest  apps/back-office ;;
    *) echo -e "${RED}Unknown service: ${service}"; exit 1 ;;
  esac
  echo -e "${GREEN}${service} built.${NC}"
}

echo -e "${BLUE}Switching to cluster context: ${KUBE_CONTEXT}${NC}"
kubectl config use-context "${KUBE_CONTEXT}"

# Build all images
echo -e "${BLUE}Building images...${NC}"
for service in "${ALL_SERVICES[@]}"; do
  build_image "${service}"
done

# Push all images
echo -e "${BLUE}Pushing images...${NC}"
for service in "${ALL_SERVICES[@]}"; do
  docker push ${REGISTRY}/${service}:latest
done
echo -e "${GREEN}Images pushed.${NC}"

# Secrets
echo -e "${BLUE}Creating Kubernetes secrets...${NC}"
./platform/scripts/create-secrets.sh

# Resolve infra sub-chart dependencies first (postgresql, mongodb from Bitnami)
echo -e "${BLUE}Updating infra chart dependencies...${NC}"
helm dependency update platform/charts/infra

# Sync umbrella sub-charts
echo -e "${BLUE}Updating umbrella chart dependencies...${NC}"
helm dependency update "${UMBRELLA_DIR}"

# Build --set flags: set registry for all services
HELM_FLAGS=""
for service in "${ALL_SERVICES[@]}"; do
  HELM_FLAGS+=" --set ${service}.image.registry=${REGISTRY}"
done

# Deploy everything
echo -e "${BLUE}Deploying via umbrella chart...${NC}"
helm upgrade --install microservices "${UMBRELLA_DIR}" \
  --namespace ${NAMESPACE} \
  --wait --timeout=10m \
  ${HELM_FLAGS}

echo -e "${GREEN}Done.${NC}"
echo -e "${BLUE}Check pods: kubectl get pods -n ${NAMESPACE}${NC}"
