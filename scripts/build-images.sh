#!/bin/bash

set -e

MODE=${1:-prod}

echo "Building Docker images for Minikube (Mode: $MODE)..."

# Use Minikube's Docker daemon
eval $(minikube docker-env)

if [ "$MODE" = "dev" ]; then
  echo "Building DEV images with hot-reload support..."
  
  echo "Building backend-api (dev)..."
  docker build -f backend-api/Dockerfile.dev -t lc1v1/backend-api:dev ./backend-api
  
  echo "Building frontend (dev)..."
  docker build -f app/frontend/Dockerfile.dev -t lc1v1/frontend:dev ./app/frontend
  
  echo "Building gameserver (dev)..."
  docker build -f app/gameserver/Dockerfile.dev -t lc1v1/gameserver:dev ./app/gameserver
  
  echo "Building matchmaker (dev)..."
  docker build -f app/matchmaker/Dockerfile.dev -t lc1v1/matchmaker:dev ./app/matchmaker
  
  echo "Building judge (dev)..."
  docker build -f app/judge/Dockerfile.dev -t lc1v1/judge:dev ./app/judge
  
else
  echo "Building PRODUCTION images..."
  
  echo "Building backend-api..."
  docker build -t lc1v1/backend-api:latest ./backend-api
  
  echo "Building frontend..."
  docker build -t lc1v1/frontend:latest ./app/frontend
  
  echo "Building gameserver..."
  docker build -t lc1v1/gameserver:latest ./app/gameserver
  
  echo "Building matchmaker..."
  docker build -t lc1v1/matchmaker:latest ./app/matchmaker
  
  echo "Building judge..."
  docker build -f app/judge/Dockerfile.express -t lc1v1/judge:latest ./app/judge
fi

echo "All images built successfully!"
docker images | grep lc1v1
