#!/bin/bash
# Dispara el recordatorio de cumpleaños del Birthday Dashboard.
# Endpoint de producción (o el que se pase por BD_REMINDER_URL).
URL="${BD_REMINDER_URL:-https://cumple.erikservicios.click/api/reminders}"
SECRET="${BD_REMINDER_SECRET:-BD-push-secret-2026}"

CODE=$(curl -s -o /tmp/bd-reminders-out.txt -w "%{http_code}" -m 30 "$URL?secret=$SECRET")
BODY=$(cat /tmp/bd-reminders-out.txt 2>/dev/null)

echo "[birthday-reminders] $(date '+%Y-%m-%d %H:%M') HTTP $CODE :: $BODY"