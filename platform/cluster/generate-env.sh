#!/bin/bash
# Reads root .env and writes resolved values into each service's .env file.
# Run from repo root: ./platform/cluster/generate-env.sh
set -e

ROOT_ENV="$(dirname "$0")/../../.env"

if [ ! -f "$ROOT_ENV" ]; then
  echo "ERROR: root .env not found at $ROOT_ENV"
  exit 1
fi

source "$ROOT_ENV"

echo "Generating service .env files from root .env..."

# --- InventoryService ---
cat > services/InventoryService/.env <<EOF
# Auto-generated from root .env — do not edit manually, run generate-env.sh
DB_HOST=localhost
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME_INVENTORY}
DB_PORT=${PORT_POSTGRES_INVENTORY}

GRPC_PORT=${INTERNAL_PORT_GRPC_INVENTORY}
REST_PORT=${INTERNAL_PORT_INVENTORY}

OTEL_EXPORTER_OTLP_ENDPOINT=${OTEL_EXPORTER_OTLP_ENDPOINT}

SERVICE_NAME=InventoryService
SERVICE_VERSION=${SERVICE_VERSION}
EOF
echo "  services/InventoryService/.env updated"

# --- PaymentService ---
cat > services/PaymentService/.env <<EOF
# Auto-generated from root .env — do not edit manually, run generate-env.sh
MONGO_URI=mongodb://root:${DB_PASSWORD}@localhost:27017/${DB_NAME_PAYMENT}?authSource=admin
MONGO_DB_NAME=${DB_NAME_PAYMENT}

GRPC_PORT=${INTERNAL_PORT_GRPC_PAYMENT}
REST_PORT=${INTERNAL_PORT_PAYMENT}

OTEL_EXPORTER_OTLP_ENDPOINT=${OTEL_EXPORTER_OTLP_ENDPOINT}
LOKI_URL=${LOKI_URL}

SERVICE_NAME=PaymentService
SERVICE_VERSION=${SERVICE_VERSION}
NODE_ENV=${NODE_ENV}
LOG_LEVEL=${LOG_LEVEL}

PROTO_PATH=../../protos
EOF
echo "  services/PaymentService/.env updated"

echo "Done."
