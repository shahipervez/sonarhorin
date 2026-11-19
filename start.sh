#!/usr/bin/env bash
# সোনারহরিণ (Sonarhorin) — One-Click Start for macOS & Linux
# Starts the Django API on :8000 and the Vite website on http://127.0.0.1:5173/, then opens your browser.
#
#   ./start.sh                 # set up whatever is missing, then run both servers
#   NO_BROWSER=1 ./start.sh    # don't open a browser tab
#   SETUP_ONLY=1 ./start.sh    # install + migrate + seed, then exit (CI / first-time setup)
#   FORCE_INSTALL=1 ./start.sh # reinstall Python + npm dependencies
set -o pipefail
cd "$(dirname "$0")" || exit 1
ROOT="$(pwd)"
API_PORT="${API_PORT:-8000}"
WEB_PORT="${WEB_PORT:-5173}"

say()  { printf "\n\033[1;33m▶ %s\033[0m\n" "$1"; }
die()  { printf "\n\033[1;31m✖ %s\033[0m\n" "$1"; [ -t 0 ] && read -r -p "Press Enter to close"; exit 1; }
hash_of() { (command -v sha1sum >/dev/null && sha1sum "$1" || shasum "$1") | cut -d' ' -f1; }
port_busy() { (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null; }

# ---------------------------------------------------------------- prerequisites
PY=""
for c in python3.13 python3.12 python3.11 python3 python; do
  if command -v "$c" >/dev/null 2>&1 && "$c" -c 'import sys; sys.exit(sys.version_info < (3, 11))' 2>/dev/null; then PY=$c; break; fi
done
[ -z "$PY" ] && die "Python 3.11+ is required — install from https://www.python.org/downloads/ and try again."
command -v npm >/dev/null 2>&1 || die "Node.js 18+ is required — install from https://nodejs.org and try again."
node -e 'process.exit(Number(process.versions.node.split(".")[0]) < 18 ? 1 : 0)' || die "Node.js 18+ is required (found $(node -v))."

# ---------------------------------------------------------------- backend
say "1/4. Setting up the Django backend ($($PY --version))…"
cd "$ROOT/backend" || exit 1
# (re)create the venv if it is missing or broken (e.g. copied from another machine)
if ! .venv/bin/python -c 'import sys' >/dev/null 2>&1; then
  rm -rf .venv
  "$PY" -m venv .venv || die "Could not create a virtualenv (on Debian/Ubuntu: sudo apt install python3-venv)."
fi
VPY="$ROOT/backend/.venv/bin/python"

# install requirements only when requirements.txt changed since the last successful install
STAMP=".venv/.requirements.sha1"
REQ_HASH="$(hash_of requirements.txt)"
if [ -n "$FORCE_INSTALL" ] || [ ! -f "$STAMP" ] || [ "$(cat "$STAMP")" != "$REQ_HASH" ]; then
  "$VPY" -m pip install -q --upgrade pip >/dev/null
  "$VPY" -m pip install -q -r requirements.txt || die "pip install failed (see the error above)."
  echo "$REQ_HASH" > "$STAMP"
else
  echo "   Python packages are up to date."
fi

# local dev settings (the .env.example is a *production* template: DEBUG off + secret required)
if [ ! -f .env ]; then
  cat > .env <<'EOF'
# Local development settings — created by start.sh. Production values: see .env.example.
DJANGO_DEBUG=True
SITE_URL=http://127.0.0.1:5173
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
# Background job scraper thread inside runserver (on by default in DEBUG). Set false to disable.
# ENABLE_INPROCESS_SCHEDULER=true
EOF
  echo "   Created backend/.env for local development."
fi

say "2/4. Database migrations…"
"$VPY" manage.py migrate --noinput || die "migrate failed."
if ! "$VPY" manage.py shell -c "import sys; from django.contrib.auth import get_user_model; sys.exit(0 if get_user_model().objects.exists() else 1)" >/dev/null 2>&1; then
  say "   Empty database — loading demo data…"
  "$VPY" manage.py seed_data || echo "   (seed_data fixture not loaded — continuing)"
  "$VPY" manage.py seed --demo-user || echo "   (seed failed — continuing)"
fi

# ---------------------------------------------------------------- frontend deps
say "3/4. Setting up the frontend…"
cd "$ROOT/frontend" || exit 1
if [ -n "$FORCE_INSTALL" ] || [ ! -d node_modules ] || [ package-lock.json -nt node_modules/.package-lock.json ]; then
  npm install --no-audit --no-fund || die "npm install failed."
else
  echo "   npm packages are up to date."
fi

[ -n "$SETUP_ONLY" ] && { say "Setup finished (SETUP_ONLY) ✔"; exit 0; }

# ---------------------------------------------------------------- run
port_busy "$API_PORT" && die "Port $API_PORT is already in use — stop the other server (or run API_PORT=8001 ./start.sh; the Vite proxy expects 8000)."
port_busy "$WEB_PORT" && die "Port $WEB_PORT is already in use — close the other Vite window or run WEB_PORT=5174 ./start.sh."

say "4/4. Starting the API on http://127.0.0.1:$API_PORT and the website on http://127.0.0.1:$WEB_PORT …"
( cd "$ROOT/backend" && exec "$VPY" manage.py runserver "127.0.0.1:$API_PORT" ) &
BACK=$!
trap 'kill $BACK 2>/dev/null; wait $BACK 2>/dev/null' EXIT INT TERM

URL="http://127.0.0.1:$WEB_PORT/"
if [ -z "$NO_BROWSER" ]; then
  ( for _ in $(seq 1 30); do port_busy "$WEB_PORT" && break; sleep 1; done
    (command -v open >/dev/null && open "$URL") || (command -v xdg-open >/dev/null && xdg-open "$URL") ) >/dev/null 2>&1 &
fi
printf "\n\033[1;32m==========================================================\n"
printf " 🎉 Sonarhorin is LIVE!\n 🌐 Website: %s\n 🔑 User Login: 01700000000 / demo1234\n" "$URL"
printf " ⚡ Admin Login: admin@sonarhorin.com / admin1234\n ⏹️  To stop: press Ctrl + C\n"
printf "==========================================================\033[0m\n"
npm run dev -- --host 127.0.0.1 --port "$WEB_PORT" --strictPort
