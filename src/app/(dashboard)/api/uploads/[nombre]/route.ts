import { NextRequest, NextResponse } from 'next/server'
import { readFile, unlink } from 'fs/promises'
import path from 'path'

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/app/data/uploads'
const MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
}

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

// Devuelve el archivo subido (por su nombre) con su content-type.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ nombre: string }> }
) {
  try {
    const { nombre } = await params
    // Evitar path traversal: solo nombre de archivo de imagen
    const clean = path.basename(nombre)
    const ext = path.extname(clean).replace('.', '').toLowerCase()
    if (!MIME[ext]) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    }

    const filePath = path.join(UPLOAD_DIR, clean)
    const buffer = await readFile(filePath)

    return new NextResponse(new Uint8Array(buffer as unknown as number[]), {
      status: 200,
      headers: {
        'Content-Type': MIME[ext],
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }
}

// Borra el archivo subido (opción "quitar foto"). Requiere admin.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ nombre: string }> }
) {
  try {
    if (!isAuthed(request)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const { nombre } = await params
    const clean = path.basename(nombre)
    const filePath = path.join(UPLOAD_DIR, clean)
    try {
      await unlink(filePath)
    } catch {
      // archivo no existe: no es error
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error borrando foto:', error)
    return NextResponse.json({ error: 'Error borrando la imagen' }, { status: 500 })
  }
}