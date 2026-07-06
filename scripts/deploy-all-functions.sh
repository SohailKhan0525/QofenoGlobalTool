#!/bin/bash
# deploy-all-functions.sh
# Wraps deploy_functions.mjs to deploy all 92 Appwrite functions.

echo "Starting deployment of all Appwrite Functions..."
node "$(dirname "$0")/deploy_functions.mjs"
echo "All deployments completed!"
