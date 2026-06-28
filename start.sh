#!/bin/bash

# Change directory to the script's directory
cd "$(dirname "$0")"

echo "============================================="
echo "  Zero Coding Agent Launcher"
echo "============================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "[ERROR] Node.js is not installed. Please install Node.js before running this script."
    exit 1
fi

# Install backend dependencies if not present
if [ ! -d "Agent Coding/backend/node_modules" ]; then
    echo "Installing backend dependencies, please wait..."
    cd "Agent Coding/backend"
    npm install
    cd ../..
fi

# Install frontend dependencies if not present
if [ ! -d "Agent Coding/frontend/node_modules" ]; then
    echo "Installing frontend dependencies, please wait..."
    cd "Agent Coding/frontend"
    npm install --no-audit --no-fund
    cd ../..
fi

# Build frontend if dist doesn't exist
if [ ! -f "Agent Coding/backend/public/index.html" ]; then
    echo "Building frontend..."
    cd "Agent Coding/frontend"
    npm run build
    cd ../..
    mkdir -p "Agent Coding/backend/public"
    cp -r Agent Coding/frontend/dist/* Agent Coding/backend/public/
fi

# Check for running process on port 3747 and stop it first
if command -v lsof &> /dev/null; then
    PID=$(lsof -t -i:3747)
    if [ ! -z "$PID" ]; then
        echo "Stopping previous process on port 3747 (PID: $PID)..."
        kill -9 $PID
    fi
elif command -v fuser &> /dev/null; then
    echo "Stopping previous process on port 3747 using fuser..."
    fuser -k 3747/tcp &> /dev/null
fi

echo "Starting Zero Coding Agent in the background..."
echo "URL: http://localhost:3747"
echo ""

# Run node app in background and detach
cd "Agent Coding/backend"
nohup node src/app.js > /dev/null 2>&1 &
disown
cd ../..

# Wait for server to start
sleep 2

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

echo "Launcher completed successfully. Closing terminal..."
sleep 1
kill -9 $PPID 2>/dev/null || exit 0
