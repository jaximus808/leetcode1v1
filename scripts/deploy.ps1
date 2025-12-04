# PowerShell script for Windows
param(
    [string]$Mode = "prod"
)

$ErrorActionPreference = "Stop"

Write-Host "Deploying LC1v1 to Kubernetes (Mode: $Mode)..." -ForegroundColor Cyan

# Create namespace
Write-Host "Creating namespace..." -ForegroundColor Yellow
kubectl apply -f deployments/k8s/namespace.yaml

# Apply ConfigMaps and Secrets
Write-Host "Applying ConfigMaps and Secrets..." -ForegroundColor Yellow
kubectl apply -f deployments/k8s/configmap.yaml
kubectl apply -f deployments/k8s/secrets.yaml

# Deploy infrastructure (Redis, Kafka in KRaft mode)
Write-Host "Deploying infrastructure..." -ForegroundColor Yellow
kubectl apply -f deployments/k8s/redis.yaml
kubectl apply -f deployments/k8s/kafka.yaml

# Wait for infrastructure to be ready
Write-Host "Waiting for infrastructure to be ready..." -ForegroundColor Yellow
try { kubectl wait --for=condition=ready pod -l app=redis -n lc1v1 --timeout=120s } catch {}
Write-Host "Waiting for Kafka to be ready (KRaft mode)..." -ForegroundColor Yellow
try { kubectl wait --for=condition=ready pod -l app=kafka -n lc1v1 --timeout=180s } catch {}

if ($Mode -eq "dev") {
    Write-Host "Deploying application services (DEV mode with hot-reload)..." -ForegroundColor Yellow
    
    $currentPath = (Get-Location).Path
    Write-Host "WARNING: Make sure you run in another terminal:" -ForegroundColor Red
    Write-Host "    minikube mount ${currentPath}:/hosthome/LC1v1" -ForegroundColor Red
    
    kubectl apply -f deployments/k8s-dev/backend-api-dev.yaml
    kubectl apply -f deployments/k8s-dev/gameserver-dev.yaml
    kubectl apply -f deployments/k8s-dev/matchmaker-dev.yaml
    kubectl apply -f deployments/k8s/judge.yaml
    kubectl apply -f deployments/k8s-dev/frontend-dev.yaml
} else {
    Write-Host "Deploying application services (PRODUCTION mode)..." -ForegroundColor Yellow
    kubectl apply -f deployments/k8s/backend-api.yaml
    kubectl apply -f deployments/k8s/gameserver.yaml
    kubectl apply -f deployments/k8s/matchmaker.yaml
    kubectl apply -f deployments/k8s/judge.yaml
    kubectl apply -f deployments/k8s/frontend.yaml
}

Write-Host "Waiting for deployments to be ready..." -ForegroundColor Yellow
try { kubectl wait --for=condition=available deployment --all -n lc1v1 --timeout=300s } catch {}

Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Checking deployment status..." -ForegroundColor Cyan
kubectl get all -n lc1v1

Write-Host ""
Write-Host "Access the application:" -ForegroundColor Cyan
$minikubeIp = minikube ip
Write-Host "Frontend:     http://${minikubeIp}:30080" -ForegroundColor Green
Write-Host "Backend API:  http://${minikubeIp}:30000" -ForegroundColor Green
Write-Host "Gameserver:   http://${minikubeIp}:30001" -ForegroundColor Green
Write-Host "Judge:        http://${minikubeIp}:30002" -ForegroundColor Green

if ($Mode -eq "dev") {
    Write-Host ""
    Write-Host "Hot-reload is enabled! Edit your code and see changes automatically." -ForegroundColor Yellow
    $currentPath = (Get-Location).Path
    Write-Host "WARNING: Don't forget to run in another terminal:" -ForegroundColor Red
    Write-Host "    minikube mount ${currentPath}:/hosthome/LC1v1" -ForegroundColor Red
}

