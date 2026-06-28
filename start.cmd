:; goto() { :; }
goto windows_section

# =============================================
#   Unix (macOS / Linux / Ubuntu) Section
# =============================================
cd "$(dirname "$0")"

echo "============================================="
echo "  Zero Coding Agent Launcher (Unix)"
echo "============================================="
echo ""

if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed. Please install Node.js before running this script."
    exit 1
fi

if [ ! -d "Agent Coding/backend/node_modules" ]; then
    echo "Installing backend dependencies, please wait..."
    cd "Agent Coding/backend"
    npm install
    cd ../..
fi

if [ ! -d "Agent Coding/frontend/node_modules" ]; then
    echo "Installing frontend dependencies, please wait..."
    cd "Agent Coding/frontend"
    npm install --no-audit --no-fund
    cd ../..
fi

if [ ! -f "Agent Coding/backend/public/index.html" ]; then
    echo "Building frontend..."
    cd "Agent Coding/frontend"
    npm run build
    cd ../..
    mkdir -p "Agent Coding/backend/public"
    cp -r Agent Coding/frontend/dist/* Agent Coding/backend/public/
fi

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

cd "Agent Coding/backend"
nohup node src/app.js > /dev/null 2>&1 &
disown
cd ../..

sleep 2

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

# =============================================
#   Windows Section
# =============================================
:windows_section
@echo off
title Zero Coding Agent - Launcher

echo =============================================
echo   Zero Coding Agent Launcher (Windows)
echo =============================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please download and install Node.js from https://nodejs.org/ before running this.
    pause
    exit /b 1
)

cd /d "%~dp0"

if not exist "Agent Coding\backend\node_modules" (
    echo Installing backend dependencies, please wait...
    cd "Agent Coding\backend"
    call npm install
    cd /d "%~dp0"
)

if not exist "Agent Coding\frontend\node_modules" (
    echo Installing frontend dependencies, please wait...
    cd "Agent Coding\frontend"
    call npm install --no-audit --no-fund
    cd /d "%~dp0"
)

if not exist "Agent Coding\backend\public\index.html" (
    echo Building frontend...
    cd "Agent Coding\frontend"
    call npm run build
    cd /d "%~dp0"
    xcopy /E /Y /I "Agent Coding\frontend\dist\*" "Agent Coding\backend\public" >nul
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3747') do (
    echo Stopping previous process on port 3747 with PID %%a...
    taskkill /f /pid %%a >nul 2>&1
)

echo Starting Zero Coding Agent in the background...
echo URL: http://localhost:3747
echo.

powershell -NoProfile -Command "Start-Process node -ArgumentList 'src/app.js' -WorkingDirectory '%~dp0Agent Coding\backend' -WindowStyle Hidden"

timeout /t 2 /nobreak >nul

start "" http://localhost:3747

echo Launcher completed successfully. Closing terminal...
timeout /t 1 /nobreak >nul
exit /b 0
