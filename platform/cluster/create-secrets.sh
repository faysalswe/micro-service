#!/bin/bash
# Single source of truth: reads ALL credentials from root .env and creates Kubernetes secrets.
# Run once after every cluster creation, before deploying services or infrastructure.
set -e

ENV_FILE="$(dirname "$0")/../../.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: .env file not found at $ENV_FILE"
  exit 1
fi

source "$ENV_FILE"

echo "Creating db-credentials secret..."

kubectl create secret generic db-credentials \
  --namespace default \
  \
  `# --- OrderService (PostgreSQL) ---` \
  --from-literal=ConnectionStrings__DefaultConnection="Host=infrastructure-postgresql;Port=5432;Database=${DB_NAME_ORDER};Username=${DB_USER};Password=${DB_PASSWORD}" \
  \
  `# --- PaymentService (MongoDB) ---` \
  --from-literal=MONGO_URI="mongodb://root:${DB_PASSWORD}@infrastructure-mongodb:27017/${DB_NAME_PAYMENT}?authSource=admin" \
  \
  `# --- InventoryService (PostgreSQL) ---` \
  --from-literal=INVENTORY_DB_HOST="infrastructure-postgresql" \
  --from-literal=INVENTORY_DB_PORT="5432" \
  --from-literal=INVENTORY_DB_NAME="${DB_NAME_INVENTORY}" \
  --from-literal=INVENTORY_DB_USER="${DB_USER}" \
  --from-literal=INVENTORY_DB_PASSWORD="${DB_PASSWORD}" \
  \
  `# --- Bitnami PostgreSQL existingSecret keys ---` \
  --from-literal=DB_PASSWORD="${DB_PASSWORD}" \
  --from-literal=POSTGRES_ADMIN_PASSWORD="${DB_PASSWORD}" \
  \
  `# --- Bitnami MongoDB existingSecret keys ---` \
  --from-literal=mongodb-root-password="${DB_PASSWORD}" \
  --from-literal=mongodb-passwords="${DB_PASSWORD}" \
  \
  --dry-run=client -o yaml | kubectl apply -f -

echo "Creating jwt-secret..."
kubectl create secret generic jwt-secret \
  --namespace default \
  --from-literal=Jwt__Key="${JWT_SECRET}" \
  --from-literal=Jwt__Issuer="IdentityService" \
  --from-literal=Jwt__Audience="MicroserviceApp" \
  --dry-run=client -o yaml | kubectl apply -f -

echo "Creating minio-credentials secret..."
kubectl create secret generic minio-credentials \
  --namespace default \
  --from-literal=root-user="${MINIO_ROOT_USER}" \
  --from-literal=root-password="${MINIO_ROOT_PASSWORD}" \
  --from-literal=S3_ACCESS_KEY="${MINIO_ROOT_USER}" \
  --from-literal=S3_SECRET_KEY="${MINIO_ROOT_PASSWORD}" \
  --dry-run=client -o yaml | kubectl apply -f -

echo "Done. Secrets created successfully."
