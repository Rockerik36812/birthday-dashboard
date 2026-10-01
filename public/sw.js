/* Birthday Dashboard - Service Worker
 * Roles:
 *  1) Habilita la instalación como PWA (scope=/).
 *  2) Recibe las notificaciones Web Push de recordatorios de cumpleaños:
 *     - kind == "today"    → alerta fuerte (el mero día) 🎂
 *     - kind == "tomorrow" → aviso (un día antes) 🔔
 * NO intercepta requests: la app funciona en línea contra la BD.
 */
const SW_VERSION = 'v6' // bump al cambiar el SW para forzar su actualizacion

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  // Tomar control de todas las pestanas al instante (no esperar recarga)
  event.waitUntil(self.clients.claim())
  // Precarga del manifiesto para que Chrome/Android la reconozca como instalable
  fetch('site.webmanifest', { credentials: 'omit' }).catch(() => {})
})

// Extrae el JSON del payload de un push de forma robusta (varios formatos).
function parsePayload(data) {
  if (!data) return {}
  try {
    // PushMessageData.json()
    if (typeof data.json === 'function') return data.json()
  } catch (_) {}
  try {
    // PushMessageData.text()
    if (typeof data.text === 'function') {
      const s = data.text()
      if (s) return JSON.parse(s)
    }
  } catch (_) {}
  // Cadena directa (data ya es string)
  if (typeof data === 'string') {
    try { return JSON.parse(data) } catch (_) {}
  }
  return {}
}

self.addEventListener('push', (event) => {
  const data = parsePayload(event.data)
  const esHoy = data.kind === 'today'
  const esUpcoming = data.kind === 'upcoming'
  const nombres = Array.isArray(data.nombres) ? data.nombres : []
  const lista = nombres.join(', ')
  const dias = parseInt((data.dias ?? '').toString(), 10)
  const icon = data.icon || '/icons/icon-192x192.png'
  const badge = '/icons/icon-192x192.png'

  let title, body
  if (esHoy) {
    title = nombres.length > 1 ? `🎂 ¡Hoy cumplen ${nombres.length}! 🎉` : `🎂 ¡Hoy cumple ${lista}! 🎉`
    body = 'Es su gran día. ¡Felicítalo! 💐'
  } else if (esUpcoming && dias > 1) {
    title = nombres.length > 1 ? `⏰ En ${dias} días cumplen ${nombres.length}` : `⏰ En ${dias} días cumple ${lista}`
    body = '¡No lo dejes pasar! Prepara tu felicitación. 🎁'
  } else {
    title = nombres.length > 1 ? `🔔 Mañana cumplen ${nombres.length} 🎁` : `🔔 Mañana cumple ${lista} 🎁`
    body = 'Prepárate para felicitarlo. 🎉'
  }

  event.waitUntil(self.registration.showNotification(title, {
    body: body,
    icon: icon,
    badge: badge,
    tag: 'birthday-reminder',
    renotify: true,
    requireInteraction: esHoy,
    data: { url: '/' },
    actions: [
      { action: 'open', title: 'Ver dashboard' },
      { action: 'close', title: 'Cerrar' },
    ],
  }).catch(() => {
    // Fallback si la API de notificaciones nativas no está (SW heredado):
    // abrimos la app para que la alerta in-app del dashboard la muestre.
    if (self.clients && self.clients.openWindow) {
      self.clients.openWindow('/')
    }
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  if (event.action === 'open' && self.clients && self.clients.focus) {
    event.waitUntil(self.clients.focus({ url: '/' }))
  }
})