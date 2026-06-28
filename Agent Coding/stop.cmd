:; goto() { :; }
goto windows_section

# Unix
cd "$(dirname "$0")/.."
./stop.cmd
exit 0

# Windows
:windows_section
@echo off
cd /d "%~dp0.."
call stop.cmd
