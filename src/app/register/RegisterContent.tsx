'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, User, Mail, Lock, CheckCircle, AlertCircle, Gift, Info, Shield } from 'lucide-react'
import { cn } from '@/lib/cn'

export default function RegisterPage() {
  const router = useRouter()
  
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [registrationClosed, setRegistrationClosed] = useState(false)

  useEffect(() => {
    fetch('/api/registration-status').then(r => r.json()).then(data => {
      if (data.registrationClosed) {
        setRegistrationClosed(true)
      }
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setIsLoading(true)
    setMessage(null)

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage({ 
          type: 'error', 
          text: data.error || data.details?.[0]?.message || 'Error al crear la cuenta' 
        })
        return
      }

      setMessage({ type: 'success', text: '¡Cuenta de administrador creada! Redirigiendo...' })
      
      setTimeout(() => {
        router.push('/login')
      }, 1500)
    } catch (err) {
      setMessage({ type: 'error', text: 'Error de conexión. Intenta de nuevo.' })
    } finally {
      setIsLoading(false)
    }
  }

  if (registrationClosed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 animate-in">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-primary mx-auto mb-4 shadow-soft">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="font-display font-bold text-3xl text-neutral-900 mb-2">Birthday Dashboard</h1>
            <p className="text-neutral-600">Registro cerrado</p>
          </div>

          <div className="card p-6 sm:p-8 animate-in border-yellow-200 bg-yellow-50">
            <div className="mb-6 p-4 rounded-xl flex items-center gap-3 text-sm bg-yellow-100 border border-yellow-200 text-yellow-800">
              <Info className="w-5 h-5 flex-shrink-0" />
              <p>El registro por internet está deshabilitado.</p>
            </div>

            <p className="text-neutral-600 mb-4">
              Las cuentas se crean manualmente por el administrador del sistema.
            </p>

            <div className="mt-6 text-center">
              <a href="/login" className="btn-primary inline-block">
                Ir al Login
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo y título */}
        <div className="text-center mb-8 animate-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-primary mx-auto mb-4 shadow-soft">
            <Gift className="w-10 h-10 text-white" />
          </div>
          <h1 className="font-display font-bold text-3xl text-neutral-900 mb-2">Birthday Dashboard</h1>
          <p className="text-neutral-600">Crear tu cuenta</p>
        </div>

        {/* Formulario */}
        <div className="card p-6 sm:p-8 animate-in">
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
              <label htmlFor="nombre" className="label flex items-center gap-1.5">
                <User className="w-4 h-4 text-primary-500" />
                Nombre completo
              </label>
              <input
                id="nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre"
                className="input"
                required
                autoComplete="name"
                autoFocus
                disabled={isLoading}
              />
            </div>

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
                placeholder="Mínimo 6 caracteres"
                className="input"
                required
                minLength={6}
                autoComplete="new-password"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !nombre || !email || !password}
              className="w-full btn-primary gap-2 justify-center py-3 mt-2"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creando cuenta...
                </span>
              ) : (
                'Crear cuenta'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-neutral-500">
            ¿Ya tienes cuenta?{' '}
            <a href="/login" className="text-primary-600 hover:underline">Inicia sesión</a>
          </p>
        </div>
      </div>
    </div>
  )
}
