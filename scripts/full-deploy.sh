#!/bin/bash

set -e

echo "=== LC1v1 Complete Kubernetes Deployment ==="
echo ""

# Check if Minikube is running
if ! minikube status &> /dev/null; then
  echo "Starting Minikube..."
  minikube start --cpus=4 --memory=8192 --disk-size=20g
fi

# Connect to Minikube Docker
echo "Connecting to Minikube Docker daemon..."
eval $(minikube docker-env)

# Pull required images
echo "Pulling Apache Kafka image..."
docker pull apache/kafka:3.8.1

# Build all images
echo "Building all Docker images..."
./scripts/build-images.sh

# Deploy LC1v1 platform
echo "Deploying LC1v1 platform..."
./scripts/deploy.sh

# Deploy Judge0
echo "Deploying Judge0..."
./deployments/judge0/deploy-all.sh

# Wait for everything to be ready
echo "Waiting for all pods to be ready..."
sleep 60

# Show status
echo ""
echo "=== DEPLOYMENT STATUS ==="
kubectl get pods -n lc1v1
echo ""
kubectl get pods -n judge0

echo ""
echo "=== DEPLOYMENT COMPLETE ==="
echo ""
echo "To access your application, run these in separate terminals:"
./scripts/port-forwards.sh

