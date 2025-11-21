@echo off
title Veterinary App Launcher
color 0A

:: Move to the directory where this batch file is located
cd /d "%~dp0"

echo 🚀 Starting Veterinary Medicine App...
echo 📂 Working Directory: %CD%

:: Start the server
:: We use "call" to ensure it executes properly, or "start" to open in new window
:: If you don't have a package.json "start" script, change 'npm start' to 'node server.js'
start "Veterinary Server" npm start

:: Wait 3 seconds for the server to boot up
timeout /t 3 >nul

:: Open the browser
echo 🌐 Opening application...
start http://localhost:7000

echo ✅ App launched! 
echo ℹ️  Don't close the server window that just opened.
echo.
pause