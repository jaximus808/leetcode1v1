# PowerShell script to show port-forward commands
Write-Host "Setting up port forwards for LC1v1..." -ForegroundColor Cyan
Write-Host "Keep these terminals open!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Run these commands in separate terminals:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Terminal 1 - Frontend:" -ForegroundColor Yellow
Write-Host "  minikube service frontend -n lc1v1" -ForegroundColor Green
Write-Host ""
Write-Host "Terminal 2 - Backend API:" -ForegroundColor Yellow
Write-Host "  kubectl port-forward -n lc1v1 svc/backend-api 3000:3000" -ForegroundColor Green
Write-Host ""
Write-Host "Terminal 3 - Gameserver:" -ForegroundColor Yellow
Write-Host "  kubectl port-forward -n lc1v1 svc/gameserver 4000:4000" -ForegroundColor Green
Write-Host ""
Write-Host "Terminal 4 - Judge:" -ForegroundColor Yellow
Write-Host "  kubectl port-forward -n lc1v1 svc/judge 7071:7071" -ForegroundColor Green
Write-Host ""
Write-Host "Optional - Judge0 API:" -ForegroundColor Yellow
Write-Host "  kubectl port-forward -n judge0 svc/judge0-api 2358:2358" -ForegroundColor Green

