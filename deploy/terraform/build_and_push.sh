#!/bin/bash
set -euo pipefail

# Helper script to build and push Docker image, called by Terraform
# Usage: ./build_and_push.sh <server-ip> <image-tag> <project-root>

SERVER_IP="${1:-}"
IMAGE_TAG="${2:-latest}"
PROJECT_ROOT="${3:-}"

if [[ -z "$SERVER_IP" ]] || [[ -z "$PROJECT_ROOT" ]]; then
    echo "Usage: $0 <server-ip> <image-tag> <project-root>"
    exit 1
fi

REGISTRY_PORT=5000
LOCAL_REGISTRY="localhost:${REGISTRY_PORT}"
IMAGE_NAME="taskclearers"

echo "=== [Terraform Hook] Check/Build/Push Image ==="
echo "Server: $SERVER_IP"
echo "Image Tag: $IMAGE_TAG"

# Step 1: Start SSH tunnel to registry
echo "--> Finding remote registry bind address..."
# We need to find where the registry is listening on the remote end.
# It might be 127.0.0.1, or a public IP, or a tailscale IP.
# Use || true to prevent script exit on failure (set -e is enabled)
REMOTE_REGISTRY_INFO=$(ssh "root@${SERVER_IP}" "
    CONTAINER_ID=\$(docker ps --format '{{.ID}} {{.Image}}' | awk '\$2 ~ /registry/ {print \$1; exit}')
    if [[ -n \"\$CONTAINER_ID\" ]]; then
        docker port \"\$CONTAINER_ID\" 5000 2>/dev/null || echo ''
    fi
" 2>/dev/null || true)
REMOTE_BIND_IP=$(echo "${REMOTE_REGISTRY_INFO}" | cut -d: -f1 | tr -d '[:space:]')

if [[ -z "$REMOTE_BIND_IP" ]]; then
    echo "Warning: Could not determine remote registry IP. Defaulting to localhost."
    REMOTE_BIND_IP="localhost"
else
    echo "Remote registry is listening on: $REMOTE_BIND_IP"
fi

echo "--> Starting SSH tunnel to registry..."
# Kill any existing tunnel on this port
lsof -ti:${REGISTRY_PORT} | xargs kill -9 2>/dev/null || true
ssh -f -N -L ${REGISTRY_PORT}:${REMOTE_BIND_IP}:${REGISTRY_PORT} "root@${SERVER_IP}"
TUNNEL_PID=$(lsof -ti:${REGISTRY_PORT})
echo "SSH tunnel started (PID: $TUNNEL_PID)"

# Give tunnel a moment to establish
sleep 2

# Cleanup trap to ensure tunnel is closed
cleanup() {
    echo "--> Closing SSH tunnel..."
    kill "$TUNNEL_PID" 2>/dev/null || true
}
trap cleanup EXIT

# Step 2: Check if image exists in registry
echo "--> Checking if image exists in registry..."
if curl --silent --head --fail "http://${LOCAL_REGISTRY}/v2/${IMAGE_NAME}/manifests/${IMAGE_TAG}" >/dev/null; then
    echo "Image ${IMAGE_NAME}:${IMAGE_TAG} already exists in registry. Skipping build and push."
    exit 0
fi

echo "Image not found in registry. Proceeding with build."

# Step 3: Build the Docker image
echo "--> Building Docker image..."
cd "$PROJECT_ROOT"
docker build --platform linux/amd64 -t "${IMAGE_NAME}:${IMAGE_TAG}" .

# Step 4: Tag for local registry
echo "--> Tagging for registry..."
docker tag "${IMAGE_NAME}:${IMAGE_TAG}" "${LOCAL_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"

# Step 5: Push to registry
echo "--> Pushing to registry..."
docker push "${LOCAL_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"

echo "=== [Terraform Hook] Image Push Complete ==="