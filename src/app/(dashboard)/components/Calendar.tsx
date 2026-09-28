'use client'

import { useState, useEffect, useRef } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Filter, Calendar as CalendarIcon, Gift, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getSucursalColor, hexToRgba } from '@/lib/colors'
import { CumpleanosConEdad, Sucursal } from '@/types'

interface CalendarProps {
  cumpleanos: CumpleanosConEdad[]
  sucursales: Sucursal[]
  selectedSucursal: string | null
  onSucursalChange: (id: string | null) => void
  onAddClick: (date?: Date) => void
  onEditClick: (cumple: CumpleanosConEdad) => void
}

export function Calendar({
  cumpleanos,
  sucursales,
  selectedSucursal,
  onSucursalChange,
  onAddClick,
  onEditClick,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')

  const filteredCumpleanos = selectedSucursal
    ? cumpleanos.filter(c => c.sucursalId === selectedSucursal)
    : cumpleanos

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const getCumpleanosForDay = (date: Date) => {
    return filteredCumpleanos.filter(c => {
      const cDate = new Date(c.fecha)
      return isSameDay(cDate, date)
    })
  }

  const getCumpleanosForWeek = (weekStart: Date) => {
    const weekEnd = addDays(weekStart, 6)
    return filteredCumpleanos.filter(c => {
      const cDate = new Date(c.fecha)
      return cDate >= weekStart && cDate <= weekEnd
    })
  }

  const renderDay = (date: Date, isCurrentMonth: boolean) => {
    const dayCumpleanos = getCumpleanosForDay(date)
    const today = isToday(date)
    const isSelected = false // Podríamos agregar selección de día

    return (
      <div
        key={date.toISOString()}
        className={cn(
          'relative min-h-[100px] p-2 border border-neutral-100 bg-white',
          !isCurrentMonth && 'bg-neutral-50/50 text-neutral-400',
          today && 'bg-primary-50 border-primary-200 shadow-inner',
          'transition-all duration-200 hover:bg-primary-50/30'
        )}
      >
        <div className={cn('flex justify-between items-start mb-1', today && 'text-primary-600 font-semibold')}>
          <span className="text-sm font-medium">{format(date, 'd', { locale: es })}</span>
          {today && <span className="text-xs badge-success">Hoy</span>}
        </div>

        {dayCumpleanos.length > 0 && (
          <div className="space-y-1 max-h-[70px] overflow-y-auto pr-1">
            {dayCumpleanos.slice(0, 3).map(cumple => (
              <div
                key={cumple.id}
                onClick={(e) => { e.stopPropagation(); onEditClick(cumple); }}
                className="cursor-pointer group"
              >
                <div
                  className={cn(
                    'px-2 py-1 rounded-lg text-xs font-medium truncate transition-all duration-200',
                    'group-hover:shadow-sm group-hover:scale-[1.02]'
                  )}
                  style={{
                    backgroundColor: hexToRgba(cumple.sucursal?.color || getSucursalColor(0), 0.15),
                    borderLeft: `3px solid ${cumple.sucursal?.color || getSucursalColor(0)}`,
                    color: cumple.sucursal?.color || getSucursalColor(0),
                  }}
                >
                  {cumple.nombre}
                  {cumple.esHoy && <span className="ml-1 animate-pulse">🎂</span>}
                </div>
              </div>
            ))}
            {dayCumpleanos.length > 3 && (
              <div
                onClick={(e) => { e.stopPropagation(); onAddClick(date); }}
                className="text-xs text-center text-neutral-500 hover:text-primary-600 cursor-pointer px-2 py-1 rounded-lg hover:bg-primary-50"
              >
                +{dayCumpleanos.length - 3} más
              </div>
            )}
          </div>
        )}

        {!dayCumpleanos.length && isCurrentMonth && (
          <button
            onClick={(e) => { e.stopPropagation(); onAddClick(date); }}
            className="w-full h-8 border-2 border-dashed border-neutral-200 rounded-lg text-neutral-300 hover:border-primary-300 hover:text-primary-500 hover:bg-primary-50 transition-all text-xs font-medium"
          >
            +
          </button>
        )}
      </div>
    )
  }

  const renderWeek = (weekStart: Date) => {
    const weekCumpleanos = getCumpleanosForWeek(weekStart)
    return (
      <div key={weekStart.toISOString()} className="flex gap-1">
        {Array.from({ length: 7 }).map((_, i) => {
          const day = addDays(weekStart, i)
          const isCurrentMonth = isSameMonth(day, currentMonth)
          return (
            <div key={i} className="flex-1">
              {renderDay(day, isCurrentMonth)}
            </div>
          )
        })}
      </div>
    )
  }

  const weeks = []
  let weekStart = calendarStart
  while (weekStart <= calendarEnd) {
    weeks.push(weekStart)
    weekStart = addDays(weekStart, 7)
  }

  return (
    <div className="card overflow-hidden animate-in">
      {/* Header del calendario */}
      <div className="p-4 border-b border-neutral-100 bg-gradient-to-r from-primary-50 to-secondary-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentMonth(d => addDays(startOfMonth(d), -1))}
              className="p-2 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow text-primary-600 hover:text-primary-700"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center min-w-[200px]">
              <h2 className="text-xl font-display font-bold text-neutral-900 capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: es })}
              </h2>
              <p className="text-sm text-neutral-500">
                {filteredCumpleanos.filter(c => isSameMonth(new Date(c.fecha), currentMonth)).length} cumpleaños este mes
              </p>
            </div>
            <button
              onClick={() => setCurrentMonth(d => addDays(startOfMonth(d), 32))}
              className="p-2 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow text-primary-600 hover:text-primary-700"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Filter className="w-5 h-5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={selectedSucursal || 'all'}
                onChange={(e) => onSucursalChange(e.target.value || null)}
                className="pl-10 pr-8 py-2 rounded-xl border border-neutral-200 bg-white text-sm font-medium text-neutral-700 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 appearance-none cursor-pointer"
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
              className="btn-primary gap-2"
            >
              <Plus className="w-4 h-4" />
              Agregar
            </button>
          </div>
        </div>

        {/* Días de la semana */}
        <div className="grid grid-cols-7 gap-1 mt-4 text-center">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day, i) => (
            <div key={i} className="py-2 px-1 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
              {day}
            </div>
          ))}
        </div>
      </div>

      {/* Grid del calendario */}
      <div className="p-2">
        <div className="grid grid-cols-7 gap-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="contents">
              {renderWeek(week)}
            </div>
          ))}
        </div>
      </div>

      {/* Leyenda */}
      <div className="px-4 pb-4 border-t border-neutral-100">
        <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-primary-50"></div>
            <span>Hoy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded animate-pulse" style={{ backgroundColor: '#EC407A' }}></div>
            <span>Cumpleaños hoy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded border-2 border-dashed border-neutral-300"></div>
            <span>Sin cumpleaños</span>
          </div>
        </div>
      </div>
    </div>
  )
}