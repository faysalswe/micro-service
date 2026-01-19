#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Step 20: Kubernetes Setup ===${NC}"

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

command -v kubectl >/dev/null 2>&1 || { echo -e "${RED}kubectl required but not installed. Aborting.${NC}"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo -e "${RED}docker required but not installed. Aborting.${NC}"; exit 1; }

echo -e "${GREEN}Prerequisites check passed.${NC}"

# Navigate to project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
cd "$PROJECT_ROOT"

# Check for minikube/kind and start if available
if command -v minikube >/dev/null 2>&1; then
    echo -e "${YELLOW}Starting minikube...${NC}"
    minikube status >/dev/null 2>&1 || minikube start --cpus=4 --memory=8192 --driver=docker
    eval $(minikube docker-env)
    echo -e "${GREEN}Minikube started and docker env configured.${NC}"
elif command -v kind >/dev/null 2>&1; then
    echo -e "${YELLOW}Checking kind cluster...${NC}"
    kind get clusters | grep -q microservices || kind create cluster --name microservices
    kubectl cluster-info --context kind-microservices
    echo -e "${GREEN}Kind cluster ready.${NC}"
else
    echo -e "${YELLOW}No local Kubernetes (minikube/kind) detected. Assuming kubectl is configured to a cluster.${NC}"
fi

# Build Docker images
echo -e "${YELLOW}Building Docker images...${NC}"

echo "Building OrderService..."
docker build -t microservices/order-service:latest -f OrderService/Dockerfile .

echo "Building PaymentService..."
docker build -t microservices/payment-service:latest -f PaymentService/Dockerfile .

echo "Building IdentityService..."
docker build -t microservices/identity-service:latest -f IdentityService/Dockerfile .

echo -e "${GREEN}Docker images built successfully.${NC}"

# Create namespace
echo -e "${YELLOW}Creating namespace...${NC}"
kubectl apply -f k8s/base/namespace.yaml

# Create secrets (using example values for development)
echo -e "${YELLOW}Creating secrets...${NC}"

kubectl create secret generic db-credentials \
  --from-literal=POSTGRES_USER=admin \
  --from-literal=POSTGRES_PASSWORD=password123 \
  --from-literal=POSTGRES_DB=orders_db \
  --from-literal=MONGO_INITDB_ROOT_USERNAME=admin \
  --from-literal=MONGO_INITDB_ROOT_PASSWORD=password123 \
  --from-literal=ConnectionStrings__DefaultConnection="Host=postgres;Database=orders_db;Username=admin;Password=password123" \
  --from-literal=MONGO_URI="mongodb://admin:password123@mongodb:27017" \
  -n microservices --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic jwt-secret \
  --from-literal=Jwt__Key="ThisIsAVerySecretKeyForDevelopmentOnly123!" \
  --from-literal=Jwt__Issuer=IdentityService \
  --from-literal=Jwt__Audience=MicroserviceApp \
  -n microservices --dry-run=client -o yaml | kubectl apply -f -

echo -e "${GREEN}Secrets created.${NC}"

# Deploy databases first
echo -e "${YELLOW}Deploying databases...${NC}"
kubectl apply -f k8s/base/databases/

echo "Waiting for PostgreSQL..."
kubectl rollout status statefulset/postgres -n microservices --timeout=180s

echo "Waiting for MongoDB..."
kubectl rollout status statefulset/mongodb -n microservices --timeout=180s

echo -e "${GREEN}Databases deployed.${NC}"

# Deploy ConfigMaps
echo -e "${YELLOW}Deploying ConfigMaps...${NC}"
kubectl apply -f k8s/base/configmaps/

# Deploy Services
echo -e "${YELLOW}Deploying Services...${NC}"
kubectl apply -f k8s/base/services/

# Deploy Applications
echo -e "${YELLOW}Deploying Applications...${NC}"
kubectl apply -f k8s/base/deployments/

echo "Waiting for Order Service..."
kubectl rollout status deployment/order-service -n microservices --timeout=180s

echo "Waiting for Payment Service..."
kubectl rollout status deployment/payment-service -n microservices --timeout=180s

echo "Waiting for Identity Service..."
kubectl rollout status deployment/identity-service -n microservices --timeout=180s

echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo ""
echo "Cluster Status:"
kubectl get pods -n microservices
echo ""
echo "Services:"
kubectl get svc -n microservices
echo ""

# Port forward instructions
echo -e "${YELLOW}To access services locally:${NC}"
echo "  kubectl port-forward svc/identity-service 8080:8080 -n microservices"
echo "  kubectl port-forward svc/order-service 8081:8080 -n microservices"
echo ""
echo -e "${GREEN}Done!${NC}"
