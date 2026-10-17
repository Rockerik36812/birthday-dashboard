'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Calendar, MapPin, MessageSquare, Building2, Gift, Loader2, Image, Bell, Smile, History, UserPlus, PencilLine } from 'lucide-react'
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
    foto?: string | null
    avisoDias?: number
    creadoPor?: string | null
    actualizadoPor?: string | null
    createdAt?: string
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

  // ── Foto ────────────────────────────────────────────────────────────────
  // Va en estado LOCAL: react-hook-form no maneja bien los inputs de archivo.
  const [fotoUrl, setFotoUrl] = useState<string>('')
  const [fotoStatus, setFotoStatus] = useState<'idle' | 'subiendo' | 'listo' | 'error'>('idle')
  // Diagnóstico en pantalla: permite ver EN EL CELULAR si el selector llegó a
  // entregar el archivo. Sin esto, un fallo del selector es invisible.
  const [diagInput, setDiagInput] = useState<string>('sin archivo')
  const [fotoError, setFotoError] = useState<string>('')
  const [fotoNombre, setFotoNombre] = useState<string>('')
  const fotoInputRef = useRef<HTMLInputElement | null>(null)
  const subiendoRef = useRef(false)
  // Firma del archivo ya procesado (nombre+tamaño+fecha): evita subirlo dos veces.
  const firmaRef = useRef<string>('')

  useEffect(() => {
    if (isOpen && initialData) {
      reset({
        nombre: initialData.nombre,
        fecha: initialData.fecha,
        sucursalId: initialData.sucursalId,
        mensaje: initialData.mensaje,
        emoji: initialData.emoji || '',
        foto: initialData.foto || '',
        avisoDias: initialData.avisoDias ?? 1,
      })
      setFotoUrl(initialData.foto || '')
    } else if (isOpen && !initialData) {
      reset({
        nombre: '',
        fecha: new Date().toISOString().split('T')[0],
        sucursalId: sucursales[0]?.id || '',
        mensaje: '',
        emoji: '',
        foto: '',
        avisoDias: 1,
      })
      setFotoUrl('')
    }
    // Al abrir/cerrar se limpia el estado de la foto y la firma del archivo
    setFotoStatus('idle')
    setFotoError('')
    setFotoNombre('')
    firmaRef.current = ''
  }, [isOpen, initialData, reset, sucursales])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // RESPALDO 1 — revisa el input cada 600 ms mientras el modal está abierto.
  // En Chrome (sobre todo Android / PWA) a veces NO se dispara ningún evento al
  // elegir el archivo; sin esto la foto se perdía en silencio. Solo lee el input,
  // no hace peticiones, así que es barato.
  useEffect(() => {
    if (!isOpen) return
    const id = setInterval(() => {
      const f = fotoInputRef.current?.files?.[0]
      setDiagInput(f ? `${f.name} (${Math.round(f.size / 1024)} KB)` : 'sin archivo')
      if (!f) return
      const firma = `${f.name}|${f.size}|${f.lastModified}`
      if (firma !== firmaRef.current) void leerArchivoDelInput()
    }, 600)
    return () => clearInterval(id)
  }, [isOpen])

  if (!isOpen) return null

  // Convierte la imagen a JPEG redimensionado (máx 900 px) con canvas.
  // Dos ventajas: baja mucho el peso (evita el tope de 8 MB) y normaliza el
  // formato. Si el navegador no puede decodificarla (p. ej. HEIC en Chrome),
  // devuelve el archivo tal cual y el servidor responde con un mensaje claro.
  async function prepararArchivo(archivo: File): Promise<Blob> {
    try {
      const bitmap = await createImageBitmap(archivo)
      const MAX = 900
      const escala = Math.min(1, MAX / Math.max(bitmap.width, bitmap.height))
      const w = Math.max(1, Math.round(bitmap.width * escala))
      const h = Math.max(1, Math.round(bitmap.height * escala))
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) return archivo
      ctx.drawImage(bitmap, 0, 0, w, h)
      bitmap.close?.()
      const blob: Blob | null = await new Promise(res =>
        canvas.toBlob(b => res(b), 'image/jpeg', 0.85)
      )
      return blob && blob.size > 0 ? blob : archivo
    } catch {
      return archivo
    }
  }

  // Sube la imagen. Devuelve la URL, o '' si algo falló (dejando el error visible).
  async function subirFoto(archivo: File): Promise<string> {
    if (subiendoRef.current) return ''
    subiendoRef.current = true
    setFotoStatus('subiendo')
    setFotoError('')
    setFotoNombre(archivo.name || 'imagen')
    try {
      const blob = await prepararArchivo(archivo)
      const fd = new FormData()
      fd.append('file', blob, archivo.name || 'foto.jpg')
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const d = await res.json().catch(() => ({}))
      if (!res.ok || !d.url) {
        setFotoError(d.error || 'No se pudo subir la imagen. Intenta de nuevo.')
        setFotoStatus('error')
        return ''
      }
      setFotoUrl(d.url)
      setFotoStatus('listo')
      return d.url as string
    } catch {
      setFotoError('Error de conexión al subir la imagen. Revisa tu internet.')
      setFotoStatus('error')
      return ''
    } finally {
      subiendoRef.current = false
    }
  }

  // Lee lo que haya en el input y lo sube si es un archivo nuevo.
  async function leerArchivoDelInput() {
    const f = fotoInputRef.current?.files?.[0]
    if (!f) return
    const firma = `${f.name}|${f.size}|${f.lastModified}`
    if (firma === firmaRef.current) return
    firmaRef.current = firma
    await subirFoto(f)
  }

  // RESPALDO 2 (el que garantiza) — al guardar, si hay un archivo elegido que
  // todavía no se subió, se sube AQUÍ antes de enviar el registro.
  const handleSubmitForm = async (data: BirthdayFormData) => {
    let url = fotoUrl
    const f = fotoInputRef.current?.files?.[0]
    if (f) {
      const firma = `${f.name}|${f.size}|${f.lastModified}`
      if (firma !== firmaRef.current || !url) {
        firmaRef.current = firma
        const subida = await subirFoto(f)
        if (subida) url = subida
      }
    }
    if (!url && fotoStatus === 'error') {
      // La foto no se pudo subir: avisamos y NO guardamos para no perder el aviso
      return
    }
    await onSubmit({ ...data, foto: url || undefined })
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
              Fecha de Nacimiento
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
                  Foto (opcional)
                </label>

                {/* El botón es solo VISUAL: encima va el input file transparente a
                    tamaño completo, así el usuario toca el input DIRECTAMENTE (sin
                    label intermediario). Es el patrón más compatible en Android/iOS.
                    OJO: nunca poner onClick que limpie input.value aquí — en Android
                    el navegador dispara un click extra al cerrar la galería y eso
                    borraba la foto antes de leerla (la causa del "no pasa nada"). */}
                <div className="relative">
                  <div className="btn-secondary w-full flex items-center justify-center gap-2 pointer-events-none">
                    <Image className="w-4 h-4" />
                    {fotoUrl ? 'Cambiar foto' : 'Subir foto'}
                  </div>
                  <input
                    id="foto-file"
                    ref={fotoInputRef}
                    type="file"
                    accept="image/*"
                    aria-label="Subir foto"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChangeCapture={() => void leerArchivoDelInput()}
                    onChange={() => void leerArchivoDelInput()}
                    onInput={() => void leerArchivoDelInput()}
                  />
                </div>

                <p className="mt-1 text-xs text-neutral-500">
                  Si pones foto, sale en la tarjeta en lugar del emoji. JPG, PNG, WEBP o GIF (máx 8 MB).
                </p>

                {/* Diagnóstico temporal: muestra si el selector entregó el archivo.
                    Sirve para verlo desde el celular sin abrir la consola. */}
                <p className="mt-1 text-[10px] text-neutral-400 leading-tight break-all">
                  diag v2 · selector: {diagInput} · estado: {fotoStatus}
                </p>

                {/* Estado de la subida */}
                {fotoStatus === 'subiendo' && (
                  <p className="mt-2 text-sm text-primary-600 flex items-center gap-1.5">
                    <Loader2 className="w-4 h-4 animate-spin" /> Subiendo {fotoNombre}…
                  </p>
                )}
                {fotoStatus === 'listo' && (
                  <p className="mt-2 text-sm text-green-600 flex items-center gap-1.5">
                    <span>✓</span> Foto lista
                  </p>
                )}
                {fotoStatus === 'error' && (
                  <p className="mt-2 text-sm text-red-600 flex items-start gap-1.5">
                    <X className="w-4 h-4 mt-0.5 shrink-0" /> {fotoError}
                  </p>
                )}

                {/* Vista previa + quitar */}
                {fotoUrl && (
                  <div className="mt-3 flex items-center gap-3">
                    <img
                      src={fotoUrl}
                      alt="Vista previa de la foto"
                      className="w-16 h-16 rounded-full object-cover border-2"
                      style={{ borderColor: '#e8792e' }}
                    />
                    <span className="text-xs text-neutral-500">Así se verá en la tarjeta</span>
                    <button
                      type="button"
                      onClick={async () => {
                        const anterior = fotoUrl
                        setFotoUrl('')
                        setFotoStatus('idle')
                        setFotoError('')
                        firmaRef.current = ''
                        if (fotoInputRef.current) fotoInputRef.current.value = ''
                        if (anterior.startsWith('/api/uploads/')) {
                          const nombre = anterior.split('/').pop()
                          await fetch(`/api/uploads/${nombre}`, { method: 'DELETE' })
                        }
                      }}
                      className="btn-danger"
                      aria-label="Quitar foto"
                    >
                      🗑️ Quitar
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

          {/* Trazabilidad: quién creó/modificó (solo visible al editar) */}
          {initialData && (
            <div className="px-3 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1.5">
              <p className="text-xs text-neutral-400 uppercase tracking-wide flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" /> Auditoría del registro
              </p>
              <p className="text-xs text-neutral-600 flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5 text-neutral-400" />
                Alta: <span className="font-medium text-neutral-800">{initialData.creadoPor || '—'}</span>
              </p>
              <p className="text-xs text-neutral-600 flex items-center gap-1.5">
                <PencilLine className="w-3.5 h-3.5 text-neutral-400" />
                Últ. modificación:{' '}
                <span className="font-medium text-neutral-800">
                  {initialData.actualizadoPor || (initialData.creadoPor ? '—' : '—')}
                </span>
              </p>
            </div>
          )}

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