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

// Borra del disco un archivo subido localmente (ruta /api/uploads/...).
// No hace nada con URLs externas, y nunca lanza error si el archivo no existe.
async function borrarArchivoLocal(foto: string | null | undefined): Promise<void> {
  if (!foto || !foto.startsWith('/api/uploads/')) return
  const { unlink } = await import('fs/promises')
  const path = await import('path')
  try {
    const nombre = (foto.split('/').pop() as string)
    await unlink(path.join(process.env.UPLOAD_DIR || '/app/data/uploads', nombre))
  } catch {
    // archivo no existe o ya borrado: no importa
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
    const { nombre, fecha, sucursalId, mensaje, emoji, foto, avisoDias } = body

    if (!nombre || !fecha || !sucursalId || !mensaje) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 })
    }

    // Si se reemplazó o quitó la foto local, borrar el archivo anterior del disco
    const existente = await prisma.cumpleanos.findUnique({ where: { id } })
    if (existente && existente.foto && existente.foto !== foto) {
      await borrarArchivoLocal(existente.foto)
    }

    const cumpleanos = await prisma.cumpleanos.update({
      where: { id },
      data: {
        nombre,
        fecha: parseBirthdayLocal(fecha),
        sucursalId,
        mensaje,
        // En PUT, emoji/foto se envían tal cual ("" borra el valor, null lo deja igual)
        emoji: typeof emoji === 'string' ? (emoji || null) : undefined,
        foto: typeof foto === 'string' ? (foto || null) : undefined,
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
    // Si el cumpleaños tenía foto local, borrarla del disco al eliminar
    const existente = await prisma.cumpleanos.findUnique({ where: { id } })
    if (existente) await borrarArchivoLocal(existente.foto)

    await prisma.cumpleanos.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting cumpleaños:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
