@echo off
title Zero Coding Agent - Launcher

echo =============================================
echo   Zero Coding Agent Launcher
echo =============================================
echo.

REM Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please download and install Node.js from https://nodejs.org/ before running this.
    pause
    exit /b 1
)

cd /d "%~dp0"

REM Install backend dependencies if missing
if not exist "Agent Coding\backend\node_modules" (
    echo Installing backend dependencies, please wait...
    cd "Agent Coding\backend"
    call npm install
    cd /d "%~dp0"
)

REM Install frontend dependencies if missing
if not exist "Agent Coding\frontend\node_modules" (
    echo Installing frontend dependencies, please wait...
    cd "Agent Coding\frontend"
    call npm install --no-audit --no-fund
    cd /d "%~dp0"
)

REM Build frontend if dist doesn't exist or public is empty
if not exist "Agent Coding\backend\public\index.html" (
    echo Building frontend...
    cd "Agent Coding\frontend"
    call npm run build
    cd /d "%~dp0"
    xcopy /E /Y /I "Agent Coding\frontend\dist\*" "Agent Coding\backend\public" >nul
)

REM Check for running process on port 3747 and stop it first
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3747') do (
    echo Stopping previous process on port 3747 with PID %%a...
    taskkill /f /pid %%a >nul 2>&1
)

echo Starting Zero Coding Agent in the background...
echo URL: http://localhost:3747
echo.

REM Start backend app in background (hidden window)
powershell -NoProfile -Command "Start-Process node -ArgumentList 'src/app.js' -WorkingDirectory '%~dp0Agent Coding\backend' -WindowStyle Hidden"

REM Wait for server to start
timeout /t 2 /nobreak >nul

REM Open browser
start "" http://localhost:3747

echo Launcher completed successfully. Closing terminal...
timeout /t 1 /nobreak >nul
exit /b 0
