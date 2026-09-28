'use client'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { getAge } from '@/lib/utils'
import { CumpleanosConEdad, Sucursal } from '@/types'
import { Gift, MapPin, MessageSquare, Heart, Sparkles } from 'lucide-react'

interface BirthdayCardProps {
  cumple: CumpleanosConEdad
  size?: 'compact' | 'full'
  showActions?: boolean
  onShare?: (cumple: CumpleanosConEdad) => void
}

export function BirthdayCard({ cumple, size = 'full', showActions = true, onShare }: BirthdayCardProps) {
  const sucursalColor = cumple.sucursal?.color || '#EC407A'
  const edad = getAge(cumple.fecha)
  const esHoy = cumple.esHoy

  const cardStyles = {
    background: `linear-gradient(135deg, ${sucursalColor}15 0%, ${sucursalColor}05 100%)`,
    borderColor: sucursalColor,
  }

  if (size === 'compact') {
    return (
      <div
        className={cn(
          'relative p-4 rounded-xl border-2 shadow-sm transition-all duration-300',
          esHoy && 'animate-pulse shadow-lg ring-2 ring-primary-300'
        )}
        style={cardStyles}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: sucursalColor + '20' }}>
            <Gift className="w-6 h-6" style={{ color: sucursalColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-neutral-900 truncate">{cumple.nombre}</h3>
              {esHoy && <span className="badge badge-primary animate-pulse">🎂 ¡HOY!</span>}
            </div>
            <p className="text-sm text-neutral-600 mt-0.5">
              {cumple.sucursal && (
                <span className="flex items-center gap-1" style={{ color: sucursalColor }}>
                  <MapPin className="w-3 h-3" />
                  {cumple.sucursal.nombre}
                </span>
              )}
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              {format(new Date(cumple.fecha), 'd MMMM', { locale: es })} · {edad} años
            </p>
          </div>
          {showActions && onShare && (
            <button
              onClick={() => onShare(cumple)}
              className="p-2 rounded-lg bg-primary-100 hover:bg-primary-200 text-primary-700 transition-colors"
              aria-label="Compartir tarjeta"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative p-6 rounded-2xl border-2 shadow-card overflow-hidden',
        esHoy && 'ring-2 ring-primary-300 shadow-lg animate-pulse'
      )}
      style={cardStyles}
    >
      {/* Decoraciones decorativas */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" style={{ backgroundColor: sucursalColor }}></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full opacity-10" style={{ backgroundColor: sucursalColor }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full opacity-5" style={{ backgroundColor: sucursalColor }}></div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl" style={{ backgroundColor: sucursalColor + '20' }}>
              <Gift className="w-7 h-7" style={{ color: sucursalColor }} />
            </div>
            <div>
              <h3 className="font-display font-bold text-xl text-neutral-900">{cumple.nombre}</h3>
              <p className="text-sm text-neutral-600 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {cumple.sucursal?.nombre || 'Sin sucursal'}
              </p>
            </div>
          </div>

          {esHoy && (
            <div className="flex items-center gap-1 badge-primary animate-pulse px-3 py-1.5">
              <Heart className="w-4 h-4" />
              <span>¡FELIZ CUMPLEAÑOS!</span>
            </div>
          )}
        </div>

        {/* Edad y fecha */}
        <div className="flex items-center justify-between mb-4 p-4 bg-white/50 rounded-xl backdrop-blur-sm">
          <div className="text-center">
            <p className="font-display font-bold text-3xl" style={{ color: sucursalColor }}>{edad}</p>
            <p className="text-xs text-neutral-500 uppercase tracking-wide">años</p>
          </div>
          <div className="flex-1 text-center border-x border-neutral-200/50">
            <p className="font-display font-bold text-xl text-neutral-900">
              {format(new Date(cumple.fecha), 'd', { locale: es })}
            </p>
            <p className="text-sm text-neutral-600 capitalize">
              {format(new Date(cumple.fecha), 'MMMM', { locale: es })}
            </p>
          </div>
          <div className="text-center">
            <p className="font-display font-bold text-xl" style={{ color: sucursalColor }}>{cumple.diasParaCumple === 0 ? '🎂' : cumple.diasParaCumple}</p>
            <p className="text-xs text-neutral-500 uppercase tracking-wide">
              {cumple.diasParaCumple === 0 ? '¡Hoy!' : 'días'}
            </p>
          </div>
        </div>

        {/* Mensaje */}
        <div className="mb-4 p-4 bg-white/70 rounded-xl backdrop-blur-sm border border-neutral-100/50">
          <MessageSquare className="w-5 h-5 mb-2" style={{ color: sucursalColor }} />
          <p className="text-neutral-800 leading-relaxed italic">"{cumple.mensaje}"</p>
        </div>

        {/* Footer con botón compartir */}
        {showActions && onShare && (
          <button
            onClick={() => onShare(cumple)}
            className="w-full btn-primary gap-2 justify-center"
            style={{ background: `linear-gradient(135deg, ${sucursalColor} 0%, ${darkenColor(sucursalColor, 10)} 100%)` }}
          >
            <Sparkles className="w-4 h-4" />
            <span>Crear y Compartir Tarjeta</span>
          </button>
        )}
      </div>

      {/* Decoraciones inferiores */}
      <div className="absolute bottom-0 left-0 right-0 h-2 opacity-20" style={{ background: `linear-gradient(90deg, transparent, ${sucursalColor}, transparent)` }}></div>
    </div>
  )
}

// Helper para darken color
function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.max(0, (num >> 16) - amt)
  const G = Math.max(0, ((num >> 8) & 0x00FF) - amt)
  const B = Math.max(0, (num & 0x0000FF) - amt)
  return `#${(0x1000000 + (R << 16) + (G << 8) + B).toString(16).slice(1)}`
}