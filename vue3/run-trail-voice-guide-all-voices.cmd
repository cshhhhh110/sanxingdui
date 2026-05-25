@echo off
setlocal

set SCRIPT_DIR=%~dp0
set PS_SCRIPT=%SCRIPT_DIR%scripts\run-trail-voice-guide-all-voices.ps1

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%PS_SCRIPT%" -DelaySeconds 60 -BatchLimit 999 -Voices "default,zh_female,sweet"

echo.
echo Finished. If the window closes too quickly, run this file from a terminal to see the log path.
pause
