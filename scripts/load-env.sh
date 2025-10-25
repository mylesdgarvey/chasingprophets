#!/bin/bash

# Load environment variables from .env file
set -a
source .env
set +a

# Export them for AWS CLI
export AWS_ACCESS_KEY_ID
export AWS_SECRET_ACCESS_KEY
export AWS_REGION

# Run the command passed as arguments
exec "$@"