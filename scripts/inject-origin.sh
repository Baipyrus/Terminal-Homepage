#!/bin/bash
set -e

# Load .env file
if [ -f .env ]; then
  # Export variables from .env, ignoring comments and empty lines
  export $(grep -v '^#' .env | xargs)
fi

if [ "$NODE_ENV" = "development" ]; then
  ORIGIN_URL=${ORIGIN_DEV}
else
  ORIGIN_URL=${ORIGIN}
fi

if [ -z "$ORIGIN_URL" ]; then
  echo "Error: Neither ORIGIN_DEV nor ORIGIN was found in .env"
  exit 1
fi

# Replace the hardcoded URL in the build directory
# We use find to locate all files and sed to perform the in-place replacement
# Using | as a delimiter for sed to handle URLs containing /
find ./build -type f -exec sed -i "s|http://change_origin_url:5173|$ORIGIN_URL|g" {} +

echo "Successfully injected server origin into build output."
