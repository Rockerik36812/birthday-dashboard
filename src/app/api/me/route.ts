import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Devuelve el usuario autenticado a partir de la cookie httpOnly `auth-token`.
// Es consumida por el hook cliente useAuth (fetch con credentials=include).
export async function GET() {
  const store = await cookies()
  const token = store.get('auth-token')?.value
  if (!token) return NextResponse.json({ user: null }, { status: 200 })
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'))
    if (!payload || !payload.email) return NextResponse.json({ user: null }, { status: 200 })
    return NextResponse.json({
      user: {
        id: payload.id,
        email: payload.email,
        name: payload.name ?? null,
        role: payload.role ?? 'editor',
      },
    })
  } catch {
    return NextResponse.json({ user: null }, { status: 200 })
  }
}