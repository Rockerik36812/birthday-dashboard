'use client'

import { useState, useEffect } from 'react'
import { X, Building2, Plus, Loader2, Check, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SUCURSALES_DEFAULT_COLORS, getSucursalColor } from '@/lib/colors'

interface SucursalItem {
  id: string
  nombre: string
  color: string
  orden: number
}

interface SucursalesModalProps {
  isOpen: boolean
  onClose: () => void
  sucursales: SucursalItem[]
  onChanged: () => void
}

export function SucursalesModal({ isOpen, onClose, sucursales, onChanged }: SucursalesModalProps) {
  const [nombre, setNombre] = useState('')
  const [color, setColor] = useState<string>(SUCURSALES_DEFAULT_COLORS[0])
  const [isLoading, setIsLoading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      // Sugerir un color que no colisione con los existentes
      const usedColors = new Set(sucursales.map(s => s.color))
      const libre = SUCURSALES_DEFAULT_COLORS.find(c => !usedColors.has(c))
      setColor(libre || SUCURSALES_DEFAULT_COLORS[sucursales.length % SUCURSALES_DEFAULT_COLORS.length])
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen, sucursales])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim() || nombre.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres')
      return
    }
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/sucursales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre.trim(), color }),
      })
      if (!res.ok) throw new Error('Error al crear sucursal')
      setNombre('')
      setSuccess(`✅ Sucursal "${nombre.trim()}" creada`)
      onChanged()
      setTimeout(() => setSuccess(null), 2500)
    } catch (err) {
      setError('Hubo un error al crear la sucursal. Intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string, nombreSuc: string) => {
    if (!window.confirm(`¿Eliminar la sucursal "${nombreSuc}"?`)) return
    setDeleting(id)
    setError(null)
    try {
      const res = await fetch(`/api/sucursales/${id}`, { method: 'DELETE' })
      if (!res.ok && res.status !== 404) throw new Error('Error')
      onChanged()
    } catch {
      setError('Error al eliminar. Elimina primero los cumpleaños de esta sucursal.')
    } finally {
      setDeleting(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="gradient-primary p-4 flex items-center justify-between">
          <h2 className="text-white font-display font-bold text-lg">Gestionar Sucursales</h2>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors text-white" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Formulario crear */}
          <form onSubmit={handleCreate} className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-3">
            <h3 className="font-medium text-sm text-neutral-700 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary-500" />
              Nueva sucursal
            </h3>
            <div>
              <label className="label">Nombre</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="input"
                placeholder="Ej: Sucursal Centro"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="label">Color</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {SUCURSALES_DEFAULT_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      'w-8 h-8 rounded-full transition-transform hover:scale-110',
                      color === c && 'ring-2 ring-offset-2 ring-neutral-900 scale-110'
                    )}
                    style={{ backgroundColor: c }}
                    aria-label={`Color ${c}`}
                  />
                ))}
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}
            <button type="submit" disabled={isLoading} className="w-full btn-primary gap-2">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {isLoading ? 'Creando...' : 'Crear sucursal'}
            </button>
          </form>

          {/* Lista de sucursales */}
          {sucursales.length > 0 && (
            <div>
              <h3 className="font-medium text-sm text-neutral-700 mb-2">
                Sucursales existentes ({sucursales.length})
              </h3>
              <div className="space-y-2">
                {sucursales.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-neutral-200">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-5 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                      <span className="font-medium text-neutral-900 truncate">{s.nombre}</span>
                    </div>
                    <button
                      onClick={() => handleDelete(s.id, s.nombre)}
                      disabled={deleting === s.id}
                      className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-colors"
                      aria-label={`Eliminar ${s.nombre}`}
                    >
                      {deleting === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sucursales.length === 0 && (
            <div className="text-center py-6 text-neutral-500">
              <Building2 className="w-10 h-10 mx-auto text-neutral-300 mb-2" />
              <p className="text-sm">No hay sucursales todavía. Crea la primera arriba ↑</p>
              <p className="text-xs text-neutral-400 mt-1">Las sucursales organizan los cumpleaños (ej: por ciudad o área)</p>
            </div>
          )}

          <button type="button" onClick={onClose} className="w-full btn-secondary">
            <Check className="w-4 h-4" />
            Listo
          </button>
        </div>
      </div>
    </div>
  )
}