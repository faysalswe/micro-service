#!/bin/bash
set -e

# Configuration
CLUSTER_NAME="micro-cluster"
CONFIG_FILE="platform/cluster/k3d-cluster.yaml"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Checking environment for k3d cluster setup...${NC}"

# Check if docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

# Check if k3d is installed
if ! command -v k3d > /dev/null 2>&1; then
    echo -e "${RED}❌ k3d is not installed. Please install it (brew install k3d) and try again.${NC}"
    exit 1
fi

# Check if cluster already exists
if k3d cluster list | grep -q "$CLUSTER_NAME"; then
    echo -e "${GREEN}✅ Cluster '$CLUSTER_NAME' already exists.${NC}"
else
    echo -e "${BLUE}🚀 Creating k3d cluster '$CLUSTER_NAME' from config...${NC}"
    if [ ! -f "$CONFIG_FILE" ]; then
        echo -e "${RED}❌ Config file not found at $CONFIG_FILE${NC}"
        exit 1
    fi
    k3d cluster create --config "$CONFIG_FILE" --wait
    echo -e "${GREEN}✨ Cluster '$CLUSTER_NAME' created successfully!${NC}"
fi

# Ensure kubeconfig is updated and we are in the right context
echo -e "${BLUE}🔧 Updating kubeconfig context...${NC}"
k3d kubeconfig merge "$CLUSTER_NAME" --kubeconfig-switch-context

echo -e "${GREEN}🎉 Environment is ready for deployment.${NC}"
