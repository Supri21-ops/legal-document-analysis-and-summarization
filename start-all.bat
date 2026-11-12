@echo off
title LegalAI - Full Stack Launcher
echo ====================================================
echo        LegalAI - Starting Full Stack System
echo ====================================================
echo.

echo [1/2] Launching Backend Server (port 8000)...
start "LegalAI Backend" cmd /k "cd /d "%~dp0backend" && venv\Scripts\activate.bat && python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

timeout /t 3 /nobreak >nul

echo [2/2] Launching Frontend Server (port 4200)...
start "LegalAI Frontend" cmd /k "cd /d "%~dp0frontend" && npm start"

echo.
echo ====================================================
echo  Servers are starting up!
echo ====================================================
echo  - Frontend UI : http://localhost:4200
echo  - Backend API : http://localhost:8000
echo  - API Docs    : http://localhost:8000/docs
echo ====================================================
echo.
echo Opening browser in 10 seconds...
timeout /t 10 /nobreak >nul
start http://localhost:8000/docs
start http://localhost:4200
