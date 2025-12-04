# PowerShell script for Windows
param(
    [string]$Mode = "prod"
)

$ErrorActionPreference = "Stop"

Write-Host "Building Docker images for Minikube (Mode: $Mode)..." -ForegroundColor Cyan

# Use Minikube's Docker daemon
& minikube -p minikube docker-env --shell powershell | Invoke-Expression

if ($Mode -eq "dev") {
    Write-Host "Building DEV images with hot-reload support..." -ForegroundColor Yellow
    
    Write-Host "Building backend-api (dev)..." -ForegroundColor Green
    docker build -f backend-api/Dockerfile.dev -t lc1v1/backend-api:dev ./backend-api
    
    Write-Host "Building frontend (dev)..." -ForegroundColor Green
    docker build -f app/frontend/Dockerfile.dev -t lc1v1/frontend:dev ./app/frontend
    
    Write-Host "Building gameserver (dev)..." -ForegroundColor Green
    docker build -f app/gameserver/Dockerfile.dev -t lc1v1/gameserver:dev ./app/gameserver
    
    Write-Host "Building matchmaker (dev)..." -ForegroundColor Green
    docker build -f app/matchmaker/Dockerfile.dev -t lc1v1/matchmaker:dev ./app/matchmaker
    
    Write-Host "Building judge (dev)..." -ForegroundColor Green
    docker build -f app/judge/Dockerfile.dev -t lc1v1/judge:dev ./app/judge
} else {
    Write-Host "Building PRODUCTION images..." -ForegroundColor Yellow
    
    Write-Host "Building backend-api..." -ForegroundColor Green
    docker build -t lc1v1/backend-api:latest ./backend-api
    
    Write-Host "Building frontend..." -ForegroundColor Green
    docker build -t lc1v1/frontend:latest ./app/frontend
    
    Write-Host "Building gameserver..." -ForegroundColor Green
    docker build -t lc1v1/gameserver:latest ./app/gameserver
    
    Write-Host "Building matchmaker..." -ForegroundColor Green
    docker build -t lc1v1/matchmaker:latest ./app/matchmaker
    
    Write-Host "Building judge..." -ForegroundColor Green
    docker build -f app/judge/Dockerfile.express -t lc1v1/judge:latest ./app/judge
}

Write-Host "All images built successfully!" -ForegroundColor Green
docker images | Select-String "lc1v1"


