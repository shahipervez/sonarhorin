#!/bin/bash
# সোনারহরিণ (Sonarhorin) — One-Click Start for macOS & Linux
# Starts the Django API on :8000 and the Vite website on http://127.0.0.1:5173/, then opens your browser.
cd "$(dirname "$0")" || exit 1
ROOT="$(pwd)"
say() { printf "\n\033[1;33m▶ %s\033[0m\n" "$1"; }

PY=""; for c in python3.13 python3.12 python3.11 python3; do command -v $c >/dev/null 2>&1 && { PY=$c; break; }; done
[ -z "$PY" ] && { echo "Python 3.11+ is required — install from https://www.python.org/downloads/ and try again."; read -r -p "Press Enter to close"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "Node.js 18+ is required — install from https://nodejs.org and try again."; read -r -p "Press Enter to close"; exit 1; }

say "1/3. Setting up the Django Backend…"
cd "$ROOT/backend" || exit 1
[ -d .venv ] || "$PY" -m venv .venv
# shellcheck disable=SC1091
source .venv/bin/activate
python -m pip install -q --upgrade pip >/dev/null
python -m pip install -q -r requirements.txt || { echo "pip install failed"; read -r -p "Press Enter to close"; exit 1; }
[ -f .env ] || cp .env.example .env
python manage.py migrate --noinput
[ -f db.sqlite3 ] || python manage.py seed --demo-user

say "2/3. Starting the Backend API on http://127.0.0.1:8000 …"
python manage.py runserver 127.0.0.1:8000 &
BACK=$!
trap 'kill $BACK 2>/dev/null' EXIT INT TERM

say "3/3. Setting up the Frontend Website…"
cd "$ROOT/frontend" || exit 1
[ -d node_modules ] || npm install --no-audit --no-fund

( sleep 4; URL="http://127.0.0.1:5173/"; (command -v open >/dev/null && open "$URL") || (command -v xdg-open >/dev/null && xdg-open "$URL") ) >/dev/null 2>&1 &
say "=========================================================="
say "🎉 Sonarhorin is LIVE!"
say "🌐 Website: http://127.0.0.1:5173/"
say "🔑 User Login: 01700000000 / demo1234"
say "⚡ Admin Login: admin@sonarhorin.com / admin1234"
say "⏹️ To stop: Press Ctrl + C"
say "=========================================================="
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
