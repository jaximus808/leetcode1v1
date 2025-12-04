#!/bin/bash

set -e

echo "Deploying Judge0..."

# Create namespace
kubectl apply -f deployments/judge0/namespace.yaml

# Deploy dependencies
echo "Deploying Redis and PostgreSQL for Judge0..."
kubectl apply -f deployments/judge0/redis.yaml
kubectl apply -f deployments/judge0/postgres.yaml

# Wait for dependencies
echo "Waiting for dependencies..."
sleep 20

# Deploy secrets
kubectl apply -f deployments/judge0/secret-conn.yaml

# Deploy Judge0 API and Worker
echo "Deploying Judge0 API and Worker..."
kubectl apply -f deployments/judge0/api.yaml
kubectl apply -f deployments/judge0/worker.yaml

echo ""
echo "Judge0 deployed!"
echo "Check status: kubectl get pods -n judge0"

echo ""
echo "To access Judge0 API:"
echo "  kubectl port-forward -n judge0 svc/judge0-api 2358:2358"
echo ""
echo "Then Judge0 will be at: http://localhost:2358"

