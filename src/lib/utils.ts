import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday, startOfDay, endOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from './cn'
import { BRAND_FOOTER } from './brand'

export { cn }
export { format, formatDistanceToNow, isToday, isTomorrow, isYesterday, startOfDay, endOfDay, es }

/**
 * Convierte una fecha ISO (ej. "1989-06-16T00:00:00.000Z") a un objeto Date
 * con componentes LOCALES a mediodía. Evita el corrimiento de día por zona
 * horaria (UTC- medianoche -> día anterior en UTC-6). Sin esto, un cumpleaños
 * del 16 se mostraría el 15 en México.
 */
export function parseBirthdayLocal(birthDate: Date | string): Date {
  const src = typeof birthDate === 'string'
    ? birthDate
    : birthDate instanceof Date && !Number.isNaN(birthDate.getTime()) ? birthDate.toISOString() : ''
  if (!src) return new Date(birthDate)
  // Tomamos Y-M-D del inicio del ISO y construimos fecha local a mediodía
  const [y, m, d] = src.slice(0, 10).split('-').map(Number)
  if (!y || !m || !d || Number.isNaN(d)) return new Date(src)
  return new Date(y, m - 1, d, 12, 0, 0)
}

export function getAge(birthDate: Date | string): number {
  const birth = typeof birthDate === 'string' ? parseBirthdayLocal(birthDate) : birthDate
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

/**
 * Edad que cumple la persona en un AÑO concreto (no "hoy"). Útil para que la
 * tarjeta refleje la edad del cumpleaños mostrado en el calendario: si ves
 * junio 2026 → 37, si ves junio 2027 → 38.
 */
export function getAgeInYear(birthDate: Date | string, year: number): number {
  const birth = typeof birthDate === 'string' ? parseBirthdayLocal(birthDate) : birthDate
  return year - birth.getFullYear()
}

export function getDaysUntilBirthday(birthDate: Date | string): number {
  const birth = typeof birthDate === 'string' ? parseBirthdayLocal(birthDate) : birthDate
  const today = new Date()
  const nextBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate())
  if (nextBirthday < today) {
    nextBirthday.setFullYear(today.getFullYear() + 1)
  }
  const diff = nextBirthday.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function isBirthdayThisMonth(birthDate: Date | string): boolean {
  const birth = parseBirthdayLocal(birthDate)
  const today = new Date()
  return birth.getMonth() === today.getMonth()
}

export function isBirthdayToday(birthDate: Date | string): boolean {
  const birth = parseBirthdayLocal(birthDate)
  const today = new Date()
  return birth.getMonth() === today.getMonth() && birth.getDate() === today.getDate()
}

export function isBirthdayInMonth(birthDate: Date | string, monthIndex: number): boolean {
  const birth = parseBirthdayLocal(birthDate)
  return birth.getMonth() === monthIndex
}

export function generateWhatsAppMessage(nombre: string, mensaje: string, edad?: number): string {
  const edadText = edad ? ` (${edad} años)` : ''
  return `🎂 ¡Feliz Cumpleaños ${nombre}${edadText}!\n\n${mensaje}\n\n— Enviado desde\n${BRAND_FOOTER}`
}

export function generateWhatsAppGroupMessage(cumpleaneros: Array<{ nombre: string; mensaje: string; edad?: number }>, month?: Date): string {
  const base = month ?? new Date()
  const mes = base.toLocaleDateString('es-MX', { month: 'long' })
  const lineas = cumpleaneros.map((c, i) =>
    `${i + 1}. 🎂 ${c.nombre}${c.edad ? ` (${c.edad} años)` : ''}:\n   "${c.mensaje}"`
  ).join('\n\n')
  return `🎉 Cumpleañeros de ${mes.charAt(0).toUpperCase() + mes.slice(1)}\n\n${lineas}\n\n— Enviado desde\n${BRAND_FOOTER}`
}