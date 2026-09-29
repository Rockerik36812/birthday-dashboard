import { prisma } from '@/lib/prisma'
import webpush from 'web-push'

/**
 * Lógica de recordatorios de cumpleaños.
 *
 * Dos niveles:
 *  - "mañana": aviso un día antes (9:00 AM y 12:00 PM)
 *  - "hoy":   alerta más fuerte el mero día (9:00 AM y 12:00 PM)
 *
 * Se dispara desde el endpoint /api/reminders cuando un cron llama con el
 * secreto correcto. Compara por mes+día (ignorando el año, porque los
 * cumpleaños se guardan con el año de nacimiento).
 */

export interface ReminderSummary {
  sentToday: number
  sentTomorrow: number
  birthdaysToday: string[]
  birthdaysTomorrow: string[]
  subscribers: number
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

export function getMD(d: Date): string {
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function addDays(d: Date, days: number): Date {
  const cp = new Date(d)
  cp.setDate(cp.getDate() + days)
  return cp
}

function getVAPIDKeys() {
  const publicKey = process.env.VAPID_PUBLIC_KEY || ''
  const privateKey = process.env.VAPID_PRIVATE_KEY || ''
  if (!publicKey || !privateKey) {
    throw new Error(
      'Faltan claves VAPID (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY). No se envían notificaciones push.'
    )
  }
  return { publicKey, privateKey }
}

/**
 * Envía una notificación Web Push a todas las suscripciones registradas.
 * `kind` controla el mensaje (día antes = aviso; hoy = alerta fuerte).
 */
export async function sendPushNotifications(
  kind: 'today' | 'tomorrow',
  nombres: string[]
): Promise<{ ok: number; fail: number }> {
  const keys = getVAPIDKeys()
  if (nombres.length === 0) return { ok: 0, fail: 0 }

  const subs = await prisma.pushSubscription.findMany({ orderBy: { createdAt: 'desc' } })
  if (subs.length === 0) return { ok: 0, fail: 0 }

  let ok = 0
  let fail = 0
  const payload = JSON.stringify({ kind, nombres })

  for (const sub of subs) {
    try {
      const existed = Boolean(sub.endpoint)
      if (!existed) continue
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload,
        {
          vapidDetails: {
            subject: process.env.VAPID_CONTACT || 'mailto:erik36812@gmail.com',
            publicKey: keys.publicKey,
            privateKey: keys.privateKey,
          },
          // La version de web-push instalada acepta 'TTL' en mayusculas
          // ('ttl' minuscula devuelve 'invalid option'). El tipo TS dice
          // 'ttl' pero el runtime exige 'TTL' (desincronizacion tipo/runtime);
          // casteamos a las opciones reales. 86400 es requerido para WNS/Windows.
          TTL: 86400,
        } as unknown as Parameters<typeof webpush.sendNotification>[2]
      )
      ok++
    } catch (e: any) {
      // Endpoint antiguo/inválido (410 Gone) → limpiar suscripción
      if (e && e.statusCode === 410 && sub.id) {
        try {
          await prisma.pushSubscription.delete({ where: { id: sub.id } })
        } catch (_) {}
      }
      fail++
    }
  }

  return { ok, fail }
}

/**
 * Calcula los cumpleaños de hoy, de mañana (y opcionalmente los de ayer como
 * referencia) comparando mes+día. Devuelve los nombres.
 */
export async function computeReminders(): Promise<ReminderSummary> {
  const now = new Date()
  const todayMd = getMD(now)
  const tomorrowMd = getMD(addDays(now, 1))

  const all = await prisma.cumpleanos.findMany({
    where: { nombre: { not: '' } },
    select: { nombre: true, fecha: true, sucursal: { select: { nombre: true } } },
    orderBy: { nombre: 'asc' },
  })

  const birthdaysToday = all
    .filter((c) => getMD(c.fecha) === todayMd)
    .map((c) => c.nombre)
  const birthdaysTomorrow = all
    .filter((c) => getMD(c.fecha) === tomorrowMd)
    .map((c) => c.nombre)

  const subscribers = await prisma.pushSubscription.count()

  return {
    sentToday: 0,
    sentTomorrow: 0,
    birthdaysToday,
    birthdaysTomorrow,
    subscribers,
  }
}

/**
 * Main entry: computed fechas y envía push. Devuelve resumen.
 */
export async function runReminders(): Promise<ReminderSummary> {
  const summary = await computeReminders()

  if (summary.birthdaysToday.length > 0) {
    const res = await sendPushNotifications('today', summary.birthdaysToday)
    summary.sentToday = res.ok
  }
  if (summary.birthdaysTomorrow.length > 0) {
    const res = await sendPushNotifications('tomorrow', summary.birthdaysTomorrow)
    summary.sentTomorrow = res.ok
  }

  return summary
}