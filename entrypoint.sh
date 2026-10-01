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

# ── Cron interno de recordatorios (independiente de Hermes) ────────────────
# Cada instancia dispara SU PROPIO /api/reminders a las 9:00 y 12:00 (hora México):
# así ningún recordatorio depende de que el agente Hermes esté vivo.
cp /app/scripts/birthday-reminders-internal.sh /app/bd-reminder.sh
chmod +x /app/bd-reminder.sh
# crond corre como root y NO hereda el env de Coolify, así que inyectamos
# URL+secret INLINE en cada línea (escaped) en lugar de variables de entorno.
BD_URL="${BD_REMINDER_URL:-${NEXTAUTH_URL:-https://cumple.erikservicios.click}}/api/reminders"
BD_SECRET="${BD_REMINDER_SECRET:-${PUSH_WEBHOOK_SECRET:-}}"
# Escapar # y % para crontab (usa % como newline en COMMAND)
ESC_URL=$(printf '%s' "$BD_URL" | sed 's/%/\\%/g')
ESC_SEC=$(printf '%s' "$BD_SECRET" | sed 's/%/\\%/g')
crond -b -l 8
(
  echo "0 9  * * * BD_R_URL='$ESC_URL' BD_R_SECRET='$ESC_SEC' /app/bd-reminder.sh > /tmp/bd-cron.log 2>&1"
  echo "0 12 * * * BD_R_URL='$ESC_URL' BD_R_SECRET='$ESC_SEC' /app/bd-reminder.sh > /tmp/bd-cron.log 2>&1"
) | crontab -
echo "✅ Cron interno de recordatorios armado (9:00 y 12:00 hora México): $(crontab -l | grep -c bd-reminder) entradas"

exec su-exec nextjs node ./node_modules/next/dist/bin/next start 2>&1
