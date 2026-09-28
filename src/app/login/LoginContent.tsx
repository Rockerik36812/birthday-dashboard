'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Mail, CheckCircle, AlertCircle, Gift, Info } from 'lucide-react'
import { cn } from '@/lib/cn'

export default function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const error = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    setMessage(null)

    try {
      const result = await signIn('credentials', {
        email,
        redirect: false,
        callbackUrl,
      })

      if (result?.error) {
        setMessage({ type: 'error', text: 'Error al enviar el enlace. Intenta de nuevo.' })
      } else {
        setMessage({ type: 'success', text: '¡Enlace enviado! Revisa tu correo electrónico.' })
        setEmail('')
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error de conexión. Intenta de nuevo.' })
    } finally {
      setIsLoading(false)
    }
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

            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full btn-primary gap-2 justify-center py-3"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enviando...
                </span>
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  Enviar enlace mágico
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-neutral-500">
            Al continuar, aceptas nuestros{' '}
            <a href="#" className="text-primary-600 hover:underline">Términos de servicio</a>
            {' '}y{' '}
            <a href="#" className="text-primary-600 hover:underline">Política de privacidad</a>
          </p>
        </div>

        {/* Info adicional */}
        <div className="mt-6 text-center animate-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 backdrop-blur-sm border border-neutral-100 text-sm text-neutral-600">
            <Info className="w-4 h-4 text-primary-500" />
            <span>Recibirás un enlace de acceso válido por 15 minutos</span>
          </div>
        </div>
      </div>
    </div>
  )
}