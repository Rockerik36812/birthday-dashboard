'use client'

import { useEffect, useState, useCallback } from 'react'

export interface AuthUser {
  id: string
  email: string
  name: string | null
  role: string
}

export interface UseAuthResult {
  user: AuthUser | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
}

// Lee la cookie `auth-token` (configurada por /api/auth/signin)
function readAuthCookie(): AuthUser | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith('auth-token='))
  if (!match) return null
  try {
    const payload = JSON.parse(atob(match.split('=')[1]))
    if (!payload || !payload.email) return null
    return {
      id: payload.id,
      email: payload.email,
      name: payload.name ?? null,
      role: payload.role ?? 'editor',
    }
  } catch {
    return null
  }
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')

  const refresh = useCallback(() => {
    const u = readAuthCookie()
    setUser(u)
    setStatus(u ? 'authenticated' : 'unauthenticated')
  }, [])

  useEffect(() => {
    refresh()
    // Escuchar cambios de cookie (login/logout) y foco de vuelta
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refresh])

  return { user, status }
}