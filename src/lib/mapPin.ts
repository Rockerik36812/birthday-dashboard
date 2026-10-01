'use client'

/**
 * Pin de mapa (cabeza + punta) generado como PNG vía <canvas> y devuelto
 * como data-URI.
 *
 * Por qué PNG y no el SVG de Lucide: html2canvas 1.4.1 clona el DOM y, al
 * redibujar, posiciona los SVG inline según un cálculo de línea base que
 * varía por navegador (desfasa el pin en la imagen compartida aunque en
 * pantalla se vea bien). Un <img> con PNG plano lo dibuja idéntico en
 * cualquier navegador y queda alineado por vertical-align.
 *
 * El result es una cadena data:image/png;base64 o SVG de Lucide no…
 * Muy bien cacheado por color con un Map<color, dataURI>.
 */

const pinCache = new Map<string, string>()

export function mapPinPng(color = '#EC407A', size = 20): string {
  const hit = pinCache.get(color)
  if (hit) return hit

  // Escala x3 para nitidez en la captura (html2canvas usa scale:2)
  const s = size * 3
  const canvas = document.createElement('canvas')
  canvas.width = s
  canvas.height = s
  const g = canvas.getContext('2d')
  if (g) {
    // Cabeza redonda
    g.beginPath()
    g.arc(s / 2, s * 0.30, s * 0.32, 0, Math.PI * 2)
    g.fillStyle = color
    g.fill()
    // Punta (triángulo apuntando abajo)
    g.beginPath()
    g.moveTo(s * 0.18, s * 0.52)
    g.lineTo(s * 0.82, s * 0.52)
    g.lineTo(s * 0.50, s * 0.90)
    g.closePath()
    g.fillStyle = color
    g.fill()
  } else {
    // Sin canvas (fallback mínimo): un punto sólido
    return `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="10" r="6" fill="${color}"/></svg>`)}`
  }

  const dataURI = canvas.toDataURL('image/png')
  pinCache.set(color, dataURI)
  return dataURI
}