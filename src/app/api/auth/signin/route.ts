import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    const parsed = z.object({
      identificador: z.string().min(3),
      password: z.string().min(6),
    }).safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validación fallida' }, { status: 400 })
    }

    const identificador = parsed.data.identificador.trim()

    // Aceptar email O usuario (nick). Normalizamos el nick a minúsculas.
    const esEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identificador)
    const user = esEmail
      ? await prisma.user.findUnique({ where: { email: identificador.toLowerCase() } })
      : await prisma.user.findFirst({ where: { username: identificador.toLowerCase() } })

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: 'Credenciales incorrectas' },
        { status: 401 }
      )
    }

    const valid = await bcrypt.compare(parsed.data.password, user.passwordHash)
    if (!valid) {
      return NextResponse.json(
        { error: 'Credenciales incorrectas' },
        { status: 401 }
      )
    }

    // Login exitoso — redirigir al dashboard (la cookie de sesión se manejará con middleware + cookies)
    return new NextResponse(null, {
      status: 302,
      headers: {
        Location: '/',
        'Set-Cookie': `auth-token=${btoa(JSON.stringify({ id: user.id, email: user.email, username: user.username, name: user.nombre, role: user.role }))}; path=/; httpOnly; SameSite=Strict`,
      },
    })
  } catch (error: any) {
    console.error('Error en login:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
