#!/bin/sh
set -e

echo "▶️  Inicializando base de datos (prisma db push)..."
node node_modules/prisma/build/index.js db push --schema prisma/schema.prisma --skip-generate 2>&1 || {
  echo "⚠️  db push falló, intentando con npx..."
  npx prisma db push --schema prisma/schema.prisma --skip-generate
}
echo "✅ Base de datos lista"

exec node server.js