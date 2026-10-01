/**
 * Marca/instancia del dashboard, configurable por entorno.
 * - Producción (Erik N8N): default "Erik Servicios" (sin "Bamayacc").
 * - Bamayacc: se sobreescribe con NEXT_PUBLIC_BRAND="Bamayacc" en su Coolify.
 * NEXT_PUBLIC_ funciona en el cliente (componentes) y el server.
 */
export const BRAND =
  process.env.NEXT_PUBLIC_BRAND || 'Erik Servicios'

export const BRAND_FOOTER = `Birthday Dashboard ·${BRAND}`