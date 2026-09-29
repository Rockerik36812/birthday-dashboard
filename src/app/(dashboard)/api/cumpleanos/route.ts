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

export async function GET(req: NextRequest) {
  try {
    if (!isAuthed(req)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const cumpleanos = await prisma.cumpleanos.findMany({
      include: { sucursal: true },
      orderBy: { fecha: 'asc' },
    })

    return NextResponse.json(cumpleanos)
  } catch (error) {
    console.error('Error fetching cumpleaños:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthed(request)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { nombre, fecha, sucursalId, mensaje } = body

    if (!nombre || !fecha || !sucursalId || !mensaje) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 })
    }

    const cumpleanos = await prisma.cumpleanos.create({
      data: {
        nombre,
        fecha: parseBirthdayLocal(fecha),
        sucursalId,
        mensaje,
      },
      include: { sucursal: true },
    })

    return NextResponse.json(cumpleanos, { status: 201 })
  } catch (error) {
    console.error('Error creating cumpleaños:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
