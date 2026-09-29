/* Birthday Dashboard - Service Worker
 * Permite instalar la app como PWA (Chrome/Android/Linux) sin interferir
 * con las llamadas al servidor (login, datos, operaciones), porque toda la
 * app funciona en línea contra la BD.
 * SW pasivo: se registra con scope=/ (instalable) pero NO intercepta requests,
 * por lo que no rompe autenticación ni rutas API.
 */
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', () => {
  // Precarga del manifiesto para que Chrome/Android la reconozca como instalable
  fetch('site.webmanifest', { credentials: 'omit' }).catch(() => {})
})