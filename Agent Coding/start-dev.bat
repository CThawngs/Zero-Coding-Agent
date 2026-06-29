@echo off
title Zero Coding Agent - Dev Mode Launcher

echo =============================================
echo   Zero Coding Agent Dev Mode (Windows)
echo =============================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please download and install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

cd /d "%~dp0"

if not exist "Agent Coding\backend\node_modules" (
    echo Installing backend dependencies...
    cd "Agent Coding\backend"
    call npm install
    cd /d "%~dp0"
)

if not exist "Agent Coding\frontend\node_modules" (
    echo Installing frontend dependencies...
    cd "Agent Coding\frontend"
    call npm install --no-audit --no-fund
    cd /d "%~dp0"
)

echo.
echo Killing previous processes on ports 3747 and 5743...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3747') do (
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5743') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo Starting Backend (API) on http://localhost:3747 ...
start "Zero Coding Agent - Backend" cmd /k "cd /d "%~dp0Agent Coding\backend" && node src/app.js"

echo.
echo Starting Frontend (Vite Dev Server) on http://localhost:5743 ...
start "Zero Coding Agent - Frontend" cmd /k "cd /d "%~dp0Agent Coding\frontend" && node node_modules/vite/bin/vite.js --host 0.0.0.0 --port 5743"

echo.
echo Waiting for servers to start...
timeout /t 3 /nobreak >nul

echo.
echo =============================================
echo   Dev servers started!
echo =============================================
echo.
echo Backend API:  http://localhost:3747
echo Frontend UI:  http://localhost:5743   (OPEN THIS IN BROWSER)
echo.
echo Two console windows are now running:
echo   1. "Zero Coding Agent - Backend"  - API logs
echo   2. "Zero Coding Agent - Frontend" - Vite HMR logs
echo.
echo Press Ctrl+C in each window to stop servers.
echo.

pause