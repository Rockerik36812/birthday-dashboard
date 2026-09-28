import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday, startOfDay, endOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from './cn'

export { cn }
export { format, formatDistanceToNow, isToday, isTomorrow, isYesterday, startOfDay, endOfDay, es }

export function getAge(birthDate: Date | string): number {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

export function getDaysUntilBirthday(birthDate: Date | string): number {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate
  const today = new Date()
  const nextBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate())
  if (nextBirthday < today) {
    nextBirthday.setFullYear(today.getFullYear() + 1)
  }
  const diff = nextBirthday.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function isBirthdayThisMonth(birthDate: Date | string): boolean {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate
  const today = new Date()
  return birth.getMonth() === today.getMonth()
}

export function isBirthdayToday(birthDate: Date | string): boolean {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate
  const today = new Date()
  return birth.getMonth() === today.getMonth() && birth.getDate() === today.getDate()
}

export function generateWhatsAppMessage(nombre: string, mensaje: string, edad?: number): string {
  const edadText = edad ? ` (${edad} años)` : ''
  return `🎂 ¡Feliz Cumpleaños ${nombre}${edadText}!\n\n${mensaje}\n\n— Enviado desde Birthday Dashboard`
}

export function generateWhatsAppGroupMessage(cumpleaneros: Array<{ nombre: string; mensaje: string; edad?: number }>): string {
  const hoy = new Date()
  const mes = hoy.toLocaleDateString('es-MX', { month: 'long' })
  const lineas = cumpleaneros.map((c, i) =>
    `${i + 1}. 🎂 ${c.nombre}${c.edad ? ` (${c.edad} años)` : ''}:\n   "${c.mensaje}"`
  ).join('\n\n')
  return `🎉 Cumpleañeros de ${mes.charAt(0).toUpperCase() + mes.slice(1)}\n\n${lineas}\n\n— Birthday Dashboard`
}