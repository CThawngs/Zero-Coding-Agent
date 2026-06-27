@echo off
echo.
echo  ⚡ Starting Antigravity Web...
echo  ─────────────────────────────
echo.

REM Check if node is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo  ❌ Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)

REM Start backend in new terminal window
echo  🔧 Starting Backend (port 3747)...
start "Antigravity Backend" cmd /k "cd /d "%~dp0backend" && node src/app.js"

REM Wait 2 seconds for backend to start
timeout /t 2 /nobreak >nul

REM Start frontend in new terminal window
echo  🎨 Starting Frontend (port 5743)...
start "Antigravity Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

REM Wait for frontend to start
timeout /t 3 /nobreak >nul

echo.
echo  ✅ Antigravity Web is starting!
echo  ─────────────────────────────────────────────
echo  Frontend: http://localhost:5743
echo  Backend:  http://localhost:3747
echo  ─────────────────────────────────────────────
echo.

REM Open browser
start http://localhost:5743

echo  Servers are running in separate windows.
echo  Close those windows to stop the servers.
echo.
pause
