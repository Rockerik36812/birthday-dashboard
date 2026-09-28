import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Helper para verificar autenticación desde la cookie
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

export function middleware(req: NextRequest) {
  const isLoggedIn = isAuthed(req)
  const isRoot = req.nextUrl.pathname === '/'
  const isOnLogin = req.nextUrl.pathname.startsWith('/login')
  const isOnRegister = req.nextUrl.pathname.startsWith('/register')
  const isOnApi = req.nextUrl.pathname.startsWith('/api/auth/signin') || 
                  req.nextUrl.pathname.startsWith('/api/register') ||
                  req.nextUrl.pathname.startsWith('/api/registration-status') ||
                  req.nextUrl.pathname.startsWith('/api/me') ||
                  req.nextUrl.pathname.startsWith('/api/logout') ||
                  req.nextUrl.pathname.startsWith('/api/cumpleanos') ||
                  req.nextUrl.pathname.startsWith('/api/sucursales') ||
                  req.nextUrl.pathname.startsWith('/api/admin/')

  // Raíz pasa sin redirección — lo maneja page.tsx según estado del registro
  if (isRoot) return NextResponse.next()

  // Redirigir autenticados fuera del login/registro
  if (isLoggedIn && (isOnLogin || isOnRegister)) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Proteger rutas — si no está logueado y es protegida
  if (!isLoggedIn && !isOnLogin && !isOnRegister && !isOnApi) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
