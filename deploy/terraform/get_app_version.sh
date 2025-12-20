#!/bin/bash
set -e

# Change to project root relative to this script
cd "$(dirname "$0")/../.."

# Extract version from package.json
if [ -f "package.json" ]; then
    VERSION=$(grep '"version":' package.json | head -1 | awk -F: '{ print $2 }' | sed 's/[ ", ]//g')
else
    echo "Error: package.json not found" >&2
    exit 1
fi

if [ -z "$VERSION" ]; then
    echo "Error: Could not extract version from package.json" >&2
    exit 1
fi

# Return JSON for Terraform
echo "{\"version\": \"$VERSION\"}"