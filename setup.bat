@echo off
echo ============================================
echo  LegalAI - Setup Script (Windows)
echo ============================================

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python 3.11+ is required. Download from python.org
    pause
    exit /b 1
)
echo [OK] Python found

:: Check Node
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js 18+ is required. Download from nodejs.org
    pause
    exit /b 1
)
echo [OK] Node.js found

:: Check PostgreSQL
psql --version >nul 2>&1
if errorlevel 1 (
    echo [WARNING] PostgreSQL not found in PATH. Make sure it's installed and running.
) else (
    echo [OK] PostgreSQL found
)

echo.
echo === Setting up Backend ===
cd backend

:: Create virtual environment
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

:: Activate and install
call venv\Scripts\activate.bat
echo Installing Python dependencies (this may take 5-10 minutes)...
pip install -r requirements.txt

:: Download spaCy model
echo Downloading spaCy English model...
python -m spacy download en_core_web_lg

:: Copy .env if not exists
if not exist .env (
    copy .env.example .env
    echo [ACTION REQUIRED] Edit backend\.env with your settings!
)

echo.
echo === Setting up Database ===
echo Creating database tables...
python setup_db.py

cd ..

echo.
echo === Setting up Frontend ===
cd frontend
echo Installing Node.js dependencies...
npm install
cd ..

echo.
echo === Installing Ganache ===
npm install -g ganache 2>nul
if errorlevel 1 (
    echo [WARNING] Could not install Ganache globally. Try: npm install -g ganache
) else (
    echo [OK] Ganache installed
)

echo.
echo ============================================
echo  Setup Complete!
echo ============================================
echo.
echo NEXT STEPS:
echo.
echo 1. Edit backend\.env and set your API keys:
echo    - ANTHROPIC_API_KEY=your_claude_api_key
echo    - DATABASE_URL=postgresql://postgres:password@localhost:5432/legal_db
echo.
echo 2. Create the PostgreSQL database:
echo    psql -U postgres -c "CREATE DATABASE legal_db;"
echo.
echo 3. Start all services (open 3 terminal windows):
echo.
echo    Terminal 1 (Database): Already running via PostgreSQL service
echo.
echo    Terminal 2 (Blockchain):
echo      ganache --port 8545 --deterministic
echo.
echo    Terminal 3 (Backend):
echo      cd backend
echo      venv\Scripts\activate
echo      uvicorn app.main:app --reload --port 8000
echo.
echo    Terminal 4 (Frontend):
echo      cd frontend
echo      npm start
echo.
echo 4. Deploy smart contract (once Ganache is running):
echo    cd backend
echo    venv\Scripts\activate
echo    python contracts\deploy.py
echo.
echo 5. Open your browser: http://localhost:4200
echo.
pause
