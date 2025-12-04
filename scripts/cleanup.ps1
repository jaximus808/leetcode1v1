# PowerShell cleanup script
$ErrorActionPreference = "Stop"

Write-Host "Cleaning up LC1v1 deployment..." -ForegroundColor Yellow

# Delete namespace (this will delete all resources in it)
kubectl delete namespace lc1v1

Write-Host "Cleanup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Note: PersistentVolumes may still exist. To completely clean up:" -ForegroundColor Yellow
Write-Host "  kubectl get pv" -ForegroundColor Cyan
Write-Host "  kubectl delete pv <pv-name>" -ForegroundColor Cyan
