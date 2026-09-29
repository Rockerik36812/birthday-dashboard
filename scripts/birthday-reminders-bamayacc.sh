#!/bin/bash
# Dispara el recordatorio de cumpleaños del Birthday Dashboard - COOLIFY BAMAYACC.
URL="https://cumple.bamayacc.cloud/api/reminders"
SECRET="bd-push-bamayacc-2026"

CODE=$(curl -s -o /tmp/bd-reminders-bamayacc-out.txt -w "%{http_code}" -m 30 "$URL?secret=$SECRET")
BODY=$(cat /tmp/bd-reminders-bamayacc-out.txt 2>/dev/null)

echo "[birthday-reminders-bamayacc] $(date '+%Y-%m-%d %H:%M') HTTP $CODE :: $BODY"