import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth'
import { getSucursalColor } from '@/lib/colors'

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user) {
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
    const session = await getServerSession()
    if (!session?.user) {
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