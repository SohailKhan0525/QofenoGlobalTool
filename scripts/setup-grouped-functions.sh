#!/bin/bash
# Creates the 8 grouped functions in Appwrite
# Run AFTER deleting all old functions

FUNCTIONS=(
  "qofeno-pdf:Qofeno PDF Tools:node-18.0:900"
  "qofeno-image:Qofeno Image Tools:node-18.0:300"
  "qofeno-video:Qofeno Video Tools:node-18.0:900"
  "qofeno-audio:Qofeno Audio Tools:node-18.0:600"
  "qofeno-text:Qofeno Text Tools:node-18.0:120"
  "qofeno-developer:Qofeno Developer Tools:node-18.0:120"
  "qofeno-data:Qofeno Data Tools:node-18.0:120"
  "qofeno-security:Qofeno Security Tools:node-18.0:120"
)

ENV_VARS=(
  "APPWRITE_ENDPOINT:${APPWRITE_ENDPOINT}"
  "APPWRITE_PROJECT_ID:${APPWRITE_PROJECT_ID}"
  "APPWRITE_API_KEY:${APPWRITE_API_KEY}"
  "DATABASE_ID:qofeno_db"
  "BUCKET_INPUTS:tool_inputs"
  "BUCKET_OUTPUTS:tool_outputs"
)

for entry in "${FUNCTIONS[@]}"; do
  IFS=":" read -r fid fname runtime timeout <<< "$entry"
  echo "Creating: $fid"

  appwrite functions create \
    --functionId="$fid" \
    --name="$fname" \
    --runtime="$runtime" \
    --timeout="$timeout" \
    --execute="any" 2>/dev/null || echo "  Already exists"

  for varentry in "${ENV_VARS[@]}"; do
    IFS=":" read -r key value <<< "$varentry"
    appwrite functions createVariable \
      --functionId="$fid" \
      --key="$key" \
      --value="$value" 2>/dev/null
  done

  echo "  ✓ $fid ready"
done
echo "All 8 functions created."
