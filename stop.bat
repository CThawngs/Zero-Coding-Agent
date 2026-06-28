@echo off
title Zero Coding Agent - Stopper
cd /d "%~dp0"

echo =============================================
echo   Stopping Zero Coding Agent...
echo =============================================
echo.

set FOUND=
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3747') do (
    echo Found process %%a running on port 3747. Stopping...
    taskkill /f /pid %%a >nul 2>&1
    set FOUND=1
)

if not defined FOUND (
    echo No process was found running on port 3747.
) else (
    echo Zero Coding Agent has been stopped successfully.
)

echo.
timeout /t 2 /nobreak >nul
exit /b 0
