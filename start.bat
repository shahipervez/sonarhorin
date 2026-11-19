@echo off
REM সোনারহরিণ (Sonarhorin) — One-Click Start for Windows: Double-click this file!
REM Starts the Django API on :8000 and the website on http://127.0.0.1:5173/, then opens your browser.
REM   set NO_BROWSER=1 / set SETUP_ONLY=1 / set FORCE_INSTALL=1 before running to change behaviour.
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"
set "ROOT=%CD%"

REM ---------------------------------------------------------------- prerequisites
set "PY="
where py >nul 2>nul && py -3 -c "import sys; sys.exit(sys.version_info < (3, 11))" >nul 2>nul && set "PY=py -3"
if not defined PY (
  where python >nul 2>nul && python -c "import sys; sys.exit(sys.version_info < (3, 11))" >nul 2>nul && set "PY=python"
)
if not defined PY (
  echo Python 3.11+ is required - install from https://www.python.org/downloads/ ^(tick "Add python.exe to PATH"^)
  pause & exit /b 1
)
where npm >nul 2>nul || (echo Node.js 18+ is required - install from https://nodejs.org & pause & exit /b 1)

echo.
echo ==========================================================
echo [1/4] Setting up the Django backend...
echo ==========================================================
cd /d "%ROOT%\backend"
REM (re)create the venv if missing or broken
".venv\Scripts\python.exe" -c "import sys" >nul 2>nul
if errorlevel 1 (
  if exist .venv rmdir /s /q .venv
  %PY% -m venv .venv || (echo Could not create the virtualenv & pause & exit /b 1)
)
set "VPY=%ROOT%\backend\.venv\Scripts\python.exe"

REM reinstall requirements only when requirements.txt changed
for /f "skip=1 delims=" %%h in ('certutil -hashfile requirements.txt SHA1 ^| findstr /v ":"') do if not defined REQ_HASH set "REQ_HASH=%%h"
set "OLD_HASH="
if exist ".venv\requirements.sha1" set /p OLD_HASH=<".venv\requirements.sha1"
if defined FORCE_INSTALL set "OLD_HASH="
if not "%OLD_HASH%"=="%REQ_HASH%" (
  "%VPY%" -m pip install -q --upgrade pip >nul
  "%VPY%" -m pip install -q -r requirements.txt || (echo pip install failed & pause & exit /b 1)
  > ".venv\requirements.sha1" echo %REQ_HASH%
) else (
  echo    Python packages are up to date.
)

REM local dev settings (.env.example is a production template: DEBUG off + secret required)
if not exist .env (
  > .env echo # Local development settings - created by start.bat. Production values: see .env.example.
  >> .env echo DJANGO_DEBUG=True
  >> .env echo SITE_URL=http://127.0.0.1:5173
  >> .env echo EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
  echo    Created backend\.env for local development.
)

echo.
echo [2/4] Database migrations...
"%VPY%" manage.py migrate --noinput || (echo migrate failed & pause & exit /b 1)
"%VPY%" manage.py shell -c "import sys; from django.contrib.auth import get_user_model; sys.exit(0 if get_user_model().objects.exists() else 1)" >nul 2>nul
if errorlevel 1 (
  echo    Empty database - loading demo data...
  "%VPY%" manage.py seed_data
  "%VPY%" manage.py seed --demo-user
)

echo.
echo [3/4] Setting up the frontend...
cd /d "%ROOT%\frontend"
set "NEED_NPM="
if not exist node_modules set "NEED_NPM=1"
if defined FORCE_INSTALL set "NEED_NPM=1"
if defined NEED_NPM (
  call npm install --no-audit --no-fund || (echo npm install failed & pause & exit /b 1)
) else (
  echo    npm packages present ^(set FORCE_INSTALL=1 to reinstall^).
)

if defined SETUP_ONLY (echo Setup finished. & exit /b 0)

echo.
echo ==========================================================
echo [4/4] Starting the API on http://127.0.0.1:8000 ...
echo ==========================================================
netstat -ano | findstr /r /c:"127.0.0.1:8000 .*LISTENING" /c:"0.0.0.0:8000 .*LISTENING" >nul && (
  echo Port 8000 is already in use - close the other "Sonarhorin API Server" window first.
  pause & exit /b 1
)
start "Sonarhorin API Server" /d "%ROOT%\backend" cmd /k ""%VPY%" manage.py runserver 127.0.0.1:8000"
if not defined NO_BROWSER start "" cmd /c "timeout /t 6 >nul & start http://127.0.0.1:5173/"

echo.
echo ==========================================================
echo  Sonarhorin is LIVE!
echo  Website: http://127.0.0.1:5173/
echo  User Login: 01700000000 / demo1234
echo  Admin Login: admin@sonarhorin.com / admin1234
echo  Close this window (and the API window) to stop.
echo ==========================================================
call npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
pause
