#!/bin/sh
# Recordatorio interno del Birthday Dashboard.
# Dispara su propio endpoint /api/reminders sin depender de Hermes.
# La hora la define crond (TZ=America/Mexico_City).
# La URL y el secret se inyectan INLINE por entrypoint.sh (crond no hereda env de Coolify),
# con fallback a variables de entorno por si se ejecuta manualmente.
URL="${BD_R_URL:-${BD_REMINDER_URL:-${NEXTAUTH_URL:-http://localhost:3000}/api/reminders}}"
SECRET="${BD_R_SECRET:-${BD_REMINDER_SECRET:-${PUSH_WEBHOOK_SECRET:-}}}"

CODE=$(curl -s -o /tmp/bd-reminders-out.txt -w "%{http_code}" -m 30 "$URL?secret=$SECRET")
BODY=$(cat /tmp/bd-reminders-out.txt 2>/dev/null)

echo "[birthday-reminders] $(date '+%Y-%m-%d %H:%M %Z') HTTP $CODE :: $BODY"