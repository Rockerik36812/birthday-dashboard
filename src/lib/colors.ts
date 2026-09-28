// Paleta A - Rosa suave / Coral
export const COLORS = {
  primary: {
    50: '#FCE4EC',
    100: '#F8BBD0',
    200: '#F48FB1',
    300: '#F06292',
    400: '#EC407A',
    500: '#E91E63',
    600: '#D81B60',
    700: '#C2185B',
    800: '#AD1457',
    900: '#880E4F',
  },
  secondary: {
    50: '#FFF3E0',
    100: '#FFE0B2',
    200: '#FFCC80',
    300: '#FFB74D',
    400: '#FFA726',
    500: '#FF9800',
    600: '#FB8C00',
    700: '#F57C00',
    800: '#EF6C00',
    900: '#E65100',
  },
  success: {
    50: '#E8F5E9',
    100: '#C8E6C9',
    500: '#4CAF50',
    600: '#43A047',
  },
  warning: {
    50: '#FFF8E1',
    100: '#FFECB3',
    500: '#FFC107',
    600: '#FFB300',
  },
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  white: '#FFFFFF',
  transparent: 'transparent',
} as const

export const SUCURSALES_DEFAULT_COLORS = [
  '#EC407A', // Rosa principal
  '#F06292', // Rosa claro
  '#BA68C8', // Lila
  '#9575CD', // Púrpura suave
  '#7986CB', // Azul suave
  '#64B5F6', // Azul cielo
  '#4FC3F7', // Celeste
  '#4DD0E1', // Turquesa
  '#4DB6AC', // Verde menta
  '#81C784', // Verde claro
  '#AED581', // Lima
  '#DCE775', // Amarillo verde
  '#FFF176', // Amarillo suave
  '#FFD54F', // Ámbar
  '#FFB74D', // Naranja suave
  '#FF8A65', // Coral
]

export function getSucursalColor(index: number): string {
  return SUCURSALES_DEFAULT_COLORS[index % SUCURSALES_DEFAULT_COLORS.length]
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.min(255, (num >> 16) + amt)
  const G = Math.min(255, ((num >> 8) & 0x00FF) + amt)
  const B = Math.min(255, (num & 0x0000FF) + amt)
  return `#${(0x1000000 + (R << 16) + (G << 8) + B).toString(16).slice(1)}`
}

export function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.max(0, (num >> 16) - amt)
  const G = Math.max(0, ((num >> 8) & 0x00FF) - amt)
  const B = Math.max(0, (num & 0x0000FF) - amt)
  return `#${(0x1000000 + (R << 16) + (G << 8) + B).toString(16).slice(1)}`
}