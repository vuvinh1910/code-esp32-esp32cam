@echo off
title Auto Watering System - Launcher
echo ===================================================
echo        STARTING AUTO WATERING SYSTEM
echo ===================================================
echo.
echo Launching Backend...
start run_backend.bat

echo Launching Frontend...
start run_frontend.bat

echo.
echo Both services are starting in separate windows!
echo - Backend will run on http://localhost:8080
echo - Frontend will run on http://localhost:5173
echo.
pause
