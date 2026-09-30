#!/bin/sh
set -e

# Asegurar permisos del volumen (el vol se monta como root)
mkdir -p /app/data /app/data/uploads
chown -R nextjs:nodejs /app/data

# Inyectar valores por defecto si no están en el entorno de Coolify
export NODE_ENV="${NODE_ENV:-production}"
export DATABASE_URL="${DATABASE_URL:-file:/app/data/prod.db}"
export NEXTAUTH_URL="${NEXTAUTH_URL:-https://cumple.erikservicios.click}"
export NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-your-secret-change-in-production-min-32-chars-dont-use-in-prod}"

echo "▶️  Inicializando base de datos (prisma db push)..."
su-exec nextjs node node_modules/prisma/build/index.js db push --schema prisma/schema.prisma --skip-generate --accept-data-loss 2>&1 || {
  echo "⚠️  db push falló, intentando con npx..."
  su-exec nextjs npx prisma db push --schema prisma/schema.prisma --skip-generate --accept-data-loss
}
echo "✅ Base de datos lista"

# Reasegurar permisos: prisma db push puede recrear prod.db como 'node' (uid 1000),
# y la app corre como 'nextjs' (uid 1001), lo que dejaba la BD en solo lectura (500).
chown -R nextjs:nodejs /app/data

exec su-exec nextjs node ./node_modules/next/dist/bin/next start 2>&1
