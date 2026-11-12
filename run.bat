@echo off
title LegalAI - Complete Setup and Launcher
color 0A
echo.
echo ====================================================
echo     LegalAI - Intelligent Contract Analyzer
echo     Full Stack Setup + Launch Script
echo ====================================================
echo.

cd /d "%~dp0"

:: ===== BACKEND SETUP =====
echo [BACKEND] Checking Python environment...
cd backend

if not exist "venv\Scripts\python.exe" (
    echo [BACKEND] Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment. Make sure Python 3.10+ is installed.
        pause
        exit /b 1
    )
    echo [BACKEND] Installing dependencies...
    venv\Scripts\pip.exe install -r requirements.txt
)

echo [BACKEND] Initializing database and demo credentials...
venv\Scripts\python.exe setup_db.py

cd ..

:: ===== FRONTEND SETUP =====
echo.
echo [FRONTEND] Checking Node.js packages...
cd frontend

if not exist "node_modules" (
    echo [FRONTEND] Installing npm packages (this may take 2-3 minutes)...
    call npm install
)

cd ..

:: ===== START BOTH SERVERS =====
echo.
echo ====================================================
echo  Starting Backend API on http://localhost:8000
echo  Starting Frontend UI on http://localhost:4200
echo ====================================================
echo.

start "LegalAI Backend (FastAPI)" cmd /k "cd /d "%~dp0backend" && venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 3 /nobreak >nul

start "LegalAI Frontend (Angular)" cmd /k "cd /d "%~dp0frontend" && npx ng serve --port 4200 --open"

echo.
echo Both servers are starting!
echo Backend Swagger API: http://localhost:8000/docs
echo Frontend Application: http://localhost:4200
echo.
echo Demo Login: demo@legalai.com / password123
echo.
echo Optional: To enable live Ethereum testnet, run start-blockchain.bat
echo Keep the server terminal windows open while testing.
echo.
pause
