#!/bin/bash
# ============================================================
#  Sonarhorin — Live Deployment Script
#  Run this once to deploy backend (Railway) + frontend (Vercel)
# ============================================================
set -e

FRONTEND_DIR="$(cd "$(dirname "$0")/frontend" && pwd)"
BACKEND_DIR="$(cd "$(dirname "$0")/backend" && pwd)"
NPXBIN="/Users/prom2chip/.local/bin/npx"

echo ""
echo "🦌 Sonarhorin Live Deployment"
echo "=============================="
echo ""

# ─── STEP 1: Deploy Backend to Railway ───────────────────────
echo "📦 STEP 1: Deploying backend to Railway..."
cd "$BACKEND_DIR"

# Check Railway login
if ! $NPXBIN @railway/cli@latest whoami &>/dev/null; then
  echo ""
  echo "⚠️  You are NOT logged into Railway."
  echo "    Opening browser for login..."
  $NPXBIN @railway/cli@latest login
fi

echo "🚂 Deploying Django backend to Railway..."
# Initialize Railway project if needed
if ! $NPXBIN @railway/cli@latest status &>/dev/null; then
  $NPXBIN @railway/cli@latest init --name sonarhorin-backend
fi

$NPXBIN @railway/cli@latest up --detach

# Get the Railway URL
echo "⏳ Waiting for Railway deployment..."
sleep 10
BACKEND_URL=$($NPXBIN @railway/cli@latest domain 2>/dev/null | grep https | head -1 | tr -d ' ')

if [ -z "$BACKEND_URL" ]; then
  echo ""
  echo "⚠️  Could not auto-detect backend URL."
  echo "    Go to https://railway.app → your project → Settings → Domains"
  echo "    Then paste the URL here:"
  read -p "Backend URL (e.g. https://sonarhorin-backend-production.up.railway.app): " BACKEND_URL
fi

echo "✅ Backend URL: $BACKEND_URL"

# ─── STEP 2: Build Frontend with real backend URL ─────────────
echo ""
echo "🏗️  STEP 2: Building frontend with backend URL..."
cd "$FRONTEND_DIR"

# Update .env.production
echo "VITE_API_URL=$BACKEND_URL" > .env.production
echo "VITE_APP_NAME=Sonarhorin" >> .env.production

# Build
$NPXBIN vite build

echo "✅ Frontend built!"

# ─── STEP 3: Deploy Frontend to Vercel ───────────────────────
echo ""
echo "🌐 STEP 3: Deploying frontend to Vercel..."

# Check Vercel login
if ! $NPXBIN vercel whoami &>/dev/null; then
  echo ""
  echo "⚠️  You are NOT logged into Vercel."
  echo "    Opening browser for login..."
  $NPXBIN vercel login
fi

# Deploy
VERCEL_OUTPUT=$($NPXBIN vercel deploy --prod --yes 2>&1)
FRONTEND_URL=$(echo "$VERCEL_OUTPUT" | grep -E "https://.*\.vercel\.app" | tail -1 | tr -d ' ')

echo ""
echo "=============================="
echo "🎉 DEPLOYMENT COMPLETE!"
echo "=============================="
echo ""
echo "🌐 Frontend (Vercel):  $FRONTEND_URL"
echo "🔧 Backend (Railway):  $BACKEND_URL"
echo ""
echo "Login credentials:"
echo "  Admin: admin@sonarhorin.com / admin12345"
echo "  User:  01812345678 / user12345"
echo ""
echo "Share this link with anyone: $FRONTEND_URL"
