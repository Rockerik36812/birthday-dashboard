import { NextRequest, NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/app/data/uploads'
// Extensiones y tipos permitidos (imágenes de tarjeta)
const ALLOWED: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
}
const MAX_BYTES = 8 * 1024 * 1024 // 8 MB

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

    const tipo = file.type || ''
    const ext = ALLOWED[tipo]
    if (!ext) {
      return NextResponse.json(
        { error: 'Formato no permitido. Usa JPG, PNG, WEBP o GIF.' },
        { status: 415 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    if (buffer.byteLength > MAX_BYTES) {
      return NextResponse.json(
        { error: 'La imagen supera los 8 MB. Sube una más ligera.' },
        { status: 413 }
      )
    }

    // Nombre único para el archivo
    const nombre = `${randomUUID()}${ext}`
    await mkdir(UPLOAD_DIR, { recursive: true })
    await writeFile(path.join(UPLOAD_DIR, nombre), buffer)

    return NextResponse.json({ url: `/api/uploads/${nombre}` }, { status: 201 })
  } catch (error) {
    console.error('Error subiendo foto:', error)
    return NextResponse.json({ error: 'Error subiendo la imagen' }, { status: 500 })
  }
}