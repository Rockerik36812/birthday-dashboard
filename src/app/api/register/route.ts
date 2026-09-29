import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    // Verificar si ya existen usuarios — si sí, registro está cerrado
    const existingUsersCount = await prisma.user.count()
    if (existingUsersCount > 0) {
      return NextResponse.json(
        { error: 'No se pueden crear nuevas cuentas' },
        { status: 403 }
      )
    }

    const parsed = z.object({
      username: z.string().min(3, 'El usuario debe tener al menos 3 caracteres').max(30).regex(/^[a-zA-Z0-9_.]+$/, 'El usuario solo puede contener letras, números, puntos y guiones bajos'),
      nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
      email: z.string().email('Email inválido'),
      password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    }).safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validación fallida', details: parsed.error.errors },
        { status: 400 }
      )
    }

    // Verificar si el correo ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este correo ya está registrado' },
        { status: 409 }
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

    // Crear nuevo usuario con contraseña hasheada y rol ADMIN
    const hashedPassword = await bcrypt.hash(parsed.data.password, 12)
    
    const user = await prisma.user.create({
      data: {
        username: parsed.data.username.toLowerCase(),
        nombre: parsed.data.nombre,
        email: parsed.data.email,
        passwordHash: hashedPassword,
        role: 'admin', // Primer registro = admin automático
        emailVerified: new Date(),
      },
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Cuenta de administrador creada exitosamente' 
    })
  } catch (error: any) {
    console.error('Error en registro:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
