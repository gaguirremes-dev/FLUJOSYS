import { create } from 'zustand'
import { dbGetPrestamos, dbSavePrestamo, dbDeletePrestamo } from '../db'
import {
  generarTablaAmortizacion,
  mapearFinanciamientoAPeriodos,
} from '../lib/calculos/amortizacion'
import type { CuotaAmortizacion, Prestamo, UnidadPeriodo } from '../types'

interface FinanciamientoStore {
  prestamos: Prestamo[]
  isLoaded: boolean
  cargar: () => Promise<void>
  agregarPrestamo: (data: Omit<Prestamo, 'id'>) => Promise<void>
  eliminarPrestamo: (id: string) => Promise<void>
  getTablaAmortizacion: (prestamoId: string, unidadPeriodo: UnidadPeriodo) => CuotaAmortizacion[]
  getImpactoPorPeriodos: (
    numeroPeriodos: number,
    unidadPeriodo: UnidadPeriodo
  ) => Array<{ desembolsos: number; cuotas: number }>
}

export const useFinanciamientoStore = create<FinanciamientoStore>((set, get) => ({
  prestamos: [],
  isLoaded: false,

  cargar: async () => {
    const prestamos = await dbGetPrestamos()
    set({ prestamos, isLoaded: true })
  },

  agregarPrestamo: async (data) => {
    const nuevo: Prestamo = { ...data, id: crypto.randomUUID() }
    await dbSavePrestamo(nuevo)
    set({ prestamos: [...get().prestamos, nuevo] })
  },

  eliminarPrestamo: async (id) => {
    await dbDeletePrestamo(id)
    set({ prestamos: get().prestamos.filter((p) => p.id !== id) })
  },

  getTablaAmortizacion: (prestamoId, unidadPeriodo) => {
    const prestamo = get().prestamos.find((p) => p.id === prestamoId)
    if (!prestamo) return []
    return generarTablaAmortizacion({ prestamo, unidadPeriodo })
  },

  getImpactoPorPeriodos: (numeroPeriodos, unidadPeriodo) =>
    mapearFinanciamientoAPeriodos({ prestamos: get().prestamos, numeroPeriodos, unidadPeriodo }),
}))
