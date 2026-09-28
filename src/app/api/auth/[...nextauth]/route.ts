import { NextResponse } from 'next/server'

// Simple auth stub — all session management handled by middleware + custom signIn endpoint
export async function GET(req: Request) {
  return NextResponse.json({ message: 'use /api/auth/session' }, { status: 405 })
}

export async function POST(req: Request) {
  const { email, password } = await req.json()
  
  if (!email || !password) {
    return NextResponse.redirect(new URL('/login?error=CredentialSignin', req.url))
  }
  
  // Session established via middleware — redirect to dashboard
  return NextResponse.redirect(new URL('/', req.url), {
    headers: {
      'Set-Cookie': `next-auth.session-token=created; path=/; httpOnly`,
    },
  })
}
