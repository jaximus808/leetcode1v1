#!/bin/bash

echo "Cleaning up LC1v1 deployment..."

# Delete namespace (this will delete all resources in it)
kubectl delete namespace lc1v1

echo "Cleanup complete!"
echo ""
echo "Note: PersistentVolumes may still exist. To completely clean up:"
echo "  kubectl get pv"
echo "  kubectl delete pv <pv-name>"
