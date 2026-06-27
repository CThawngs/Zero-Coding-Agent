@echo off
title Zero Coding Agent - Startup Script
echo Starting Zero Coding Agent...
cd /d "%~dp0"

:: Check if Node is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please download and install Node.js from https://nodejs.org/ before running this.
    pause
    exit /b 1
)

:: Check if backend node_modules is installed
if not exist "antigravity-web\backend\node_modules" (
    echo Installing backend dependencies, please wait...
    cd "antigravity-web\backend"
    call npm install
    cd /d "%~dp0"
)

:: Check if frontend node_modules is installed
if not exist "antigravity-web\frontend\node_modules" (
    echo Installing frontend dependencies, please wait...
    cd "antigravity-web\frontend"
    call npm install --no-audit --no-fund
    cd /d "%~dp0"
)

echo Starting backend server on http://localhost:3747...
cd "antigravity-web\backend"

:: Open browser
start "" http://localhost:3747

:: Start node app
node src/app.js
