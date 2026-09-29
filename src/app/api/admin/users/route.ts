import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

// Helper para verificar si el usuario es admin
function isAdmin(req: NextRequest): boolean {
  const token = req.cookies.get('auth-token')?.value
  if (!token) return false
  try {
    const decoded = JSON.parse(atob(token))
    return decoded.role === 'admin'
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  try {
    // Solo admins pueden ver la lista de usuarios
    if (!isAdmin(request)) {
      return NextResponse.json({ error: 'No autorizado — requiere rol de administrador' }, { status: 401 })
    }

    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        nombre: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(allUsers.map(u => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
    })))
  } catch (error: any) {
    console.error('Error en obtener usuarios:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Solo admins pueden crear cuentas
    if (!isAdmin(request)) {
      return NextResponse.json({ error: 'No autorizado — requiere rol de administrador' }, { status: 401 })
    }

    const body = await request.json()
    
    const parsed = z.object({
      nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
      email: z.string().email('Email inválido'),
      password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
      role: z.enum(['admin', 'editor']).optional().default('editor'),
    }).safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validación fallida', details: parsed.error.errors },
        { status: 400 }
      )
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este correo ya está registrado' },
        { status: 409 }
      )
    }

    // Hashear contraseña y crear usuario
    const hashedPassword = await bcrypt.hash(parsed.data.password, 12)
    
    const user = await prisma.user.create({
      data: {
        nombre: parsed.data.nombre,
        email: parsed.data.email,
        passwordHash: hashedPassword,
        role: parsed.data.role || 'editor',
        emailVerified: new Date(),
      },
    })

    return NextResponse.json({ 
      success: true, 
      message: `Usuario "${user.nombre}" creado como ${user.role}`,
      id: user.id
    })
  } catch (error: any) {
    console.error('Error en creación manual:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Solo admins pueden cambiar contraseñas
    if (!isAdmin(request)) {
      return NextResponse.json({ error: 'No autorizado — requiere rol de administrador' }, { status: 401 })
    }

    const body = await request.json()

    const parsed = z.object({
      id: z.string().min(1, 'Falta el id del usuario'),
      password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    }).safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validación fallida', details: parsed.error.errors },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: parsed.data.id },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const hashedPassword = await bcrypt.hash(parsed.data.password, 12)

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashedPassword },
    })

    return NextResponse.json({ success: true, message: `Contraseña de "${user.nombre || user.email}" actualizada` })
  } catch (error: any) {
    console.error('Error al cambiar contraseña:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
