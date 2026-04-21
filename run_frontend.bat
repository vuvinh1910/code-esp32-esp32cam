@echo off
title Auto Watering Frontend
echo Starting Frontend (React/Vite)...
cd frontend
echo Checking and installing missing dependencies...
call npm install
call npm run dev
pause
