import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSucursalColor } from '@/lib/colors'

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

    const sucursales = await prisma.sucursal.findMany({
      include: { _count: { select: { cumpleanos: true } } },
      orderBy: { orden: 'asc' },
    })

    return NextResponse.json(sucursales)
  } catch (error) {
    console.error('Error fetching sucursales:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthed(request)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { nombre, color, orden } = body

    if (!nombre) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 })
    }

    const count = await prisma.sucursal.count()
    const sucursal = await prisma.sucursal.create({
      data: {
        nombre,
        color: color || getSucursalColor(count),
        orden: orden ?? count,
      },
    })

    return NextResponse.json(sucursal, { status: 201 })
  } catch (error) {
    console.error('Error creating sucursal:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
