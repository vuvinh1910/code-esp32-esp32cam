@echo off
title Auto Watering Backend
echo Starting Backend (Spring Boot)...
cd auto-watering-backend
call mvn spring-boot:run
pause
