#!/bin/bash
# Builds images, pushes to local registry, and deploys app services via Helm.
# Requires infra and observability to already be running (deploy-infra.sh).
# Run from the repo root: ./platform/scripts/deploy-services.sh
set -e

# Load environment variables from root .env
if [ -f ".env" ]; then
  set -a && source .env && set +a
fi

REGISTRY="localhost:5001"
CHARTS_DIR="platform/charts/apps"
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
    echo -e "\n${BLUE}Select services to deploy:${NC}\n"
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
      u)
        [ "$current" -gt 0 ] && current=$(( current - 1 ))
        ;;
      d)
        [ "$current" -lt $(( count - 1 )) ] && current=$(( current + 1 ))
        ;;
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
    if [ "${checks[$i]}" -eq 1 ]; then
      SELECTED_SERVICES+=("${ALL_SERVICES[$i]}")
    fi
  done
}

# ---------------------------------------------------------------------------
# Build and deploy helpers
# ---------------------------------------------------------------------------
build_image() {
  local service=$1
  case "${service}" in
    order-service)
      docker build -f services/OrderService/Dockerfile     -t ${REGISTRY}/order-service:latest .
      ;;
    inventory-service)
      docker build -f services/InventoryService/Dockerfile -t ${REGISTRY}/inventory-service:latest .
      ;;
    payment-service)
      docker build -f services/PaymentService/Dockerfile   -t ${REGISTRY}/payment-service:latest .
      ;;
    identity-service)
      docker build -f services/IdentityService/Dockerfile  -t ${REGISTRY}/identity-service:latest .
      ;;
    cart-service)
      docker build -f services/CartService/Dockerfile      -t ${REGISTRY}/cart-service:latest services/CartService
      ;;
    pdf-service)
      docker build -f services/PdfService/Dockerfile       -t ${REGISTRY}/pdf-service:latest  services/PdfService
      ;;
    storefront)
      docker build -f apps/storefront/Dockerfile           -t ${REGISTRY}/storefront:latest   apps/storefront
      ;;
    back-office)
      docker build -f apps/back-office/Dockerfile          -t ${REGISTRY}/back-office:latest  apps/back-office
      ;;
    *)
      echo -e "${RED}Unknown service: ${service}${NC}"
      exit 1
      ;;
  esac
  echo -e "${GREEN}${service} built.${NC}"
}

deploy_service() {
  local service=$1
  if helm status ${service} --namespace ${NAMESPACE} > /dev/null 2>&1; then
    echo -e "${BLUE}Upgrading ${service}...${NC}"
    helm upgrade ${service} ${CHARTS_DIR}/${service} \
      --namespace ${NAMESPACE} \
      --set image.registry=${REGISTRY}
  else
    echo -e "${BLUE}Installing ${service}...${NC}"
    helm install ${service} ${CHARTS_DIR}/${service} \
      --namespace ${NAMESPACE} \
      --set image.registry=${REGISTRY}
  fi
  echo -e "${GREEN}${service} deployed.${NC}"
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

# Build
echo -e "${BLUE}Building images...${NC}"
for service in "${SELECTED_SERVICES[@]}"; do
  build_image "${service}"
done

# Push
echo -e "${BLUE}Pushing images...${NC}"
for service in "${SELECTED_SERVICES[@]}"; do
  docker push ${REGISTRY}/${service}:latest
done
echo -e "${GREEN}Images pushed.${NC}"

# Deploy
echo -e "${BLUE}Deploying services...${NC}"
for service in "${SELECTED_SERVICES[@]}"; do
  deploy_service "${service}"
done

echo -e "${GREEN}Done.${NC}"
echo -e "${BLUE}Check pods: kubectl get pods -n ${NAMESPACE}${NC}"
