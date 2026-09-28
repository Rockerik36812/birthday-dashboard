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
    const hasBirthdays = dayCumpleanos.length > 0
    // Máximo de puntos a mostrar en móvil
    const dotLimit = 3

    return (
      <div
        key={date.toISOString()}
        onClick={() => dayCumpleanos.length > 0 && onEditClick(dayCumpleanos[0])}
        className={cn(
          'relative flex flex-col items-center sm:items-stretch justify-between cursor-pointer',
          'rounded-lg sm:rounded-xl border transition-all duration-200 select-none',
          // Móvil: celda cuadrada compacta; escritorio: más alta y espaciosa
          'aspect-square sm:aspect-auto p-0.5 sm:p-2 sm:min-h-[104px]',
          // Tema
          today
            ? 'bg-gradient-to-br from-primary-500 to-secondary-500 border-transparent text-white shadow-lg shadow-primary-200/60'
            : hasBirthdays
              ? 'bg-primary-50/50 border-primary-200/70 hover:border-primary-300 hover:shadow-md'
              : 'border-neutral-200/70 bg-white hover:border-primary-300 hover:bg-primary-50/30',
          !isCurrentMonth && 'border-transparent bg-neutral-50/60 text-neutral-400 opacity-60'
        )}
      >
        {/* Número del día */}
        <div className={cn(
          'flex items-center justify-between w-full',
          today ? 'text-white' : ''
        )}>
          <span className={cn(
            'font-medium leading-none',
            today
              ? 'text-white text-[11px] sm:text-sm font-bold bg-white/30 rounded-md px-1 py-0.5'
              : 'text-neutral-700 text-[11px] sm:text-sm'
          )}>
            {format(date, 'd', { locale: es })}
          </span>
          {today && <span className="text-[7px] sm:text-[10px] badge-success px-1">🎂 Hoy</span>}
        </div>

        {/* Indicador de cumpleaños (puntos de color) — MÓVIL */}
        <div className="sm:hidden flex items-center justify-center gap-1 min-h-[12px] pb-0.5">
          {hasBirthdays ? (
            dayCumpleanos.slice(0, dotLimit).map(cumple => (
              <span
                key={cumple.id}
                className="w-2 h-2 rounded-full border border-white/60"
                style={{ backgroundColor: today ? '#fff' : (cumple.sucursal?.color || getSucursalColor(0)) }}
              />
            ))
          ) : (
            today && <span className="w-2 h-2 rounded-full bg-white/70 border border-white/40" />
          )}
        </div>

        {/* Badge "+N" móvil: capa fija inferior para no alterar la cuadrícula */}
        {hasBirthdays && dayCumpleanos.length > dotLimit && (
          <span className="absolute bottom-1 right-1 sm:hidden text-[8px] font-bold text-primary-500 bg-primary-50 rounded-full px-1 leading-none">
            +{dayCumpleanos.length - dotLimit}
          </span>
        )}

        {/* Nombres de cumpleaños — ESCRITORIO */}
        <div className="hidden sm:block space-y-1 mt-1">
          {dayCumpleanos.length > 0 ? (
            <>
              {dayCumpleanos.slice(0, 3).map(cumple => {
                const color = cumple.sucursal?.color || getSucursalColor(0)
                return (
                  <div
                    key={cumple.id}
                    onClick={(e) => { e.stopPropagation(); onEditClick(cumple); }}
                    className={cn(
                      'cursor-pointer flex items-center gap-1.5 rounded-lg px-1.5 py-0.5 transition-all duration-150',
                      today ? 'bg-white/95 shadow-sm hover:scale-[1.02]' : 'hover:scale-[1.02] hover:shadow-sm'
                    )}
                    style={today ? undefined : { backgroundColor: hexToRgba(color, 0.12) }}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      {cumple.nombre.charAt(0).toUpperCase()}
                    </span>
                    <span
                      className="text-[11px] font-medium truncate leading-tight"
                      style={today ? { color: '#BE185D' } : { color }}
                    >
                      {cumple.nombre}
                      {cumple.esHoy && ' 🎂'}
                    </span>
                  </div>
                )
              })}
              {dayCumpleanos.length > 3 && (
                <div className="text-center text-[11px] font-semibold text-primary-600 py-0.5">
                  +{dayCumpleanos.length - 3} más
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Mini badge "+N" para móvil si hay más de 3 */}
        {hasBirthdays && dayCumpleanos.length > dotLimit && (
          <span className="absolute bottom-0.5 right-1 sm:hidden text-[7px] font-bold text-primary-500">
            +{dayCumpleanos.length - dotLimit}
          </span>
        )}
      </div>
    )
  }

  const renderWeek = (weekStart: Date) => {
    const weekCumpleanos = getCumpleanosForWeek(weekStart)
    return (
      <div key={weekStart.toISOString()} className="flex gap-px sm:gap-1">
        {Array.from({ length: 7 }).map((_, i) => {
          const day = addDays(weekStart, i)
          const isCurrentMonth = isSameMonth(day, currentMonth)
          return (
            <div key={i} className="flex-1 min-w-0">
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
            <div className="text-center min-w-0 sm:min-w-[200px] flex-1 sm:flex-none">
              <h2 className="text-lg sm:text-xl font-display font-bold text-neutral-900 capitalize truncate">
                {format(currentMonth, 'MMMM yyyy', { locale: es })}
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 truncate">
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

          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
            <div className="relative flex-1 sm:flex-none min-w-[140px]">
              <Filter className="w-5 h-5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={selectedSucursal || 'all'}
                onChange={(e) => onSucursalChange(e.target.value || null)}
                className="w-full pl-10 pr-8 py-2 rounded-xl border border-neutral-200 bg-white text-sm font-medium text-neutral-700 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 appearance-none cursor-pointer"
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
              className="btn-primary gap-2 flex-1 sm:flex-none justify-center"
            >
              <Plus className="w-4 h-4" />
              Agregar
            </button>
          </div>
        </div>

        {/* Días de la semana */}
        <div className="grid grid-cols-7 gap-1 mt-3 sm:mt-4 text-center">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day, i) => (
            <div key={i} className="py-1.5 sm:py-2 px-0.5 sm:px-1 text-[10px] sm:text-xs font-bold text-primary-600 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>
      </div>

      {/* Grid del calendario */}
      <div className="p-1.5 sm:p-3">
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="contents">
              {renderWeek(week)}
            </div>
          ))}
        </div>
      </div>

      {/* Leyenda */}
      <div className="px-4 py-3 sm:py-4 border-t border-neutral-100 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-neutral-600">
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
  )
}