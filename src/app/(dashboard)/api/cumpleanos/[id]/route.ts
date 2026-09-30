import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseBirthdayLocal } from '@/lib/utils'

function isAuthed(req: NextRequest): boolean {
  const token = req.cookies.get('auth-token')?.value
  if (!token) return false
  try {
    JSON.parse(atob(token))
    return true
  } catch {
    return false
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAuthed(request)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { nombre, fecha, sucursalId, mensaje, emoji, avisoDias } = body

    if (!nombre || !fecha || !sucursalId || !mensaje) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 })
    }

    const cumpleanos = await prisma.cumpleanos.update({
      where: { id },
      data: {
        nombre,
        fecha: parseBirthdayLocal(fecha),
        sucursalId,
        mensaje,
        // En PUT, emoji se envía tal cual ("" borra el valor, null lo deja igual)
        emoji: typeof emoji === 'string' ? (emoji || null) : undefined,
        avisoDias: typeof avisoDias === 'number' ? Math.max(0, Math.floor(avisoDias)) : undefined,
      },
      include: { sucursal: true },
    })

    return NextResponse.json(cumpleanos)
  } catch (error) {
    console.error('Error updating cumpleaños:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAuthed(request)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    await prisma.cumpleanos.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting cumpleaños:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
