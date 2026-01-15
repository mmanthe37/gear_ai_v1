#!/bin/bash
# Script to serve the dist directory locally for testing
# Requires npx serve to be available

echo "Starting local server for dist/ directory..."
echo "Press Ctrl+C to stop"
echo ""
echo "Testing GitHub Pages deployment locally"
echo "URL: http://localhost:8080"
echo ""

# Check if serve is available
if ! command -v npx &> /dev/null; then
    echo "Error: npx not found. Please install Node.js"
    exit 1
fi

# Check if dist directory exists
if [ ! -d "dist" ]; then
    echo "Error: dist/ directory not found"
    echo "Run 'npm run build' first to create the web build"
    exit 1
fi

# Serve the dist directory
npx serve dist -l 8080
