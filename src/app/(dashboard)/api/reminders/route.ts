import { NextRequest, NextResponse } from 'next/server'
import { runReminders, computeReminders } from '@/lib/reminders'

/**
 * Endpoint disparado por un cron a las 9:00 AM y 12:00 PM.
 * Requiere ?secret=<PUSH_WEBHOOK_SECRET> para evitar usos no autorizados.
 * Detecta cumpleaños de HOY (alerta fuerte) y de MAÑANA (aviso), y envía
 * las notificaciones Web Push correspondientes.
 *
 * GET /api/reminders?secret=...
 */
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret') || ''
  const expected = process.env.PUSH_WEBHOOK_SECRET || ''

  if (!expected || secret !== expected) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const summary = await runReminders()
    return NextResponse.json({ ok: true, ...summary })
  } catch (error: any) {
    console.error('Error en recordatorios:', error?.message || error)
    // Faltan claves VAPID: responder 200 con aviso en vez de romper el cron
    if (error?.message?.includes?.('VAPID')) {
      const s = await computeReminders()
      s.sentToday = 0
      s.sentTomorrow = 0
      return NextResponse.json({ ok: false, error: 'VAPID keys missing', ...s }, { status: 200 })
    }
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 })
  }
}