#!/bin/bash

# Change directory to the script's directory
cd "$(dirname "$0")"

echo "Stopping Zero Coding Agent backend server on port 3747..."

if command -v lsof &> /dev/null; then
    PID=$(lsof -t -i:3747)
    if [ -z "$PID" ]; then
        echo "No process found running on port 3747. It might be already stopped."
    else
        echo "Killing process $PID running on port 3747..."
        kill -9 $PID
        echo "Zero Coding Agent has been stopped successfully."
    fi
else
    if command -v fuser &> /dev/null; then
        echo "Killing port 3747 using fuser..."
        fuser -k 3747/tcp
        echo "Zero Coding Agent has been stopped successfully."
    else
        echo "[ERROR] Could not find lsof or fuser command to stop the process."
        echo "Please kill the process manually or install lsof/fuser."
        exit 1
    fi
fi
