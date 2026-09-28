'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Loader2, Building2, Gift, Calendar as CalendarIcon, Filter, Plus, Download, Settings, LogOut, ChevronDown, Sparkles, Trash2, Info } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { getAge, getDaysUntilBirthday, isBirthdayToday, isBirthdayThisMonth } from '@/lib/utils'
import { Calendar } from '@/app/(dashboard)/components/Calendar'
import { BirthdayModal } from '@/app/(dashboard)/components/BirthdayModal'
import { WhatsAppShare } from '@/app/(dashboard)/components/WhatsAppShare'
import { BirthdayCard } from '@/app/(dashboard)/components/BirthdayCard'
import { CumpleanosConEdad, Sucursal } from '@/types'
import { hexToRgba } from '@/lib/colors'

function Dashboard() {
  const { data: session, status } = useSession()
  const [cumpleanos, setCumpleanos] = useState<CumpleanosConEdad[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [selectedSucursal, setSelectedSucursal] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCumple, setEditingCumple] = useState<CumpleanosConEdad | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showWhatsAppShare, setShowWhatsAppShare] = useState<{ mode: 'individual' | 'group'; cumple?: CumpleanosConEdad } | null>(null)
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'cards'>('calendar')

  // Cargar datos
  const fetchData = async () => {
    try {
      const [cumpleRes, sucRes] = await Promise.all([
        fetch('/api/cumpleanos'),
        fetch('/api/sucursales'),
      ])
      const cumpleData = await cumpleRes.json()
      const sucData = await sucRes.json()

      const hoy = new Date()
      const cumpleWithMeta: CumpleanosConEdad[] = cumpleData.map((c: any) => ({
        ...c,
        fecha: new Date(c.fecha),
        edad: getAge(c.fecha),
        diasParaCumple: getDaysUntilBirthday(c.fecha),
        esHoy: isBirthdayToday(c.fecha),
        esEsteMes: isBirthdayThisMonth(c.fecha),
      }))

      setCumpleanos(cumpleWithMeta)
      setSucursales(sucData)
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData()
    }
  }, [status])

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true)
    try {
      const url = editingCumple ? `/api/cumpleanos/${editingCumple.id}` : '/api/cumpleanos'
      const method = editingCumple ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Error guardando')
      await fetchData()
      setIsModalOpen(false)
      setEditingCumple(null)
    } catch (error) {
      console.error('Error:', error)
      alert('Error al guardar. Intenta de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este cumpleaños?')) return
    try {
      await fetch(`/api/cumpleanos/${id}`, { method: 'DELETE' })
      await fetchData()
    } catch (error) {
      alert('Error al eliminar')
    }
  }

  const handleShareIndividual = (cumple: CumpleanosConEdad) => {
    setShowWhatsAppShare({ mode: 'individual', cumple })
  }

  const handleShareGroup = () => {
    const mesActual = new Date().getMonth()
    const cumpleMes = cumpleanos.filter(c => new Date(c.fecha).getMonth() === mesActual)
    if (cumpleMes.length === 0) {
      alert('No hay cumpleaños este mes')
      return
    }
    setShowWhatsAppShare({ mode: 'group', cumple: cumpleMes[0] })
  }

  const filteredCumpleanos = selectedSucursal
    ? cumpleanos.filter(c => c.sucursalId === selectedSucursal)
    : cumpleanos

  const cumpleMes = filteredCumpleanos.filter(c => isBirthdayThisMonth(c.fecha))
  const cumpleHoy = filteredCumpleanos.filter(c => isBirthdayToday(c.fecha))
  const cumpleProximos = filteredCumpleanos
    .filter(c => !isBirthdayToday(c.fecha) && c.diasParaCumple <= 30)
    .sort((a, b) => a.diasParaCumple - b.diasParaCumple)
    .slice(0, 5)

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
          <p className="text-neutral-600">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-neutral-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl gradient-primary">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-display font-bold text-xl text-neutral-900">Birthday Dashboard</h1>
                <p className="text-xs text-neutral-500">Panel de Cumpleaños del Equipo</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Stats rápidos */}
              <div className="hidden sm:flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-success-600">
                  <Gift className="w-4 h-4" />
                  <span>{cumpleHoy.length} hoy</span>
                </div>
                <div className="flex items-center gap-1.5 text-primary-600">
                  <CalendarIcon className="w-4 h-4" />
                  <span>{cumpleMes.length} este mes</span>
                </div>
              </div>

              {/* Botones de vista */}
              <div className="flex items-center gap-1 bg-neutral-100 rounded-xl p-1">
                {(['calendar', 'list', 'cards'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={cn(
                      'p-2 rounded-lg transition-all duration-200 text-neutral-500 hover:text-neutral-700',
                      viewMode === mode && 'bg-white text-primary-600 shadow-sm'
                    )}
                    aria-label={mode}
                  >
                    {mode === 'calendar' && <CalendarIcon className="w-5 h-5" />}
                    {mode === 'list' && <Filter className="w-5 h-5" />}
                    {mode === 'cards' && <Building2 className="w-5 h-5" />}
                  </button>
                ))}
              </div>

              {/* Usuario */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-neutral-900">
                    {(session?.user as any)?.nombre || session?.user?.email}
                  </p>
                  <p className="text-xs text-neutral-500">Administrador</p>
                </div>
                <button className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 transition-colors text-neutral-600">
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filtro de sucursal + stats */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
              <Building2 className="w-4 h-4 text-primary-500" />
              Filtrar por:
            </label>
            <select
              value={selectedSucursal || 'all'}
              onChange={(e) => setSelectedSucursal(e.target.value || null)}
              className="px-4 py-2 rounded-xl border border-neutral-200 bg-white text-sm font-medium text-neutral-700 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 appearance-none cursor-pointer min-w-[200px]"
            >
              <option value="all">🏢 Todas las sucursales ({cumpleanos.length})</option>
              {sucursales.map(s => (
                <option key={s.id} value={s.id} style={{ color: s.color }}>
                  🎯 {s.nombre} ({cumpleanos.filter(c => c.sucursalId === s.id).length})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handleShareGroup} className="btn-whatsapp gap-2" disabled={cumpleMes.length === 0}>
              <Gift className="w-4 h-4" />
              <span>Compartir Mes ({cumpleMes.length})</span>
            </button>
            <button onClick={() => { setEditingCumple(null); setIsModalOpen(true); }} className="btn-primary gap-2">
              <Plus className="w-4 h-4" />
              <span>Nuevo</span>
            </button>
          </div>
        </div>

        {/* Vista Calendario */}
        {viewMode === 'calendar' && (
          <Calendar
            cumpleanos={filteredCumpleanos}
            sucursales={sucursales}
            selectedSucursal={selectedSucursal}
            onSucursalChange={setSelectedSucursal}
            onAddClick={(date) => {
              setEditingCumple(null)
              setIsModalOpen(true)
            }}
            onEditClick={(cumple) => {
              setEditingCumple(cumple)
              setIsModalOpen(true)
            }}
          />
        )}

        {/* Vista Lista */}
        {viewMode === 'list' && (
          <div className="card overflow-hidden animate-in">
            <div className="p-4 border-b border-neutral-100">
              <h2 className="font-display font-bold text-lg text-neutral-900">
                Lista de cumpleaños ({filteredCumpleanos.length})
              </h2>
            </div>
            <div className="divide-y divide-neutral-100">
              {filteredCumpleanos.length === 0 ? (
                <div className="p-12 text-center">
                  <Gift className="w-12 h-12 mx-auto text-neutral-300 mb-4" />
                  <p className="text-neutral-500">No hay cumpleaños registrados</p>
                  <button onClick={() => setIsModalOpen(true)} className="mt-4 btn-primary inline-flex gap-2">
                    <Plus className="w-4 h-4" />
                    Agregar el primero
                  </button>
                </div>
              ) : (
                filteredCumpleanos.map(cumple => (
                  <div key={cumple.id} className="p-4 hover:bg-neutral-50 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: hexToRgba(cumple.sucursal?.color || '#EC407A', 0.15) }}>
                        <Gift className="w-6 h-6" style={{ color: cumple.sucursal?.color || '#EC407A' }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-neutral-900">{cumple.nombre}</h3>
                          {cumple.esHoy && <span className="badge badge-primary animate-pulse">¡HOY!</span>}
                          {cumple.esEsteMes && !cumple.esHoy && <span className="badge badge-warning">Este mes</span>}
                        </div>
                        <p className="text-sm text-neutral-500 flex items-center gap-1 mt-0.5">
                          <CalendarIcon className="w-3.5 h-3.5" />
                          {format(new Date(cumple.fecha), 'd MMMM', { locale: es })} · {cumple.edad} años
                        </p>
                        {cumple.sucursal && (
                          <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5" style={{ color: cumple.sucursal.color }}>
                            <Building2 className="w-3 h-3" />
                            {cumple.sucursal.nombre}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleShareIndividual(cumple)}
                        className="p-2 rounded-lg bg-primary-100 hover:bg-primary-200 text-primary-700 transition-colors"
                        aria-label="Compartir tarjeta"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setEditingCumple(cumple); setIsModalOpen(true); }}
                        className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-900 transition-colors"
                        aria-label="Editar"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cumple.id)}
                        className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-colors"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Vista Tarjetas */}
        {viewMode === 'cards' && (
          <div className="animate-in">
            <h2 className="font-display font-bold text-lg text-neutral-900 mb-4">
              Tarjetas del mes ({cumpleMes.length})
            </h2>
            {cumpleMes.length === 0 ? (
              <div className="card p-12 text-center">
                <Gift className="w-12 h-12 mx-auto text-neutral-300 mb-4" />
                <p className="text-neutral-500">No hay cumpleaños este mes</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {cumpleMes.map(cumple => (
                  <BirthdayCard
                    key={cumple.id}
                    cumple={cumple}
                    size="compact"
                    showActions
                    onShare={handleShareIndividual}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modales */}
      <BirthdayModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingCumple(null); }}
        onSubmit={handleSubmit}
        sucursales={sucursales}
        initialData={editingCumple ? {
          nombre: editingCumple.nombre,
          fecha: format(new Date(editingCumple.fecha), 'yyyy-MM-dd'),
          sucursalId: editingCumple.sucursalId,
          mensaje: editingCumple.mensaje,
        } : null}
        isLoading={isSubmitting}
      />

      {showWhatsAppShare && (
        <WhatsAppShare
          cumple={showWhatsAppShare.cumple}
          cumpleList={showWhatsAppShare.mode === 'group'
            ? filteredCumpleanos.filter(c => isBirthdayThisMonth(c.fecha))
            : undefined}
          mode={showWhatsAppShare.mode}
          onClose={() => setShowWhatsAppShare(null)}
        />
      )}
    </div>
  )
}

export default Dashboard