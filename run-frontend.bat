@echo off
title LegalAI - Frontend (Angular)
echo ====================================================
echo           LegalAI Frontend (Angular 17)
echo ====================================================
cd /d "%~dp0frontend"

if not exist "node_modules" (
    echo [INFO] node_modules not found. Installing packages...
    call npm install
)

echo Starting Angular Development Server...
echo Web UI will be available at: http://localhost:4200
echo.
call npm start
pause
