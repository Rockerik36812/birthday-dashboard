'use client'

import { useState, useRef, useCallback } from 'react'
import html2canvas from 'html2canvas'
import { generateWhatsAppMessage, generateWhatsAppGroupMessage } from '@/lib/utils'
import { CumpleanosConEdad } from '@/types'
import { Share2, Download, Check, Loader2, X, Image } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getSucursalColor, hexToRgba } from '@/lib/colors'
import { format, parseBirthdayLocal, getAgeInYear } from '@/lib/utils'
import { es } from 'date-fns/locale'
import { Gift, MapPin, MessageSquare, Heart, Sparkles, Calendar, Image as ImageIcon } from 'lucide-react'

interface WhatsAppShareProps {
  cumple?: CumpleanosConEdad | null
  cumpleList?: CumpleanosConEdad[]
  mode: 'individual' | 'group'
  month?: Date
  onClose: () => void
}

export function WhatsAppShare({ cumple, cumpleList, mode, month, onClose }: WhatsAppShareProps) {
  const [imageBlob, setImageBlob] = useState<Blob | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [shareSuccess, setShareSuccess] = useState(false)
  const [shareMethod, setShareMethod] = useState<'whatsapp' | 'descarga' | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const captureRef = useRef<HTMLDivElement>(null)
  // Emoji personalizado o el regalo por defecto
  const themeEmoji = cumple?.emoji || null
  // Mes mostrado (para modo grupal)
  const refMonth = month ?? new Date()

  // ¿Estamos en celular (pantalla táctil) o escritorio?
  const isMobile = typeof window !== 'undefined' && (window.matchMedia?.('(pointer: coarse)').matches === true || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || ''))

  const items = mode === 'individual' ? (cumple ? [cumple] : []) : (cumpleList || [])
  const year = refMonth.getFullYear()
  const message = mode === 'individual'
    ? (cumple ? generateWhatsAppMessage(cumple.nombre, cumple.mensaje, getAgeInYear(cumple.fecha, year)) : '')
    : generateWhatsAppGroupMessage(items.map(c => ({ nombre: c.nombre, mensaje: c.mensaje, edad: getAgeInYear(c.fecha, year) })), refMonth)

  const generateCardImage = useCallback(async (): Promise<Blob | null> => {
    const el = captureRef.current || cardRef.current
    if (!el) return null

    setIsGenerating(true)
    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: el.scrollWidth,
        height: el.scrollHeight,
      })

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/png', 0.95)
      })

      if (blob) {
        setImageBlob(blob)
      }
      setIsGenerating(false)
      return blob
    } catch (error) {
      console.error('Error generando imagen:', error)
      setIsGenerating(false)
      return null
    }
  }, [])

  const handleShare = async () => {
    setIsSharing(true)
    try {
      let blob = imageBlob
      if (!blob) {
        blob = await generateCardImage()
      }

      if (!blob) {
        alert('No se pudo generar la imagen. Intenta de nuevo.')
        setIsSharing(false)
        return
      }

      const filename = `cumple-${mode === 'individual' ? (cumple?.nombre || 'cumple') : 'grupo'}-${format(new Date(), 'yyyy-MM-dd')}.png`
      const file = new File([blob], filename, { type: 'image/png' })

      if (isMobile) {
        // En el cel, la hoja de compartir nativa incluye WhatsApp (archivo adjunto listo)
        const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'
        if (canNativeShare) {
          try {
            await navigator.share({ files: [file], text: message })
            setShareSuccess(true)
            setShareMethod('whatsapp')
            setTimeout(() => setShareSuccess(false), 4000)
            return
          } catch (shareErr) {
            // El usuario canceló o no soporta archivos → respaldo descarga
          }
        }
        fallbackDownload(blob, filename)
      } else {
        // Escritorio: abrir WhatsApp Web directamente (no instalar la app).
        // Descarga la imagen + copia el texto, y abre web.whatsapp.com con el mensaje.
        fallbackDownload(blob, filename)
        window.open(`https://web.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank')
        setShareMethod('whatsapp')
      }
    } catch (error) {
      console.error('Error compartiendo:', error)
      alert('Error al compartir. Intenta de nuevo.')
    } finally {
      setIsSharing(false)
    }
  }

  const fallbackDownload = (blob: Blob, filename: string) => {
    // Descargar la imagen lista para adjuntar en WhatsApp
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    // Copiar el texto para pegarlo junto a la imagen
    try {
      navigator.clipboard?.writeText(message)
    } catch (_) {}
    setShareMethod('descarga')
    setShareSuccess(true)
    setTimeout(() => setShareSuccess(false), 5000)
  }

  const handleDownload = async () => {
    let blob = imageBlob
    if (!blob) {
      blob = await generateCardImage()
    }

    if (blob) {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cumple-${mode === 'individual' ? (cumple?.nombre || 'cumple') : 'grupo'}-${format(new Date(), 'yyyy-MM-dd')}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  // Renderizado de la tarjeta para captura
  const renderCard = () => {
    if (items.length === 0) return null

    if (mode === 'individual' && cumple) {
      const sucursalColor = cumple.sucursal?.color || '#EC407A'
      const edad = getAgeInYear(cumple.fecha, refMonth.getFullYear())
      const esHoy = cumple.esHoy

      return (
        <div
          ref={cardRef}
          className="w-[380px] p-6 rounded-2xl shadow-2xl relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${sucursalColor}15 0%, ${sucursalColor}05 50%, ${sucursalColor}15 100%)`,
            border: `3px solid ${sucursalColor}`,
          }}
        >
          {/* Decoraciones */}
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" style={{ backgroundColor: sucursalColor }}></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full opacity-10" style={{ backgroundColor: sucursalColor }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full opacity-5" style={{ backgroundColor: sucursalColor }}></div>

          <div className="relative z-10 text-center">
            {/* Header festivo */}
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ backgroundColor: hexToRgba(sucursalColor, 0.15) }}>
                <span className="text-4xl">{themeEmoji || '🎁'}</span>
              </div>
              {esHoy && (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-3 animate-pulse" style={{ backgroundColor: hexToRgba(sucursalColor, 0.2), color: sucursalColor }}>
                  <Heart className="w-5 h-5" />
                  <span className="font-bold text-sm">¡FELIZ CUMPLEAÑOS!</span>
                </div>
              )}
            </div>

            {/* Nombre */}
            <h2 className="font-display font-bold text-3xl text-neutral-900 mb-2">{cumple.nombre}</h2>

            {/* Sucursal */}
            {cumple.sucursal && (
              <div className="flex items-center justify-center gap-2 mb-4" style={{ color: sucursalColor }}>
                <MapPin className="w-5 h-5" />
                <span className="font-medium">{cumple.sucursal.nombre}</span>
              </div>
            )}

            {/* Edad y fecha */}
            <div className="grid grid-cols-3 gap-4 mb-6 p-4 rounded-xl" style={{ backgroundColor: hexToRgba(sucursalColor, 0.1) }}>
              <div>
                <p className="font-display font-bold text-3xl" style={{ color: sucursalColor }}>{edad}</p>
                <p className="text-xs text-neutral-500 uppercase tracking-wide">años</p>
              </div>
              <div className="border-x border-neutral-200/50">
                <p className="font-display font-bold text-2xl text-neutral-900">
                  {format(parseBirthdayLocal(cumple.fecha), 'd', { locale: es })}
                </p>
                <p className="text-sm text-neutral-600 capitalize">
                  {format(parseBirthdayLocal(cumple.fecha), 'MMMM', { locale: es })}
                </p>
              </div>
              <div>
                <p className="font-display font-bold text-2xl" style={{ color: sucursalColor }}>
                  {esHoy ? '🎂' : cumple.diasParaCumple}
                </p>
                <p className="text-xs text-neutral-500 uppercase tracking-wide">
                  {esHoy ? '¡Hoy!' : 'días'}
                </p>
              </div>
            </div>

            {/* Mensaje */}
            <div className="p-5 rounded-xl mb-4 italic text-neutral-800 leading-relaxed" style={{ backgroundColor: hexToRgba(sucursalColor, 0.08), border: `1px solid ${hexToRgba(sucursalColor, 0.2)}` }}>
              <MessageSquare className="w-5 h-5 mx-auto mb-2" style={{ color: sucursalColor }} />
              <p className="text-base">"{cumple.mensaje}"</p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-center gap-2 pt-4 border-t border-neutral-200/50">
              <Sparkles className="w-4 h-4" style={{ color: sucursalColor }} />
              <span className="text-sm text-neutral-600 leading-snug text-center">Birthday Dashboard<br/>·Bamayacc</span>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-3 opacity-30" style={{ background: `linear-gradient(90deg, transparent, ${sucursalColor}, transparent)` }}></div>
        </div>
      )
    }

    // Modo grupal
    const firstColor = items[0]?.sucursal?.color || '#EC407A'

    return (
      <div
        ref={cardRef}
        className="w-[380px] p-6 rounded-2xl shadow-2xl relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${firstColor}15 0%, ${firstColor}05 50%, ${firstColor}15 100%)`,
          border: `3px solid ${firstColor}`,
        }}
      >
        <div className="relative z-10 text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ backgroundColor: hexToRgba(firstColor, 0.15) }}>
              <Gift className="w-10 h-10" style={{ color: firstColor }} />
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-3" style={{ backgroundColor: hexToRgba(firstColor, 0.2), color: firstColor }}>
              <Calendar className="w-5 h-5" />
              <span className="font-bold text-sm">
                Cumpleañeros de {format(refMonth, 'MMMM', { locale: es }).charAt(0).toUpperCase() + format(refMonth, 'MMMM', { locale: es }).slice(1)}
              </span>
            </div>
          </div>

          <h2 className="font-display font-bold text-2xl text-neutral-900 mb-4">
            {items.length} cumpleañeros este mes
          </h2>

          <div className="space-y-3 mb-6 text-left">
            {items.map((c, i) => (
              <div
                key={c.id}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ backgroundColor: hexToRgba(c.sucursal?.color || firstColor, 0.1), border: `1px solid ${hexToRgba(c.sucursal?.color || firstColor, 0.2)}` }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: hexToRgba(c.sucursal?.color || firstColor, 0.2) }}>
                  <span className="font-bold text-sm" style={{ color: c.sucursal?.color || firstColor }}>{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-neutral-900 leading-snug break-words">{c.nombre}</p>
                  <p className="text-xs text-neutral-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {c.sucursal?.nombre}
                  </p>
                </div>
                <span className="text-sm font-bold" style={{ color: c.sucursal?.color || firstColor }}>
                  {getAgeInYear(c.fecha, refMonth.getFullYear())} años
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 pt-4 border-t border-neutral-200/50">
            <Sparkles className="w-4 h-4" style={{ color: firstColor }} />
            <span className="text-sm text-neutral-600 leading-snug text-center">Birthday Dashboard<br/>·Bamayacc</span>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-3 opacity-30" style={{ background: `linear-gradient(90deg, transparent, ${firstColor}, transparent)` }}></div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-gradient-to-r from-primary-50 to-secondary-50">
          <h2 className="font-display font-bold text-lg text-neutral-900">
            {mode === 'individual' ? 'Tarjeta de Cumpleaños' : 'Tarjeta Grupal del Mes'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white hover:bg-neutral-100 transition-colors text-neutral-600 hover:text-neutral-900"
            disabled={isGenerating || isSharing}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Vista previa */}
        <div className="p-4 flex-1 overflow-auto flex items-start justify-center bg-neutral-50">
          {items.length > 0 && (
            <div
              ref={captureRef}
              className="inline-block py-5 px-5 rounded-2xl shadow-sm bg-white"
              style={{ backgroundColor: '#ffffff' }}
            >
              {renderCard()}
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="p-4 border-t border-neutral-100 bg-white flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="flex-1 btn-secondary gap-2 justify-center"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Imagen</span>
          </button>
          <button
            onClick={handleShare}
            disabled={isGenerating || isSharing}
            className="flex-1 btn-whatsapp gap-2 justify-center relative"
          >
            {isGenerating && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSharing && <Loader2 className="w-4 h-4 animate-spin" />}
            {!isGenerating && !isSharing && <Share2 className="w-4 h-4" />}
            <span>{isGenerating ? 'Generando...' : isSharing ? 'Compartiendo...' : shareSuccess ? shareMethod === 'descarga' ? '¡Listo!' : '¡Enviado!' : 'Compartir Imagen'}</span>
            {shareSuccess && <Check className="w-4 h-4 text-green-500 animate-scale-in" />}
          </button>
        </div>

        <p className="px-4 pb-4 text-center text-xs text-neutral-500">
          {isGenerating || isSharing
            ? 'Generando la imagen...'
            : shareSuccess
              ? shareMethod === 'descarga'
                ? 'Imagen descargada (y texto copiado). Adjúntala en el chat de WhatsApp.'
                : isMobile
                  ? 'Imagen lista. Elige WhatsApp en la hoja de compartir para enviarla.'
                  : 'Se abrió WhatsApp Web. Descarga la imagen y adjúntala en el chat para enviarla.'
              : mode === 'individual'
                ? 'La tarjeta se comparte como imagen (con fondo blanco) para enviarla por WhatsApp'
                : 'Se comparte la tarjeta grupal como imagen para enviarla por WhatsApp'}
        </p>
      </div>
    </div>
  )
}