#!/bin/bash
set -e

# Build the application
npm run build:release

# Run the application
npm run start