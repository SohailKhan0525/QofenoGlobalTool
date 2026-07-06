#!/bin/bash
# test-all-tools.sh
# Runs E2E smoke tests for all Qofeno functions.

echo "Running E2E verification tests..."
node "$(dirname "$0")/test-tools.mjs"
echo "E2E verification completed."
