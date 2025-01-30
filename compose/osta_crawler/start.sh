#!/bin/sh
set -e

# Build the application
npm run build:release && npm run build:release:sql && CRAWLEE_PURGE_ON_START=0 npm run start 

# Run the application
