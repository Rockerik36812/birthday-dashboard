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

// Helper para obtener el id del usuario actual (desde la cookie auth-token)
function getCurrentUserId(req: NextRequest): string | undefined {
  const token = req.cookies.get('auth-token')?.value
  if (!token) return undefined
  try {
    const decoded = JSON.parse(atob(token))
    return decoded.id
  } catch {
    return undefined
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
        username: true,
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
      username: z.string().min(3, 'El usuario debe tener al menos 3 caracteres').max(30).regex(/^[a-zA-Z0-9_.]+$/, 'El usuario solo puede contener letras, números, puntos y guiones bajos'),
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

    // Verificar si el usuario (nick) ya existe
    const existingUsername = await prisma.user.findUnique({
      where: { username: parsed.data.username.toLowerCase() },
    })

    if (existingUsername) {
      return NextResponse.json(
        { error: 'Este nombre de usuario ya está en uso' },
        { status: 409 }
      )
    }

    // Verificar si el usuario ya existe por email
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
        username: parsed.data.username.toLowerCase(),
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

export async function DELETE(request: NextRequest) {
  try {
    // Solo admins pueden eliminar usuarios
    if (!isAdmin(request)) {
      return NextResponse.json({ error: 'No autorizado — requiere rol de administrador' }, { status: 401 })
    }

    const url = new URL(request.url)
    const id = url.searchParams.get('id') || ''

    if (!id) {
      return NextResponse.json({ error: 'Falta el id del usuario' }, { status: 400 })
    }

    const target = await prisma.user.findUnique({ where: { id } })
    if (!target) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Obtener admin actual (cookie auth-token) para evitar auto-eliminación
    const current = await prisma.user.findUnique({ where: { id: getCurrentUserId(request) } })

    if (current?.id && current.id === target.id) {
      return NextResponse.json({ error: 'No puedes eliminar tu propia cuenta' }, { status: 400 })
    }

    // Evitar eliminar al último admin
    if (target.role === 'admin') {
      const admins = await prisma.user.count({ where: { role: 'admin' } })
      if (admins <= 1) {
        return NextResponse.json({ error: 'No puedes eliminar al último administrador' }, { status: 400 })
      }
    }

    // Eliminar usuario (las relaciones de cumpleaños/sucursales se gestionan aparte)
    await prisma.user.delete({ where: { id: target.id } })

    return NextResponse.json({ success: true, message: `"${target.nombre || target.email}" eliminado` })
  } catch (error: any) {
    console.error('Error al eliminar usuario:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Solo admins pueden actualizar usuarios
    if (!isAdmin(request)) {
      return NextResponse.json({ error: 'No autorizado — requiere rol de administrador' }, { status: 401 })
    }

    const body = await request.json()

    const base = z.object({
      id: z.string().min(1, 'Falta el id del usuario'),
    })
    const parsed = base.extend({
      username: z.string().min(3, 'El usuario debe tener al menos 3 caracteres').max(30).regex(/^[a-zA-Z0-9_.]+$/, 'El usuario solo puede contener letras, números, puntos y guiones bajos').optional(),
      nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
      email: z.string().email('Email inválido').optional(),
      password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
      role: z.enum(['admin', 'editor']).optional(),
    }).safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validación fallida', details: parsed.error.errors },
        { status: 400 }
      )
    }

    const { id, username, nombre, email, password, role } = parsed.data
    const tieneCambio = username || nombre || email || password || role
    if (!tieneCambio) {
      return NextResponse.json(
        { error: 'No hay nada que actualizar' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Validar unicidad si cambia el username
    if (username && username.toLowerCase() !== user.username) {
      const conflict = await prisma.user.findUnique({ where: { username: username.toLowerCase() } })
      if (conflict) {
        return NextResponse.json({ error: 'Este nombre de usuario ya está en uso' }, { status: 409 })
      }
    }

    // Validar unicidad si cambia el email
    if (email && email.toLowerCase() !== user.email) {
      const conflict = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
      if (conflict) {
        return NextResponse.json({ error: 'Este correo ya está registrado' }, { status: 409 })
      }
    }

    const data: { username?: string; nombre?: string; email?: string; passwordHash?: string; role?: string } = {}
    if (username) data.username = username.toLowerCase()
    if (nombre) data.nombre = nombre
    if (email) data.email = email.toLowerCase()
    if (password) data.passwordHash = await bcrypt.hash(password, 12)
    if (role) data.role = role

    await prisma.user.update({
      where: { id: user.id },
      data,
    })

    const cambios: string[] = []
    if (username) cambios.push(`usuario → @${username}`)
    if (nombre) cambios.push('nombre')
    if (email) cambios.push('correo')
    if (password) cambios.push('contraseña')
    if (role) cambios.push(`rol → ${role === 'admin' ? '👑 Admin' : '📝 Editor'}`)

    return NextResponse.json({ success: true, message: `"${user.nombre || user.email}" actualizado (${cambios.join(', ')})` })
  } catch (error: any) {
    console.error('Error al actualizar usuario:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
