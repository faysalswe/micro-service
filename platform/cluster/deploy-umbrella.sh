#!/bin/bash
# Builds images, pushes to local registry, and deploys all services via the umbrella Helm chart.
# Supports selecting specific services — unselected services are disabled in the release.
# Run from the repo root: ./platform/cluster/deploy-umbrella.sh
set -e

# Load environment variables from root .env
if [ -f ".env" ]; then
  set -a && source .env && set +a
fi

REGISTRY="localhost:5001"
UMBRELLA_DIR="platform/charts/shared/microservices-umbrella"
KUBE_CONTEXT="k3d-micro-cluster"
NAMESPACE="default"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
BOLD='\033[1m'
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

# ---------------------------------------------------------------------------
# Interactive multi-select checkbox
# Controls: u/d to move, space to toggle, a select all, c clear all, enter confirm, q quit
# ---------------------------------------------------------------------------
select_services() {
  local count=${#ALL_SERVICES[@]}
  local current=0
  local checks=()
  for i in "${!ALL_SERVICES[@]}"; do checks[$i]=0; done

  draw_menu() {
    clear
    echo -e "\n${BLUE}Select services to deploy (infrastructure always included):${NC}\n"
    for i in "${!ALL_SERVICES[@]}"; do
      local mark="[ ]"
      [ "${checks[$i]}" -eq 1 ] && mark="${GREEN}[x]${NC}"
      if [ "$i" -eq "$current" ]; then
        echo -e "  \033[7m ${mark} ${ALL_SERVICES[$i]} \033[0m"
      else
        echo -e "   ${mark} ${ALL_SERVICES[$i]}"
      fi
    done
    echo ""
    echo -e "  ${BOLD}u/d${NC} move  ${BOLD}space${NC} toggle  ${BOLD}a${NC} all  ${BOLD}c${NC} clear  ${BOLD}enter${NC} confirm  ${BOLD}q${NC} quit"
  }

  tput civis
  draw_menu

  while true; do
    local key
    IFS= read -rsn1 key

    case "$key" in
      u) [ "$current" -gt 0 ] && current=$(( current - 1 )) ;;
      d) [ "$current" -lt $(( count - 1 )) ] && current=$(( current + 1 )) ;;
      ' ')
        if [ "${checks[$current]}" -eq 1 ]; then
          checks[$current]=0
        else
          checks[$current]=1
        fi
        ;;
      a) for i in "${!checks[@]}"; do checks[$i]=1; done ;;
      c) for i in "${!checks[@]}"; do checks[$i]=0; done ;;
      $'\n'|$'\r'|'')
        tput cnorm
        clear
        break
        ;;
      q)
        tput cnorm
        clear
        echo -e "${RED}Aborted.${NC}"
        exit 0
        ;;
    esac

    draw_menu
  done

  SELECTED_SERVICES=()
  for i in "${!ALL_SERVICES[@]}"; do
    [ "${checks[$i]}" -eq 1 ] && SELECTED_SERVICES+=("${ALL_SERVICES[$i]}")
  done
}

# ---------------------------------------------------------------------------
# Build helpers
# ---------------------------------------------------------------------------
build_image() {
  local service=$1
  case "${service}" in
    order-service)     docker build -f services/OrderService/Dockerfile    -t ${REGISTRY}/order-service:latest . ;;
    inventory-service) docker build -f services/InventoryService/Dockerfile -t ${REGISTRY}/inventory-service:latest . ;;
    payment-service)   docker build -f services/PaymentService/Dockerfile  -t ${REGISTRY}/payment-service:latest . ;;
    identity-service)  docker build -f services/IdentityService/Dockerfile -t ${REGISTRY}/identity-service:latest . ;;
    cart-service)      docker build -f services/CartService/Dockerfile     -t ${REGISTRY}/cart-service:latest services/CartService ;;
    pdf-service)       docker build -f services/PdfService/Dockerfile      -t ${REGISTRY}/pdf-service:latest  services/PdfService ;;
    storefront)        docker build -f apps/storefront/Dockerfile          -t ${REGISTRY}/storefront:latest   apps/storefront ;;
    back-office)       docker build -f apps/back-office/Dockerfile         -t ${REGISTRY}/back-office:latest  apps/back-office ;;
    *) echo -e "${RED}Unknown service: ${service}${NC}"; exit 1 ;;
  esac
  echo -e "${GREEN}${service} built.${NC}"
}

is_selected() {
  local target=$1
  for s in "${SELECTED_SERVICES[@]}"; do
    [ "$s" = "$target" ] && return 0
  done
  return 1
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
echo -e "${BLUE}Switching to cluster context: ${KUBE_CONTEXT}${NC}"
kubectl config use-context "${KUBE_CONTEXT}"

select_services

if [ ${#SELECTED_SERVICES[@]} -eq 0 ]; then
  echo -e "${RED}No services selected. Exiting.${NC}"
  exit 0
fi

echo -e "${BLUE}Selected: ${SELECTED_SERVICES[*]}${NC}\n"

# Build and push selected images
echo -e "${BLUE}Building images...${NC}"
for service in "${SELECTED_SERVICES[@]}"; do
  build_image "${service}"
done

echo -e "${BLUE}Pushing images...${NC}"
for service in "${SELECTED_SERVICES[@]}"; do
  docker push ${REGISTRY}/${service}:latest
done
echo -e "${GREEN}Images pushed.${NC}"

# Secrets (always required)
echo -e "${BLUE}Creating Kubernetes secrets...${NC}"
./platform/cluster/create-secrets.sh

# Sync umbrella sub-charts
echo -e "${BLUE}Updating umbrella chart dependencies...${NC}"
helm dependency update "${UMBRELLA_DIR}"

# Build --set flags: disable services not selected, set registry for selected ones
HELM_FLAGS="--set infrastructure.kong.cors.origins={${KONG_CORS_ORIGINS}}"

for service in "${ALL_SERVICES[@]}"; do
  if is_selected "${service}"; then
    HELM_FLAGS+=" --set ${service}.image.registry=${REGISTRY}"
  else
    HELM_FLAGS+=" --set ${service}.enabled=false"
  fi
done

# Deploy umbrella
echo -e "${BLUE}Deploying via umbrella chart...${NC}"
helm upgrade --install microservices "${UMBRELLA_DIR}" \
  --namespace ${NAMESPACE} \
  --wait --timeout=5m \
  ${HELM_FLAGS}

echo -e "${GREEN}Done.${NC}"
echo -e "${BLUE}Check pods: kubectl get pods -n ${NAMESPACE}${NC}"
