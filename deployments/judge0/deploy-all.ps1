# Deploy complete Judge0 setup
Write-Host "Deploying Judge0..." -ForegroundColor Cyan

# Create namespace
kubectl apply -f deployments/judge0/namespace.yaml

# Deploy dependencies
Write-Host "Deploying Redis and PostgreSQL for Judge0..." -ForegroundColor Yellow
kubectl apply -f deployments/judge0/redis.yaml
kubectl apply -f deployments/judge0/postgres.yaml

# Wait for dependencies
Write-Host "Waiting for dependencies..." -ForegroundColor Yellow
Start-Sleep -Seconds 20

# Deploy secrets
kubectl apply -f deployments/judge0/secret-conn.yaml

# Deploy Judge0 API and Worker
Write-Host "Deploying Judge0 API and Worker..." -ForegroundColor Yellow
kubectl apply -f deployments/judge0/api.yaml
kubectl apply -f deployments/judge0/worker.yaml

Write-Host "`nJudge0 deployed!" -ForegroundColor Green
Write-Host "Check status: kubectl get pods -n judge0" -ForegroundColor Cyan

Write-Host "`nTo access Judge0 API:" -ForegroundColor Yellow
Write-Host "  kubectl port-forward -n judge0 svc/judge0-api 2358:2358" -ForegroundColor Green
Write-Host "`nThen Judge0 will be at: http://localhost:2358" -ForegroundColor Green


