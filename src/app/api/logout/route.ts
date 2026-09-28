import { NextResponse } from 'next/server'

// Cierra sesión: borra la cookie httpOnly `auth-token`.
export async function POST() {
  return new NextResponse(null, {
    status: 302,
    headers: {
      Location: '/login',
      'Set-Cookie': 'auth-token=; path=/; Max-Age=0; HttpOnly; SameSite=Strict',
    },
  })
}