'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Mail, Lock, CheckCircle, AlertCircle, Gift } from 'lucide-react'
import { cn } from '@/lib/cn'

export default function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const error = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    setIsLoading(true)
    setMessage(null)

    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (res.redirected) {
        router.push(callbackUrl)
        router.refresh()
      } else {
        const data = await res.json()
        setMessage({ 
          type: 'error', 
          text: data.error || 'Credenciales incorrectas' 
        })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error de conexión. Intenta de nuevo.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex flex-col">
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
        {/* Logo y título */}
        <div className="text-center mb-8 animate-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-primary mx-auto mb-4 shadow-soft">
            <Gift className="w-10 h-10 text-white" />
          </div>
          <h1 className="font-display font-bold text-3xl text-neutral-900 mb-2">Birthday Dashboard</h1>
          <p className="text-neutral-600">Panel de Cumpleaños del Equipo</p>
        </div>

        {/* Formulario */}
        <div className="card p-6 sm:p-8 animate-in">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 animate-in">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">Error de autenticación. Intenta de nuevo.</p>
            </div>
          )}

          {message && (
            <div className={cn(
              'mb-6 p-4 rounded-xl flex items-center gap-3 text-sm animate-in',
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            )}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <p>{message.text}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="label flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-primary-500" />
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="input"
                required
                autoComplete="email"
                autoFocus
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="label flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-primary-500" />
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                className="input"
                required
                autoComplete="current-password"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full btn-primary gap-2 justify-center py-3 mt-2"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Ingresando...
                </span>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-xs text-neutral-500">
              ¿No tienes cuenta?{' '}
              <a href="/register" className="text-primary-600 hover:underline font-medium">
                Regístrate aquí
              </a>
            </p>
          </div>
        </div>
      </div>
      </main>

      {/* Pie de página */}
      <footer className="flex-none py-4 text-center">
        <p className="text-xs text-neutral-500">By Erik Cano</p>
      </footer>
    </div>
  )
}
