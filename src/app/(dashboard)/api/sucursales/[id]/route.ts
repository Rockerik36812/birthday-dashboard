import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!isAuthed(req)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = params
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    // Verificar que no tenga cumpleaños asociados (integridad relacional)
    const count = await prisma.cumpleanos.count({ where: { sucursalId: id } })
    if (count > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar: tiene ${count} cumpleaños asociados. Elimina primero los cumpleaños.` },
        { status: 409 }
      )
    }

    await prisma.sucursal.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error eliminando sucursal:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}