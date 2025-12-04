### Linux/Mac
```bash
# Edit secrets first
nano deployments/k8s/secrets.yaml #reference the doc for this


# Run complete deployment
chmod +x scripts/*.sh deployments/judge0/*.sh
./scripts/full-deploy.sh
```