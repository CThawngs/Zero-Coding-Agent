#!/bin/bash

# Change directory to the script's directory
cd "$(dirname "$0")"

echo "============================================="
echo "  Stopping Zero Coding Agent..."
echo "============================================="
echo ""

FOUND=0

if command -v lsof &> /dev/null; then
    PID=$(lsof -t -i:3747)
    if [ ! -z "$PID" ]; then
        echo "Killing process $PID running on port 3747..."
        kill -9 $PID
        FOUND=1
    fi
elif command -v fuser &> /dev/null; then
    echo "Killing port 3747 using fuser..."
    fuser -k 3747/tcp &> /dev/null
    FOUND=1
fi

if [ $FOUND -eq 0 ]; then
    echo "No process was found running on port 3747."
else
    echo "Zero Coding Agent has been stopped successfully."
fi

echo ""
sleep 2
kill -9 $PPID 2>/dev/null || exit 0
