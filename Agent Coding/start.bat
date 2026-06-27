@echo off
title Zero Coding Agent - Launcher
cd /d "%~dp0"

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║     ⚡ Zero Coding Agent Launcher       ║
echo  ╚══════════════════════════════════════════╝
echo.

REM Check node
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo  ❌ Node.js not found. Please install Node.js.
    pause
    exit /b 1
)

REM Build frontend if dist doesn't exist
if not exist "frontend\dist\index.html" (
    echo  🔧 Building frontend...
    cd frontend
    call npx vite build --outDir dist
    if %errorlevel% neq 0 (
        echo  ❌ Frontend build failed.
        pause
        exit /b 1
    )
    cd ..
    echo  ✅ Frontend built successfully.
) else (
    echo  📦 Frontend dist already built.
)

REM Stop any previous instances
echo  🛑 Stopping any previous instances...
taskkill //F //IM node.exe //T >nul 2>nul
timeout /t 1 /nobreak >nul

REM Start backend (serves both API + frontend dist)
echo  🔧 Starting Backend (port 3747)...
start "ZeroCoding-Backend" cmd /c "cd /d "%~dp0backend" && node src/app.js"

REM Wait for backend
timeout /t 3 /nobreak >nul

echo.
echo  ✅ Zero Coding Agent is running!
echo  ─────────────────────────────────────────────
echo  🌐 Open: http://localhost:3747
echo  ─────────────────────────────────────────────
echo.
echo  Close this window or press any key to stop all servers.
pause >nul

echo  🛑 Stopping servers...
taskkill //F //FI "WINDOWTITLE eq ZeroCoding-Backend" >nul 2>nul
taskkill //F //IM node.exe //T >nul 2>nul
echo  ✅ All servers stopped.
timeout /t 2 /nobreak >nul
