#!/bin/bash
# Deploys infrastructure (databases) and observability stack to the cluster.
# Run once when setting up or after an infra/observability chart change.
# Run from the repo root: ./platform/scripts/deploy-infra.sh
set -e

# Load environment variables from root .env
if [ -f ".env" ]; then
  set -a && source .env && set +a
fi

KUBE_CONTEXT="k3d-micro-cluster"
NAMESPACE="default"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Switching to cluster context: ${KUBE_CONTEXT}${NC}"
kubectl config use-context "${KUBE_CONTEXT}"

# Secrets
echo -e "${BLUE}Creating Kubernetes secrets...${NC}"
./platform/scripts/create-secrets.sh

# Infrastructure (PostgreSQL, MongoDB, Redis, MinIO)
echo -e "${BLUE}Deploying infrastructure...${NC}"
if helm status infrastructure --namespace ${NAMESPACE} > /dev/null 2>&1; then
  helm upgrade infrastructure platform/charts/infra --namespace ${NAMESPACE}
else
  helm install infrastructure platform/charts/infra --namespace ${NAMESPACE}
fi

# Wait for databases before deploying observability (Loki/Prometheus need storage)
echo -e "${BLUE}Waiting for databases to be ready...${NC}"
kubectl wait --namespace ${NAMESPACE} --for=condition=ready pod \
  --selector=app.kubernetes.io/name=postgresql --timeout=120s
kubectl wait --namespace ${NAMESPACE} --for=condition=ready pod \
  --selector=app.kubernetes.io/name=mongodb --timeout=120s
kubectl wait --namespace ${NAMESPACE} --for=condition=ready pod \
  --selector=app.kubernetes.io/name=redis --timeout=120s
kubectl wait --namespace ${NAMESPACE} --for=condition=ready pod \
  --selector=app.kubernetes.io/name=minio --timeout=120s

# Observability (Jaeger, Prometheus, Loki, OTel Collector, Grafana)
echo -e "${BLUE}Deploying observability stack...${NC}"
if helm status observability --namespace ${NAMESPACE} > /dev/null 2>&1; then
  helm upgrade observability platform/charts/observability --namespace ${NAMESPACE}
else
  helm install observability platform/charts/observability --namespace ${NAMESPACE}
fi

echo -e "${GREEN}Done. Infrastructure and observability are up.${NC}"
echo -e "${BLUE}Next: run ./platform/scripts/deploy-services.sh${NC}"
