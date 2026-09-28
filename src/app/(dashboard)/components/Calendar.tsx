'use client'

import { useState } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Filter, Gift, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getSucursalColor, hexToRgba } from '@/lib/colors'
import { parseBirthdayLocal } from '@/lib/utils'
import { CumpleanosConEdad, Sucursal } from '@/types'

interface CalendarProps {
  cumpleanos: CumpleanosConEdad[]
  sucursales: Sucursal[]
  selectedSucursal: string | null
  onSucursalChange: (id: string | null) => void
  onAddClick: (date?: Date) => void
  onEditClick: (cumple: CumpleanosConEdad) => void
  currentMonth?: Date
  onMonthChange?: (month: Date) => void
}

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export function Calendar({
  cumpleanos,
  sucursales,
  selectedSucursal,
  onSucursalChange,
  onAddClick,
  onEditClick,
  currentMonth: currentMonthProp,
  onMonthChange,
}: CalendarProps) {
  // Mes controlado por el padre (para que el botón "Compartir Mes" coincida)
  const [currentMonthInternal, setCurrentMonthInternal] = useState(new Date())
  const currentMonth = currentMonthProp ?? currentMonthInternal
  const setCurrentMonth = (fn: (d: Date) => Date) => {
    const next = fn(currentMonth)
    ;(onMonthChange ?? setCurrentMonthInternal)(next)
  }
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  const filteredCumpleanos = selectedSucursal
    ? cumpleanos.filter(c => c.sucursalId === selectedSucursal)
    : cumpleanos

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const getCumpleanosForDay = (date: Date) =>
    filteredCumpleanos.filter(c => {
      const cd = parseBirthdayLocal(c.fecha)
      return cd.getMonth() === date.getMonth() && cd.getDate() === date.getDate()
    })

  // Cumpleaños del mes mostrado (compara solo mes/día, ignora el año de nacimiento)
  const cumpleanosDelMes = filteredCumpleanos.filter(c => {
    const cd = parseBirthdayLocal(c.fecha)
    return cd.getMonth() === currentMonth.getMonth()
  })

  // Reunir los días en semanas
  const weeks: Date[][] = []
  let cursor = calendarStart
  while (cursor <= calendarEnd) {
    const week = Array.from({ length: 7 }).map((_, i) => addDays(cursor, i))
    weeks.push(week)
    cursor = addDays(cursor, 7)
  }

  const renderDay = (date: Date, isCurrentMonth: boolean) => {
    const dayCumpleanos = getCumpleanosForDay(date)
    const today = isToday(date)
    const selected = selectedDay ? isSameDay(date, selectedDay) : false
    const has = dayCumpleanos.length > 0
    // Color principal del día (primer cumpleaños)
    const color = dayCumpleanos[0]?.sucursal?.color || getSucursalColor(0)

    return (
      <div key={date.toISOString()} className="flex flex-col items-center gap-0.5 sm:gap-1 select-none">
        {/* Número en círculo */}
        <button
          onClick={() => setSelectedDay(date)}
          className={cn(
            'relative flex items-center justify-center rounded-full transition-all duration-150',
            'w-7 h-7 sm:w-11 sm:h-11 text-[11px] sm:text-sm font-semibold sm:font-bold',
            // Hoy: relleno rosa con borde
            today && 'bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-md shadow-primary-200',
            // Con cumpleaños (no hoy): círculo de color con texto blanco
            !today && has && 'ring-0 text-white',
            // Sin cumpleaños
            !today && !has && 'text-neutral-500 hover:bg-neutral-100',
            // Fuera de mes
            !isCurrentMonth && 'opacity-40',
            // Seleccionado
            selected && !today && 'ring-2 ring-primary-300 ring-offset-0'
          )}
          style={
            !today && has
              ? { backgroundColor: color, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }
              : undefined
          }
          aria-label={`Día ${format(date, 'd')} de ${format(date, 'MMMM', { locale: es })}`}
        >
          {format(date, 'd', { locale: es })}
        </button>

        {/* Indicador: mini puntos cuando hay varios cumpleaños en un día */}
        <div className="flex items-center gap-0.5 min-h-[6px] sm:min-h-[8px]">
          {has && dayCumpleanos.length > 0 ? (
            dayCumpleanos.slice(0, 4).map(cumple => (
              <span
                key={cumple.id}
                className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full"
                style={{ backgroundColor: cumple.sucursal?.color || getSucursalColor(0) }}
              />
            ))
          ) : (
            <span className="w-1 h-1" />
          )}
        </div>
      </div>
    )
  }

  const detailCumpleanos = selectedDay ? getCumpleanosForDay(selectedDay) : cumpleanosDelMes

  return (
    <div className="card overflow-hidden animate-in">
      {/* Header */}
      <div className="p-3 sm:p-5 border-b border-neutral-100">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setCurrentMonth(d => addDays(startOfMonth(d), -1))}
            className="p-2 rounded-xl hover:bg-white text-primary-500 transition-colors"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <div className="text-center flex-1 min-w-0">
            <h2 className="text-base sm:text-2xl font-display font-bold text-neutral-900 capitalize truncate">
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </h2>
            <p className="text-[11px] sm:text-sm text-neutral-500 truncate">
              {cumpleanosDelMes.length} cumpleaños este mes
            </p>
          </div>

          <button
            onClick={() => setCurrentMonth(d => addDays(startOfMonth(d), 32))}
            className="p-2 rounded-xl hover:bg-white text-primary-500 transition-colors"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Control de sucursal */}
        <div className="flex items-center gap-2 mt-3 sm:mt-4">
          <div className="relative flex-1">
            <Filter className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={selectedSucursal || 'all'}
              onChange={(e) => onSucursalChange(e.target.value || null)}
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-neutral-200 bg-white text-sm font-medium text-neutral-700 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 appearance-none cursor-pointer"
            >
              <option value="all">Todas las sucursales</option>
              {sucursales.map(s => (
                <option key={s.id} value={s.id} style={{ color: s.color }}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => onAddClick()}
            className="btn-primary gap-1.5 sm:gap-2 px-3 sm:px-4 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Agregar</span>
          </button>
        </div>

        {/* Días de la semana */}
        <div className="grid grid-cols-7 mt-3 sm:mt-5 text-center gap-1">
          {DIAS.map((day, i) => (
            <div key={i} className="text-[10px] sm:text-xs font-bold text-primary-500 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>
      </div>

      {/* Grid del calendario */}
      <div className="p-2 sm:p-6 sm:pt-4">
        <div className="grid grid-cols-7 gap-y-1 sm:gap-y-3">
          {weeks.map((week, wi) =>
            week.map((day) => renderDay(day, isSameMonth(day, currentMonth)))
          )}
        </div>

        {/* Lista de cumpleaños del día/mes */}
        <div className="mt-4 sm:mt-6 border-t border-neutral-100 pt-3 sm:pt-4">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h3 className="text-sm sm:text-base font-bold text-neutral-800 flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-primary-500" />
              {selectedDay ? `Cumpleaños del día ${format(selectedDay, 'd', { locale: es })}` : 'Cumpleaños del mes'}
            </h3>
            {selectedDay && (
              <button onClick={() => setSelectedDay(null)} className="text-xs text-primary-500 hover:text-primary-700 font-medium">
                Ver todo el mes
              </button>
            )}
          </div>

          {detailCumpleanos.length === 0 ? (
            <div className="text-center py-6 text-neutral-400">
              <Building2 className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 text-neutral-200" />
              <p className="text-sm">Sin cumpleaños {selectedDay ? 'este día' : 'este mes'}</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-2.5">
              {detailCumpleanos.map(cumple => {
                const color = cumple.sucursal?.color || getSucursalColor(0)
                return (
                  <div
                    key={cumple.id}
                    onClick={() => onEditClick(cumple)}
                    className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl border border-neutral-100 hover:border-primary-200 hover:shadow-sm hover:bg-primary-50/30 transition-all cursor-pointer"
                  >
                    <span
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm sm:text-base font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      {cumple.nombre.charAt(0).toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-neutral-900 text-sm sm:text-base truncate">
                        {cumple.nombre}
                        {cumple.esHoy && <span className="ml-1 text-[10px] align-middle">🎂 Hoy</span>}
                      </p>
                      <p className="text-xs sm:text-sm text-neutral-500 flex items-center gap-1.5">
                        {format(parseBirthdayLocal(cumple.fecha), 'd MMMM', { locale: es })}
                        {cumple.sucursal && (
                          <span className="inline-flex items-center gap-1" style={{ color: cumple.sucursal.color }}>
                            · {cumple.sucursal.nombre}
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-neutral-400">
                      {cumple.edad} años
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}