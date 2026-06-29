@echo off
setlocal enabledelayedexpansion

set "SCRIPT_DIR=%~dp0"
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"
set "PROJECT_DIR=%SCRIPT_DIR%"
set "BACKEND_DIR=%PROJECT_DIR%\Agent Coding\backend"
set "FRONTEND_DIR=%PROJECT_DIR%\Agent Coding\frontend"

title Zero Coding Agent - Launcher
color 0A
echo.
echo  ============================================
echo    Zero Coding Agent Launcher (Windows)
echo  ============================================
echo.

:: ---------- Node.js check ----------
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js is not installed.
    echo    Download: https://nodejs.org/
    pause
    exit /b 1
)

:: ---------- Install deps if missing ----------
if not exist "%BACKEND_DIR%\node_modules" (
    echo  [1/3] Installing backend dependencies...
    cd /d "%BACKEND_DIR%"
    call npm install --no-audit --no-fund
    cd /d "%PROJECT_DIR%"
)

if not exist "%FRONTEND_DIR%\node_modules" (
    echo  [2/3] Installing frontend dependencies...
    cd /d "%FRONTEND_DIR%"
    call npm install --no-audit --no-fund
    cd /d "%PROJECT_DIR%"
)

echo  [3/3] Starting servers...
echo.

:: ---------- Kill old processes on ports ----------
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3747 ^| findstr LISTENING 2^>nul') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5743 ^| findstr LISTENING 2^>nul') do taskkill /f /pid %%a >nul 2>&1

:: ---------- Start backend (detached, hidden) ----------
powershell -WindowStyle Hidden -Command "Start-Process cmd -ArgumentList '/c cd /d \"!BACKEND_DIR!\" ^& node src\app.js' -WindowStyle Hidden"

:: ---------- Start frontend (detached, hidden) ----------
powershell -WindowStyle Hidden -Command "Start-Process cmd -ArgumentList '/c cd /d \"!FRONTEND_DIR!\" ^& node node_modules\vite\bin\vite.js --host 0.0.0.0 --port 5743' -WindowStyle Hidden"

:: ---------- Wait for servers ----------
echo   Waiting for servers to be ready...
set "READY=0"
for /l %%i in (1,1,30) do (
    curl -sf "http://localhost:3747/health" >nul 2>&1
    if !errorlevel! equ 0 (
        curl -sf "http://localhost:5743" >nul 2>&1
        if !errorlevel! equ 0 set "READY=1"
    )
    if !READY! equ 1 goto :ready
    timeout /t 1 /nobreak >nul
)

echo.
echo  [ERROR] Servers did not start within 30 seconds.
echo  Check if ports 3747 or 5743 are in use.
pause
exit /b 1

:ready
echo.
echo   Servers are ready!
echo     Backend : http://localhost:3747
echo     Frontend: http://localhost:5743
echo.

:: ---------- Open browser ----------
start "" "http://localhost:5743"

echo   Launcher done. Servers are running in background.
echo   You can close this window safely.
timeout /t 2 /nobreak >nul
exit /b 0
