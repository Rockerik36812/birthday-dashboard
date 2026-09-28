import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user) {
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
    const session = await getServerSession()
    if (!session?.user) {
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
        fecha: new Date(fecha),
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