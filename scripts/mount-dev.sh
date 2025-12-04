#!/bin/bash

echo "Mounting project directory for hot-reload..."
echo "This will keep running. Press Ctrl+C to stop."
echo ""

minikube mount $(pwd):/hosthome/LC1v1
