#!/bin/bash
# Deploys all 8 grouped functions
# Installs deps + deploys with Dockerfile if present

FUNCTIONS=("qofeno-pdf" "qofeno-image" "qofeno-video" "qofeno-audio" "qofeno-text" "qofeno-developer" "qofeno-data" "qofeno-security")

for func in "${FUNCTIONS[@]}"; do
  echo "Deploying: $func"
  cd "functions/$func"
  npm install --production --silent
  cd ../..

  appwrite deploy function \
    --functionId="$func" \
    --code="functions/$func" \
    --activate=true

  echo "  ✓ $func deployed"
  sleep 3  # small delay to avoid rate limits
done

echo "All 8 functions deployed."
