import { NextRequest, NextResponse } from 'next/server'

/**
 * Devuelve la clave pública VAPID para que el navegador la use al suscribirse
 * a las notificaciones push. Es PÚBLICA por diseño (se incrusta en el endpoint
 * de suscripción del navegador). GET /api/push/vapid-key
 */
export async function GET(_req: NextRequest) {
  const publicKey = process.env.VAPID_PUBLIC_KEY
  if (!publicKey) {
    return NextResponse.json({ error: 'VAPID not configured' }, { status: 503 })
  }
  return NextResponse.json({ publicKey }, { status: 200 })
}