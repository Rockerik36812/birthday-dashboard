export interface Sucursal {
  id: string
  nombre: string
  color: string
  orden: number
  createdAt: Date
  updatedAt: Date
}

export interface Cumpleanos {
  id: string
  nombre: string
  fecha: Date
  mensaje: string
  emoji?: string | null
  foto?: string | null
  avisoDias?: number
  sucursalId: string
  sucursal?: Sucursal
  createdAt: Date
  updatedAt: Date
}

export interface CumpleanosConEdad extends Cumpleanos {
  edad: number
  diasParaCumple: number
  esHoy: boolean
  esEsteMes: boolean
}

export interface User {
  id: string
  email: string
  nombre: string | null
  rol: string
  emailVerified: Date | null
  image: string | null
  createdAt: Date
  updatedAt: Date
}

export type ViewMode = 'month' | 'list' | 'cards'
export type FilterType = 'all' | 'month' | 'today' | 'upcoming'