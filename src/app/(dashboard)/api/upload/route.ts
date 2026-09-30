import { NextRequest, NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/app/data/uploads'
const MAX_BYTES = 8 * 1024 * 1024 // 8 MB

// Detecta el tipo real por los "magic bytes" (primeros bytes del archivo),
// para no depender de que el navegador envíe `type` correcto (en el cel suele
// venir vacío o como HEIC). Devuelve {ext, mime} o null si no es imagen.
function detectarImagen(buf: Buffer): { ext: string; mime: string } | null {
  const n = buf.length
  if (n < 4) return null
  // PNG
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { ext: '.png', mime: 'image/png' }
  }
  // JPEG
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { ext: '.jpg', mime: 'image/jpeg' }
  }
  // GIF
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) {
    return { ext: '.gif', mime: 'image/gif' }
  }
  // WEBP (RIFF....WEBP)
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) {
    return { ext: '.webp', mime: 'image/webp' }
  }
  return null
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

export async function POST(request: NextRequest) {
  try {
    if (!isAuthed(request)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const form = await request.formData()
    const file = form.get('file')
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Falta el archivo' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    if (buffer.byteLength === 0) {
      return NextResponse.json({ error: 'El archivo está vacío' }, { status: 400 })
    }
    if (buffer.byteLength > MAX_BYTES) {
      return NextResponse.json(
        { error: 'La imagen supera los 8 MB. Sube una más ligera.' },
        { status: 413 }
      )
    }

    // Identificar por contenido, no por el type del navegador.
    const imagen = detectarImagen(buffer)
    if (!imagen) {
      return NextResponse.json(
        { error: 'Formato no permitido. Usa JPG, PNG, WEBP o GIF.' },
        { status: 415 }
      )
    }

    // Nombre único para el archivo
    const nombre = `${randomUUID()}${imagen.ext}`
    await mkdir(UPLOAD_DIR, { recursive: true })
    await writeFile(path.join(UPLOAD_DIR, nombre), buffer)

    return NextResponse.json({ url: `/api/uploads/${nombre}`, mime: imagen.mime }, { status: 201 })
  } catch (error) {
    console.error('Error subiendo foto:', error)
    return NextResponse.json({ error: 'Error subiendo la imagen' }, { status: 500 })
  }
}