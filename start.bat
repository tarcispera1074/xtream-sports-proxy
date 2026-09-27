@echo off
title Xtream Sports Hub Proxy
cd /d "%~dp0"
echo Starting Xtream Sports Proxy on port 5055...
"C:\Program Files\nodejs\node.exe" server.js
pause
