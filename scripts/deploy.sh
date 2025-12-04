#!/bin/bash

set -e

MODE=${1:-prod}

echo "Deploying LC1v1 to Kubernetes (Mode: $MODE)..."

# Create namespace
echo "Creating namespace..."
kubectl apply -f deployments/k8s/namespace.yaml

# Apply ConfigMaps and Secrets
echo "Applying ConfigMaps and Secrets..."
kubectl apply -f deployments/k8s/configmap.yaml
kubectl apply -f deployments/k8s/secrets.yaml

# Deploy infrastructure (Redis, Kafka in KRaft mode)
echo "Deploying infrastructure..."
kubectl apply -f deployments/k8s/redis.yaml
kubectl apply -f deployments/k8s/kafka.yaml

# Wait for infrastructure to be ready
echo "Waiting for infrastructure to be ready..."
kubectl wait --for=condition=ready pod -l app=redis -n lc1v1 --timeout=120s || true
echo "Waiting for Kafka to be ready (KRaft mode)..."
kubectl wait --for=condition=ready pod -l app=kafka -n lc1v1 --timeout=180s || true

if [ "$MODE" = "dev" ]; then
  echo "Deploying application services (DEV mode with hot-reload)..."
  
  # Mount host directory for hot-reload
  echo "WARNING: Make sure you run: minikube mount $(pwd):/hosthome/LC1v1"
  
  kubectl apply -f deployments/k8s-dev/backend-api-dev.yaml
  kubectl apply -f deployments/k8s-dev/gameserver-dev.yaml
  kubectl apply -f deployments/k8s-dev/matchmaker-dev.yaml
  kubectl apply -f deployments/k8s/judge.yaml
  kubectl apply -f deployments/k8s-dev/frontend-dev.yaml
else
  echo "Deploying application services (PRODUCTION mode)..."
  kubectl apply -f deployments/k8s/backend-api.yaml
  kubectl apply -f deployments/k8s/gameserver.yaml
  kubectl apply -f deployments/k8s/matchmaker.yaml
  kubectl apply -f deployments/k8s/judge.yaml
  kubectl apply -f deployments/k8s/frontend.yaml
fi

echo "Waiting for deployments to be ready..."
kubectl wait --for=condition=available deployment --all -n lc1v1 --timeout=300s || true

echo "Deployment complete!"
echo ""
echo "Checking deployment status..."
kubectl get all -n lc1v1

echo ""
echo "Access the application:"
MINIKUBE_IP=$(minikube ip)
echo "Frontend:     http://$MINIKUBE_IP:30080"
echo "Backend API:  http://$MINIKUBE_IP:30000"
echo "Gameserver:   http://$MINIKUBE_IP:30001"
echo "Judge:        http://$MINIKUBE_IP:30002"

if [ "$MODE" = "dev" ]; then
  echo ""
  echo "Hot-reload is enabled! Edit your code and see changes automatically."
  echo "WARNING: Don't forget to run in another terminal:"
  echo "    minikube mount $(pwd):/hosthome/LC1v1"
fi
