#!/bin/bash
set -e

echo "🚀 AMC Dashboard — Quick Setup"
echo "================================"

# Check requirements
if ! command -v node &>/dev/null; then echo "❌ Node.js 22+ required"; exit 1; fi
if ! command -v npm &>/dev/null; then echo "❌ npm required"; exit 1; fi
if ! command -v psql &>/dev/null; then echo "⚠️  PostgreSQL CLI not found — make sure PostgreSQL is running"; fi

NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VER" -lt 18 ]; then echo "❌ Node.js 18+ required (found v$NODE_VER)"; exit 1; fi

echo "✅ Node.js $(node -v)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
  echo ""
  echo "📝 Creating .env.local from template..."
  cp .env.example .env.local

  # Generate secrets
  if command -v openssl &>/dev/null; then
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    JWT_SECRET=$(openssl rand -base64 32)
    CRON_SECRET=$(openssl rand -hex 20)
    sed -i.bak "s|your-super-secret-nextauth-secret-key-here|$NEXTAUTH_SECRET|" .env.local
    sed -i.bak "s|your-jwt-secret-key|$JWT_SECRET|" .env.local
    sed -i.bak "s|your-cron-secret-key|$CRON_SECRET|" .env.local
    rm -f .env.local.bak
    echo "✅ Secrets auto-generated"
  fi

  echo ""
  echo "⚙️  Please edit .env.local and set your DATABASE_URL, then re-run this script."
  echo "   Example: DATABASE_URL=postgresql://postgres:password@localhost:5432/amc_dashboard"
  exit 0
fi

# Source env
export $(grep -v '^#' .env.local | xargs 2>/dev/null) || true

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL not set in .env.local"
  exit 1
fi

# Create database if it doesn't exist
DB_NAME=$(echo "$DATABASE_URL" | sed 's/.*\///')
echo ""
echo "🗄️  Setting up database '$DB_NAME'..."
createdb "$DB_NAME" 2>/dev/null && echo "✅ Database created" || echo "   (Database already exists)"

# Generate Prisma client
echo ""
echo "⚙️  Generating Prisma client..."
npx prisma generate

# Run migrations
echo ""
echo "🔄 Running database migrations..."
npx prisma migrate dev --name init --skip-seed

# Run seed
echo ""
echo "🌱 Seeding database..."
npm run seed 2>/dev/null || npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts

echo ""
echo "================================"
echo "✅ Setup complete!"
echo ""
echo "📧 Login credentials:"
echo "   Email:    hello@formium.in"
echo "   Password: admin123"
echo ""
echo "🚀 Start dev server: npm run dev"
echo "   Then open: http://localhost:3000"
echo ""
echo "⚠️  Remember to change your password after first login!"
