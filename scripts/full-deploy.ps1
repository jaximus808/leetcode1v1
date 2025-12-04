# PowerShell - Complete LC1v1 Kubernetes Deployment

Write-Host "=== LC1v1 Complete Kubernetes Deployment ===" -ForegroundColor Cyan
Write-Host ""

# Check if Minikube is running
$minikubeStatus = minikube status 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "Starting Minikube..." -ForegroundColor Yellow
  minikube start
}

# Connect to Minikube Docker
Write-Host "Connecting to Minikube Docker daemon..." -ForegroundColor Yellow
& minikube -p minikube docker-env --shell powershell | Invoke-Expression

# Pull required images
Write-Host "Pulling Apache Kafka image..." -ForegroundColor Yellow
docker pull apache/kafka:3.8.1

# Build all images
Write-Host "Building all Docker images..." -ForegroundColor Yellow
.\scripts\build-images.ps1

# Deploy LC1v1 platform
Write-Host "Deploying LC1v1 platform..." -ForegroundColor Yellow
.\scripts\deploy.ps1

# Deploy Judge0
Write-Host "Deploying Judge0..." -ForegroundColor Yellow
.\deployments\judge0\deploy-all.ps1

# Wait for everything to be ready
Write-Host "Waiting for all pods to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 60

# Show status
Write-Host "" 
Write-Host "=== DEPLOYMENT STATUS ===" -ForegroundColor Cyan
kubectl get pods -n lc1v1
Write-Host ""
kubectl get pods -n judge0

Write-Host ""
Write-Host "=== DEPLOYMENT COMPLETE ===" -ForegroundColor Green
Write-Host ""
Write-Host "To access your application, run these in separate terminals:" -ForegroundColor Cyan
.\scripts\port-forwards.ps1

