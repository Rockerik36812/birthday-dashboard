'use client'

import { useEffect, useState } from 'react'
import { Bell, BellRing, X } from 'lucide-react'
import { isBirthdayToday, parseBirthdayLocal } from '@/lib/utils'
import { CumpleanosConEdad } from '@/types'

interface ReminderBannerProps {
  cumpleanos: CumpleanosConEdad[]
}

/** Determina si un cumpleaños cae MAÑANA (comparando mes+día con +1 día). */
function isTomorrow(birthDate: Date | string): boolean {
  const birth = typeof birthDate === 'string' ? parseBirthdayLocal(birthDate) : birthDate
  const now = new Date()
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  return birth.getMonth() === tomorrow.getMonth() && birth.getDate() === tomorrow.getDate()
}

/** Convierte una clave pública VAPID (base64url) al formato Uint8Array del navegador. */
function urlBase64ToUint8Array(b64: string): Uint8Array {
  const padding = '='.repeat((4 - b64.length % 4) % 4)
  const base64 = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

/**
 * Banner de recordatorios que aparece SIEMPRE al abrir el dashboard
 * (sin importar la hora):
 *  - Cumpleaños HOY  → alerta fuerte (rosa, con 🎂)
 *  - Cumpleaños MAÑANA → aviso (ambar, con 🔔)
 * También gestiona la suscripción Web Push del navegador para que los
 * recordatorios de las 9:00 y 12:00 lleguen aunque no se abra la app.
 */
export function ReminderBanner({ cumpleanos }: ReminderBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  const [pushState, setPushState] = useState<'off' | 'unavailable' | 'ready' | 'denied'>(() =>
    typeof localStorage !== 'undefined' && localStorage.getItem('bd-push') === 'on' ? 'ready' : 'off'
  )

  const hoy = cumpleanos.filter((c) => isBirthdayToday(c.fecha))
  const manana = cumpleanos.filter((c) => !isBirthdayToday(c.fecha) && isTomorrow(c.fecha))

  const listar = (arr: typeof hoy) => arr.map((c) => c.nombre).join(', ')

  // Suscripción Web Push: registra el dispositivo si está disponible y el usuario dio permiso.
  useEffect(() => {
    if (typeof navigator === 'undefined' || typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      setPushState('unavailable')
      return
    }
    if (pushState !== 'ready' && pushState !== 'denied') return

    const subscribePush = async () => {
      try {
        const reg = await navigator.serviceWorker.ready
        if (!reg?.pushManager) {
          setPushState('unavailable')
          return
        }
        // Obtener la clave pública VAPID del servidor y suscribirse
        const resp = await fetch('/api/push/vapid-key')
        const { publicKey } = await resp.json()
        if (!publicKey) {
          setPushState('unavailable')
          return
        }
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as BufferSource,
        })
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
          localStorage.setItem('bd-push', 'on')
          setPushState('ready')
        } else {
          setPushState('denied')
        }
      } catch (e) {
        console.error('Push subscribe error:', e)
        setPushState('denied')
        localStorage.setItem('bd-push', 'off')
      }
    }

    subscribePush()
  }, [pushState])

  const requestEnable = () => {
    localStorage.setItem('bd-push', 'on')
    setPushState('ready')
  }

  const disable = () => {
    localStorage.setItem('bd-push', 'off')
    setPushState('off')
  }

  if (dismissed || (hoy.length === 0 && manana.length === 0)) return null

  const esHoy = hoy.length > 0
  const nombres = esHoy ? listar(hoy) : listar(manana)
  const cantidad = esHoy ? hoy.length : manana.length

  return (
    <div
      className="mb-4 rounded-2xl border shadow-sm"
      style={esHoy
        ? { background: 'linear-gradient(135deg, #EC407A 0%, #C2185B 100%)', color: '#fff' }
        : { background: 'linear-gradient(135deg, #FFB300 0%, #F59E0B 100%)', color: '#fff' }}
    >
      <div className="flex items-start justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,.25)' }}>
            {esHoy ? <BellRing className="w-6 h-6" /> : <Bell className="w-6 h-6" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display font-bold text-base sm:text-lg leading-snug">
              {esHoy
                ? (cantidad > 1 ? `¡Hoy cumplen ${cantidad}! 🎂` : `¡Hoy cumple ${nombres}! 🎂`)
                : (cantidad > 1 ? `Mañana cumplen ${cantidad} 🎁` : `Mañana cumple ${nombres} 🎁`)}
            </p>
            <p className="text-xs sm:text-sm opacity-90 leading-tight">
              {esHoy
                ? 'Es el gran día. ¡Felicítalo!'
                : 'No lo dejes pasar. Prepárate para felicitarlo.'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 p-1.5 rounded-full text-white/80 hover:bg-white/20 hover:text-white transition-colors"
          aria-label="Cerrar aviso"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Estado de notificaciones del navegador */}
      <div className="flex items-center gap-2 px-4 py-1.5">
        <span className="text-[11px] sm:text-xs opacity-90">
          {pushState === 'ready'
            ? '🔔 Recibirás el recordatorio aquí mismo a las 9:00 y 12:00.'
            : pushState === 'denied'
              ? 'Notificaciones bloqueadas. Permítelas desde el icono del candado en la barra.'
              : pushState === 'unavailable'
                ? 'Este navegador no soporta notificaciones en segundo plano. Instala la app o abre desde el celular.'
                : 'Activar notificaciones para recordarte los cumpleaños.'}
        </span>
        {pushState === 'off' && (
          <button
            onClick={requestEnable}
            className="ml-auto flex-shrink-0 rounded-full text-xs font-medium"
            style={{ backgroundColor: 'rgba(255,255,255,.25)', color: '#fff', padding: '5px 14px', border: 'none', cursor: 'pointer' }}
          >
            Activar
          </button>
        )}
        {pushState === 'ready' && (
          <button
            onClick={disable}
            className="ml-auto flex-shrink-0 rounded-full text-xs font-medium"
            style={{ backgroundColor: 'rgba(255,255,255,.2)', color: '#fff', padding: '5px 14px', border: 'none', cursor: 'pointer' }}
          >
            Desactivar
          </button>
        )}
      </div>
    </div>
  )
}