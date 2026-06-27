@echo off
title Zero Coding Agent - Stopper

echo  🛑 Stopping Zero Coding Agent...
echo.

REM Kill all node processes related to our app
taskkill //F //FI "WINDOWTITLE eq ZeroCoding-Backend" >nul 2>nul
taskkill //F //IM node.exe //T >nul 2>nul

echo  ✅ All servers stopped.
echo.

timeout /t 3 /nobreak >nul
exit /b 0
