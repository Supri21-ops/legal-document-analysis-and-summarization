@echo off
title LegalAI - Backend Server (FastAPI)
echo ====================================================
echo           LegalAI Backend (FastAPI)
echo ====================================================
cd /d "%~dp0backend"

if not exist "venv\Scripts\python.exe" (
    echo [ERROR] Virtual environment not found. Creating one...
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install fastapi "uvicorn[standard]" pydantic pydantic-settings sqlalchemy python-multipart "python-jose[cryptography]" "passlib[bcrypt]" aiofiles httpx python-dotenv pymupdf python-docx scikit-learn numpy web3 anthropic
    python setup_db.py
)

call venv\Scripts\activate.bat
echo Starting FastAPI on http://127.0.0.1:8000 ...
echo API Docs: http://127.0.0.1:8000/docs
echo.
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
pause
