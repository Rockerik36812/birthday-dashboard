'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Calendar, MapPin, MessageSquare, Building2, Gift, Loader2, Image, Bell, Smile } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Sucursal } from '@/types'

const birthdaySchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  fecha: z.string().min(1, 'La fecha es obligatoria'),
  sucursalId: z.string().min(1, 'Selecciona una sucursal'),
  mensaje: z.string().min(10, 'El mensaje debe tener al menos 10 caracteres').max(500),
  emoji: z.string().max(20).optional(),
  foto: z.string().max(500).optional(),
  avisoDias: z.coerce.number().min(0).max(30).optional(),
})

type BirthdayFormData = z.infer<typeof birthdaySchema>

interface BirthdayModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: BirthdayFormData) => Promise<void>
  sucursales: Sucursal[]
  initialData?: {
    nombre: string
    fecha: string
    sucursalId: string
    mensaje: string
    emoji?: string
    foto?: string
    avisoDias?: number
  } | null
  isLoading?: boolean
}

export function BirthdayModal({
  isOpen,
  onClose,
  onSubmit,
  sucursales,
  initialData,
  isLoading,
}: BirthdayModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
    setValue,
  } = useForm<BirthdayFormData>({
    resolver: zodResolver(birthdaySchema),
    defaultValues: {
      nombre: '',
      fecha: '',
      sucursalId: '',
      mensaje: '',
      emoji: '',
      foto: '',
      avisoDias: 1,
    },
  })

  const [fotoStatus, setFotoStatus] = useState<'idle' | 'subiendo' | 'error' | 'listo'>('idle')
  const [fotoError, setFotoError] = useState<string>('')
  // Foto guardada en estado local (NO depende del hook): la añadimos manualmente al enviar.
  const [fotoUrl, setFotoUrl] = useState<string>('')
  const fotoInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (isOpen && initialData) {
      setFotoUrl(initialData.foto || '')
      setFotoStatus('idle')
      reset({
        nombre: initialData.nombre,
        fecha: initialData.fecha,
        sucursalId: initialData.sucursalId,
        mensaje: initialData.mensaje,
        emoji: initialData.emoji || '',
        foto: initialData.foto || '',
        avisoDias: initialData.avisoDias ?? 1,
      })
    } else if (isOpen && !initialData) {
      setFotoUrl('')
      setFotoStatus('idle')
      reset({
        nombre: '',
        fecha: new Date().toISOString().split('T')[0],
        sucursalId: sucursales[0]?.id || '',
        mensaje: '',
        emoji: '',
        foto: '',
        avisoDias: 1,
      })
    }
  }, [isOpen, initialData, reset, sucursales])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmitForm = async (data: BirthdayFormData) => {
    // La foto va por estado local (no por el hook) → la añadimos manualmente.
    await onSubmit({ ...data, foto: fotoUrl || undefined })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh] animate-in">
        {/* Header */}
        <div className="gradient-primary p-4 flex items-center justify-between">
          <h2 className="text-white font-display font-bold text-lg">
            {initialData ? 'Editar Cumpleaños' : 'Nuevo Cumpleaños'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors text-white"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleSubmitForm)} className="p-4 space-y-4">
          {/* Nombre */}
          <div>
            <label htmlFor="nombre" className="label flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-primary-500" />
              Nombre
            </label>
            <input
              {...register('nombre')}
              id="nombre"
              type="text"
              placeholder="Nombre completo"
              className={cn('input', errors.nombre && 'border-red-300 focus:border-red-400 focus:ring-red-100')}
              autoComplete="off"
              autoFocus
            />
            {errors.nombre && (
              <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                <X className="w-3 h-3" />
                {errors.nombre.message}
              </p>
            )}
          </div>

          {/* Fecha */}
          <div>
            <label htmlFor="fecha" className="label flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary-500" />
              Fecha de cumpleaños
            </label>
            <input
              {...register('fecha')}
              id="fecha"
              type="date"
              className={cn('input', errors.fecha && 'border-red-300 focus:border-red-400 focus:ring-red-100')}
            />
            {errors.fecha && (
              <p className="mt-1 text-sm text-red-500">{errors.fecha.message}</p>
            )}
            <p className="mt-1 text-xs text-neutral-500">Se usará el año para calcular la edad</p>
          </div>

          {/* Sucursal */}
          <div>
            <label htmlFor="sucursalId" className="label flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-primary-500" />
              Sucursal
            </label>
            <select
              {...register('sucursalId')}
              id="sucursalId"
              className={cn('input appearance-none', errors.sucursalId && 'border-red-300 focus:border-red-400 focus:ring-red-100')}
            >
              <option value="">Selecciona una sucursal</option>
              {sucursales.map(s => (
                <option key={s.id} value={s.id} style={{ color: s.color }}>
                  {s.nombre}
                </option>
              ))}
            </select>
            {errors.sucursalId && (
              <p className="mt-1 text-sm text-red-500">{errors.sucursalId.message}</p>
            )}
          </div>

          {/* Mensaje */}
          <div>
            <label htmlFor="mensaje" className="label flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-primary-500" />
              Mensaje de cumpleaños
            </label>
            <textarea
              {...register('mensaje')}
              id="mensaje"
              rows={4}
              placeholder="Escribe un mensaje bonito para la tarjeta de cumpleaños..."
              className={cn('input resize-y min-h-[100px]', errors.mensaje && 'border-red-300 focus:border-red-400 focus:ring-red-100')}
            />
            {errors.mensaje && (
              <p className="mt-1 text-sm text-red-500">{errors.mensaje.message}</p>
            )}
            <p className="mt-1 text-xs text-neutral-500">
              Este mensaje aparecerá en la tarjeta de WhatsApp
            </p>
          </div>

          {/* Personalización de la tarjeta (opcional) */}
          <>
            <div className="pt-1 pb-0.5 border-b border-neutral-100">
                <p className="text-xs text-neutral-400 uppercase tracking-wide">✨ Personalización de la tarjeta</p>
              </div>

              {/* Emoji / tema */}
              <div>
                <label htmlFor="emoji" className="label flex items-center gap-1.5">
                  <Smile className="w-4 h-4 text-primary-500" />
                  Emoji / tema
                </label>
                <input
                  {...register('emoji')}
                  id="emoji"
                  type="text"
                  maxLength={20}
                  placeholder="Ej: 🎂 🎉 🌸 ⚡ (déjalo vacío para el regalo 🎁)"
                  className={cn('input')}
                  autoComplete="off"
                />
                <p className="mt-1 text-xs text-neutral-500">Aparece como el símbolo principal de la tarjeta</p>
              </div>

              {/* Foto: subir desde el dispositivo (se guarda en el servidor) */}
              <div>
                <label className="label flex items-center gap-1.5">
                  <Image className="w-4 h-4 text-primary-500" />
                  Foto del cumpleañero
                </label>
                <input
                  id="foto-file"
                  ref={fotoInputRef}
                  type="file"
                  className="input-file"
                  onClick={(e) => { e.currentTarget.value = '' }}
                  onChange={async (e) => {
                    const archivo = e.target.files?.[0]
                    if (!archivo) return
                    if (archivo.size > 8 * 1024 * 1024) {
                      setFotoError('La imagen supera los 8 MB. Sube una más ligera.')
                      setFotoStatus('error')
                      e.target.value = ''
                      return
                    }
                    setFotoStatus('subiendo')
                    setFotoError('')
                    const fd = new FormData()
                    fd.append('file', archivo)
                    try {
                      const res = await fetch('/api/upload', { method: 'POST', body: fd })
                      if (res.status === 401) {
                        setFotoError('Tu sesión venció. Vuelve a iniciar sesión y repite la subida.')
                        setFotoStatus('error')
                        setTimeout(() => { window.location.href = '/login' }, 1800)
                        return
                      }
                      if (!res.ok) {
                        let msg = 'No se pudo subir la foto. Intenta de nuevo.'
                        try { const d = await res.json(); if (d.error) msg = d.error } catch {}
                        setFotoError(msg)
                        setFotoStatus('error')
                        e.target.value = ''
                        return
                      }
                      const d = await res.json()
                      setFotoUrl(d.url)
                      e.target.value = ''
                      setFotoStatus('listo')
                    } catch (err) {
                      setFotoError('Error de conexión al subir la foto. Revisa tu internet e intenta de nuevo.')
                      setFotoStatus('error')
                    }
                  }}
                />
                {/* Botón explícito para abrir el selector (label nativo que dispara el input oculto) */}
                <label
                  htmlFor="foto-file"
                  className="btn-secondary w-full mt-1 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Image className="w-4 h-4" />
                  {fotoUrl ? 'Cambiar foto' : 'Subir foto'}
                </label>
                <p className="mt-1 text-xs text-neutral-500">
                  Toca el botón o el campo para elegir una foto (JPG, PNG, WEBP o GIF, máx 8 MB)
                </p>

                {/* Estado de la subida */}
                {fotoStatus === 'subiendo' && (
                  <p className="mt-2 text-sm text-primary-600 flex items-center gap-1.5">
                    <Loader2 className="w-4 h-4 animate-spin" /> Subiendo foto…
                  </p>
                )}
                {fotoStatus === 'listo' && (
                  <p className="mt-2 text-sm text-green-600 flex items-center gap-1.5">
                    <span>✓</span> Foto subida correctamente
                  </p>
                )}
                {fotoStatus === 'error' && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
                    <X className="w-4 h-4" /> {fotoError}
                  </p>
                )}

                {/* Preview + botón quitar */}
                {(fotoUrl) && (
                  <div className="mt-3 flex items-center gap-3">
                    <img
                      src={fotoUrl}
                      alt="Vista previa de la foto"
                      className="w-16 h-16 rounded-full object-cover border-2"
                      style={{ borderColor: '#e8792e' }}
                    />
                    <span className="text-xs text-neutral-500">Vista previa</span>
                    <button
                      type="button"
                      onClick={async () => {
                        const fotoborrar = fotoUrl
                        setFotoUrl('')
                        setFotoStatus('idle')
                        if (fotoborrar.startsWith('/api/uploads/')) {
                          const nombre = fotoborrar.split('/').pop()
                          await fetch(`/api/uploads/${nombre}`, { method: 'DELETE' })
                        }
                      }}
                      className="btn-danger" aria-label="Quitar foto"
                    >
                      🗑️ Quitar foto
                    </button>
                  </div>
                )}
              </div>

              {/* Anticipación del recordatorio */}
              <div>
                <label htmlFor="avisoDias" className="label flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-primary-500" />
                  Avisar con anticipación
                </label>
                <select
                  {...register('avisoDias')}
                  id="avisoDias"
                  className={cn('input appearance-none')}
                >
                  <option value="0">El mismo día</option>
                  <option value="1">1 día antes</option>
                  <option value="2">2 días antes</option>
                  <option value="3">3 días antes</option>
                  <option value="7">1 semana antes</option>
                </select>
                <p className="mt-1 text-xs text-neutral-500">
                  Recibes la notificación push con esta anticipación
                </p>
              </div>
          </>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </span>
              ) : (
                initialData ? 'Actualizar' : 'Crear'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}