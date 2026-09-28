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

// La cookie `auth-token` es httpOnly, así que NO se puede leer con document.cookie.
// Este hook consulta /api/me (server-side) que la lee de la request y devuelve el usuario.
export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')

  const refresh = useCallback(() => {
    setStatus('loading')
    fetch('/api/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        const u = data?.user ?? null
        setUser(u)
        setStatus(u ? 'authenticated' : 'unauthenticated')
      })
      .catch(() => {
        setUser(null)
        setStatus('unauthenticated')
      })
  }, [])

  useEffect(() => {
    refresh()
    // Refresh al volver a foco (tras logout/login en otra pestaña)
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    window.addEventListener('pageshow', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('pageshow', onFocus)
    }
  }, [refresh])

  return { user, status }
}