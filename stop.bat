@echo off
title Zero Coding Agent - Stop Script
echo Stopping Zero Coding Agent backend server on port 3747...
cd /d "%~dp0"

set "FOUND="
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3747') do (
    echo Found process %%a running on port 3747. Stopping...
    taskkill /f /pid %%a >nul 2>&1
    set FOUND=1
)

if not defined FOUND (
    echo No process was found running on port 3747. It might be already stopped.
) else (
    echo Zero Coding Agent has been stopped successfully.
)

pause
