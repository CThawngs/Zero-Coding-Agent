#!/bin/bash

# Change directory to the script's directory
cd "$(dirname "$0")"

echo "Starting Zero Coding Agent..."

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "[ERROR] Node.js is not installed. Please install Node.js before running this script."
    exit 1
fi

# Install backend dependencies if not present
if [ ! -d "antigravity-web/backend/node_modules" ]; then
    echo "Installing backend dependencies, please wait..."
    cd antigravity-web/backend
    npm install
    cd ../..
fi

# Install frontend dependencies if not present
if [ ! -d "antigravity-web/frontend/node_modules" ]; then
    echo "Installing frontend dependencies, please wait..."
    cd antigravity-web/frontend
    npm install --no-audit --no-fund
    cd ../..
fi

echo "Starting backend server on http://localhost:3747..."
cd antigravity-web/backend

# Automatically open the browser based on OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "http://localhost:3747"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if command -v xdg-open &> /dev/null; then
        xdg-open "http://localhost:3747"
    else
        echo "Please open http://localhost:3747 in your browser."
    fi
else
    echo "Please open http://localhost:3747 in your browser."
fi

# Run node app
node src/app.js
