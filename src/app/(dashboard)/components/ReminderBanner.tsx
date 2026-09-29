'use client'

import { useState } from 'react'
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

/**
 * Banner de recordatorio que aparece SIEMPRE al abrir el dashboard cuando hay
 * un cumpleaños HOY (alerta fuerte rosa 🎂) o MAÑANA (aviso ámbar 🎁),
 * sin importar la hora.
 * La campana de notificaciones por separado (PushBell) gestiona el Web Push.
 */
export function ReminderBanner({ cumpleanos }: ReminderBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  const hoy = cumpleanos.filter((c) => isBirthdayToday(c.fecha))
  const manana = cumpleanos.filter((c) => !isBirthdayToday(c.fecha) && isTomorrow(c.fecha))

  if (dismissed || (hoy.length === 0 && manana.length === 0)) return null

  const esHoy = hoy.length > 0
  const nombres = (esHoy ? hoy : manana).map((c) => c.nombre).join(', ')

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
                ? (hoy.length > 1 ? `¡Hoy cumplen ${hoy.length}! 🎂` : `¡Hoy cumple ${nombres}! 🎂`)
                : (manana.length > 1 ? `Mañana cumplen ${manana.length} 🎁` : `Mañana cumple ${nombres} 🎁`)}
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
    </div>
  )
}