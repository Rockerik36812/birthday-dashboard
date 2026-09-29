'use client'

import { useEffect, useState } from 'react'
import { Bell, BellRing, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Campana de notificaciones SIEMPRE visible en el header.
 * Permite activar/desactivar las notificaciones Web Push de recordatorios
 * de cumpleaños (9:00 y 12:00, día antes + el mero día), sin depender
 * de que haya un banner con cumpleaños inminentes.
 */

/** Convierte una clave pública VAPID (base64url) al formato Uint8Array del navegador. */
function urlBase64ToUint8Array(b64: string): Uint8Array {
  const padding = '='.repeat((4 - b64.length % 4) % 4)
  const base64 = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

export function PushBell() {
  const [state, setState] = useState<'off' | 'busy' | 'ready' | 'denied' | 'unavailable'>(() =>
    typeof localStorage !== 'undefined' && localStorage.getItem('bd-push') === 'on' ? 'ready' : 'off'
  )
  const [hint, setHint] = useState<string | null>(null)

  const supported = typeof navigator !== 'undefined' && 'serviceWorker' in navigator && typeof window !== 'undefined'

  useEffect(() => {
    if (!supported) {
      setState('unavailable')
      return
    }
    // Si ya está marcado "on" pero no se ha registrado aún, intentar el subscribe
    // automático al cargar (el push se auto-registra con la primera visita).
    if (state === 'ready' && typeof localStorage !== 'undefined' && localStorage.getItem('bd-push') === 'on') {
      void subscribeNow()
    }
    // eslint-disable-next-line
  }, [])

  const registerSubscription = async (): Promise<boolean> => {
    if (!supported) return false
    try {
      const reg = await navigator.serviceWorker.ready
      if (!reg?.pushManager) return false
      const resp = await fetch('/api/push/vapid-key')
      if (!resp.ok) return false
      const { publicKey } = await resp.json()
      if (!publicKey) return false
      let sub
      try {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as BufferSource,
        })
      } catch (e) {
        // Permission denied o ya existe con distinta clave
        return false
      }
      if (sub?.endpoint && sub.getKey('p256dh') && sub.getKey('auth')) {
        await fetch('/api/push/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: sub.endpoint,
            keys: { p256dh: sub.getKey('p256dh'), auth: sub.getKey('auth') },
            userAgent: navigator.userAgent,
            label: 'Dashboard web',
          }),
        }).catch(() => {})
        if (typeof localStorage !== 'undefined') localStorage.setItem('bd-push', 'on')
        return true
      }
      return false
    } catch (e) {
      console.error('Push subscribe error:', e)
      return false
    }
  }

  const subscribeNow = async () => {
    setState('busy')
    const ok = await registerSubscription()
    setState(ok ? 'ready' : 'denied')
    if (!ok && typeof localStorage !== 'undefined') localStorage.setItem('bd-push', 'off')
  }

  const disable = () => {
    if (typeof localStorage !== 'undefined') localStorage.setItem('bd-push', 'off')
    setState('off')
    setHint('🔕 Notificaciones desactivadas para este dispositivo.')
    setTimeout(() => setHint(null), 3500)
  }

  return (
    <div className="relative flex items-center">
      <button
        onClick={() =>
          state === 'ready'
            ? disable()
            : state === 'off' || state === 'denied'
              ? subscribeNow()
              : undefined
        }
        disabled={state === 'busy' || state === 'unavailable'}
        title={
          state === 'ready' ? 'Notificaciones activas. Clic para desactivar'
          : state === 'denied' ? 'Permiso rechazado. Desbloquea notificaciones del sitio y reintenta'
          : state === 'unavailable' ? 'Este navegador no soporta notificaciones push'
          : 'Activar notificaciones de cumpleaños'
        }
        className={cn(
          'p-2 rounded-xl transition-colors flex items-center gap-1.5',
          state === 'ready'
            ? 'bg-primary-100 text-primary-700 hover:bg-primary-200'
            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
          state === 'busy' && 'animate-pulse',
          state === 'unavailable' && 'opacity-50 cursor-not-allowed'
        )}
      >
        {state === 'ready' ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
        <span className="hidden sm:inline text-xs sm:text-sm font-medium">
          {state === 'ready' ? 'Notif. activas' : state === 'busy' ? 'Activando...' : 'Notificaciones'}
        </span>
        {state === 'ready' && <Check className="w-3.5 h-3.5 text-green-600" />}
      </button>

      {/* Tooltip con estado */}
      {hint && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 whitespace-nowrap">
          <div className="px-2.5 py-1.5 rounded-lg bg-neutral-800 text-white text-[11px] shadow-lg">
            {hint}
          </div>
        </div>
      )}

      {/* Aviso de permiso denegado */}
      {state === 'denied' && !hint && (
        <div
          className="absolute left-0 right-0 top-full mt-1 z-50"
          onClick={() => setHint(null)}
        >
          <div className="px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 text-[11px] shadow-lg whitespace-nowrap cursor-pointer">
            Permiso denegado — toca aquí para cerrar. Permite las notificaciones del sitio y pulsa de nuevo.
          </div>
        </div>
      )}
    </div>
  )
}