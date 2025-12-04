# PowerShell mount script
Write-Host "Mounting project directory for hot-reload..." -ForegroundColor Cyan
Write-Host "This will keep running. Press Ctrl+C to stop." -ForegroundColor Yellow
Write-Host ""

$currentPath = (Get-Location).Path
minikube mount "${currentPath}:/hosthome/LC1v1"
