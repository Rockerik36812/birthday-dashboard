#!/bin/sh
set -e

# Asegurar permisos del volumen (el vol se monta como root)
mkdir -p /app/data
chown -R nextjs:nodejs /app/data

echo "▶️  Inicializando base de datos (prisma db push)..."
su-exec nextjs node node_modules/prisma/build/index.js db push --schema prisma/schema.prisma --skip-generate 2>&1 || {
  echo "⚠️  db push falló, intentando con npx..."
  su-exec nextjs npx prisma db push --schema prisma/schema.prisma --skip-generate
}
echo "✅ Base de datos lista"

exec su-exec nextjs node server.js