@echo off
REM সোনারহরিণ (Sonarhorin) — One-Click Start for Windows: Double-click this file!
REM Starts the Django API on :8000 and the website on http://127.0.0.1:5173/, then opens your browser.
chcp 65001 >nul
cd /d "%~dp0"
where python >nul 2>nul || (echo Python 3.11+ is required - install from https://www.python.org/downloads/ ^(make sure to tick "Add python.exe to PATH"^) & pause & exit /b 1)
where npm >nul 2>nul || (echo Node.js 18+ is required - install from https://nodejs.org & pause & exit /b 1)

echo.
echo ==========================================================
echo [1/3] Setting up the Django Backend...
echo ==========================================================
cd backend
if not exist .venv python -m venv .venv
call .venv\Scripts\activate.bat
python -m pip install -q --upgrade pip >nul
python -m pip install -q -r requirements.txt || (echo pip install failed & pause & exit /b 1)
if not exist .env copy .env.example .env >nul
python manage.py migrate --noinput
if not exist db.sqlite3 python manage.py seed --demo-user

echo.
echo ==========================================================
echo [2/3] Starting the Backend API on http://127.0.0.1:8000 ...
echo ==========================================================
start "Sonarhorin API Server" cmd /k ".venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000"

echo.
echo ==========================================================
echo [3/3] Setting up and starting the Website...
echo ==========================================================
cd ..\frontend
if not exist node_modules call npm install --no-audit --no-fund
start "" cmd /c "timeout /t 5 >nul & start http://127.0.0.1:5173/"

echo.
echo ==========================================================
echo 🎉 Sonarhorin is LIVE!
echo 🌐 Website: http://127.0.0.1:5173/
echo 🔑 User Login: 01700000000 / demo1234
echo ⚡ Admin Login: admin@sonarhorin.com / admin1234
echo Close this window to stop the frontend.
echo ==========================================================
call npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
pause
