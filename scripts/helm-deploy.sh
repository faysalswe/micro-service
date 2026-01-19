#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ENVIRONMENT=${1:-dev}

echo -e "${GREEN}=== Deploying via Helm (Environment: $ENVIRONMENT) ===${NC}"

# Check prerequisites
command -v helm >/dev/null 2>&1 || { echo -e "${RED}helm required but not installed. Aborting.${NC}"; exit 1; }
command -v kubectl >/dev/null 2>&1 || { echo -e "${RED}kubectl required but not installed. Aborting.${NC}"; exit 1; }

# Navigate to project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
cd "$PROJECT_ROOT"

# Create namespace if it doesn't exist
echo -e "${YELLOW}Ensuring namespace exists...${NC}"
kubectl create namespace microservices --dry-run=client -o yaml | kubectl apply -f -

# Create secrets if they don't exist
echo -e "${YELLOW}Ensuring secrets exist...${NC}"

kubectl get secret db-credentials -n microservices >/dev/null 2>&1 || \
kubectl create secret generic db-credentials \
  --from-literal=POSTGRES_USER=admin \
  --from-literal=POSTGRES_PASSWORD=password123 \
  --from-literal=POSTGRES_DB=orders_db \
  --from-literal=MONGO_INITDB_ROOT_USERNAME=admin \
  --from-literal=MONGO_INITDB_ROOT_PASSWORD=password123 \
  --from-literal=ConnectionStrings__DefaultConnection="Host=postgres;Database=orders_db;Username=admin;Password=password123" \
  --from-literal=MONGO_URI="mongodb://admin:password123@mongodb:27017" \
  -n microservices

kubectl get secret jwt-secret -n microservices >/dev/null 2>&1 || \
kubectl create secret generic jwt-secret \
  --from-literal=Jwt__Key="ThisIsAVerySecretKeyForDevelopmentOnly123!" \
  --from-literal=Jwt__Issuer=IdentityService \
  --from-literal=Jwt__Audience=MicroserviceApp \
  -n microservices

# Deploy databases (using raw K8s manifests for StatefulSets)
echo -e "${YELLOW}Deploying databases...${NC}"
kubectl apply -f k8s/base/databases/
kubectl rollout status statefulset/postgres -n microservices --timeout=180s || true
kubectl rollout status statefulset/mongodb -n microservices --timeout=180s || true

# Update Helm dependencies for umbrella chart
echo -e "${YELLOW}Updating Helm dependencies...${NC}"
cd helm/microservices-umbrella
helm dependency update
cd "$PROJECT_ROOT"

# Determine values file
VALUES_FILE="helm/microservices-umbrella/values.yaml"
if [ -f "helm/microservices-umbrella/values-${ENVIRONMENT}.yaml" ]; then
    VALUES_FILE="helm/microservices-umbrella/values-${ENVIRONMENT}.yaml"
fi

# Deploy via Helm umbrella chart
echo -e "${YELLOW}Deploying services via Helm...${NC}"
helm upgrade --install microservices ./helm/microservices-umbrella \
  -f "$VALUES_FILE" \
  -n microservices \
  --wait \
  --timeout 5m

echo -e "${GREEN}=== Helm Deployment Complete ===${NC}"
echo ""
helm list -n microservices
echo ""
kubectl get pods -n microservices
