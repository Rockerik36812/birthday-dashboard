import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Registra una suscripción push del navegador (para recibir recordatorios).
 *
 * POST /api/push/register
 * body: { endpoint, keys: { p256dh, auth }, label? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const endpoint = body?.endpoint
    const p256dh = body?.keys?.p256dh
    const auth = body?.keys?.auth

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    const prev = await prisma.pushSubscription.findUnique({ where: { endpoint } })
    if (prev) {
      const updated = await prisma.pushSubscription.update({
        where: { id: prev.id },
        data: { p256dh, auth, userAgent: body.userAgent, label: body.label || prev.label },
      })
      return NextResponse.json({ ok: true, id: updated.id, update: true })
    }

    const created = await prisma.pushSubscription.create({
      data: {
        endpoint,
        p256dh,
        auth,
        userAgent: body.userAgent,
        label: body.label,
      },
    })

    return NextResponse.json({ ok: true, id: created.id, update: false }, { status: 201 })
  } catch (error) {
    console.error('Error registrando suscripción:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

/**
 * Probador del endpoint para verificar conectividad sin body.
 * DELETE /api/push/register?endpoint=<endpoint>  → elimina una suscripción.
 */
export async function DELETE(request: NextRequest) {
  try {
    const endpoint = request.nextUrl.searchParams.get('endpoint')
    if (!endpoint) {
      return NextResponse.json({ error: 'endpoint requerido' }, { status: 400 })
    }
    const prev = await prisma.pushSubscription.findUnique({ where: { endpoint } })
    if (prev) {
      await prisma.pushSubscription.delete({ where: { id: prev.id } })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error eliminando suscripción:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}