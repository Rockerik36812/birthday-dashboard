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
  const pathname = req.nextUrl.pathname

  // Archivos estáticos públicos: servir sin sesión (manifest, sw, iconos, fonts)
  const STATIC_EXT = /\.(png|ico|svg|webmanifest|css|js|woff2?)$/
  if (
    pathname === '/site.webmanifest' ||
    pathname === '/sw.js' ||
    pathname === '/apple-touch-icon.png' ||
    pathname.startsWith('/icons/') ||
    STATIC_EXT.test(pathname)
  ) {
    return NextResponse.next()
  }

  const isLoggedIn = isAuthed(req)
  const isRoot = pathname === '/'
  const isOnLogin = pathname.startsWith('/login')
  const isOnRegister = pathname.startsWith('/register')
  const isOnApi = pathname.startsWith('/api/auth/signin') || 
                  pathname.startsWith('/api/register') ||
                  pathname.startsWith('/api/registration-status') ||
                  pathname.startsWith('/api/me') ||
                  pathname.startsWith('/api/logout') ||
                  pathname.startsWith('/api/cumpleanos') ||
                  pathname.startsWith('/api/sucursales') ||
                  pathname.startsWith('/api/admin/')

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
