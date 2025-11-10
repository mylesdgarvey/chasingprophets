#!/bin/bash
# Simple wrapper to run train-models.ts using Node.js ESM + ts-node
set -e

cd "$(dirname "$0")/../.."

# Load environment variables
source ./scripts/load-env.sh

# Run with Node.js ESM
NODE_OPTIONS="--loader ts-node/esm --no-warnings" node scripts/admin/train-models.ts "$@"
