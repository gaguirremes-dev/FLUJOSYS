import { create } from 'zustand'
import { dbGetEgresos, dbSaveEgreso, dbDeleteEgreso } from '../db'
import type { CategoriaEgreso, TipoEgreso } from '../types'

interface EgresosStore {
  categorias: CategoriaEgreso[]
  isLoaded: boolean
  cargar: () => Promise<void>
  agregarCategoria: (nombre: string, tipo: TipoEgreso, numeroPeriodos: number) => Promise<void>
  actualizarMonto: (id: string, periodoIdx: number, monto: number) => Promise<void>
  eliminarCategoria: (id: string) => Promise<void>
  redimensionar: (nuevaLongitud: number) => Promise<void>
}

export const useEgresosStore = create<EgresosStore>((set, get) => ({
  categorias: [],
  isLoaded: false,

  cargar: async () => {
    const categorias = await dbGetEgresos()
    set({ categorias, isLoaded: true })
  },

  agregarCategoria: async (nombre, tipo, numeroPeriodos) => {
    const categorias = get().categorias
    const nueva: CategoriaEgreso = {
      id: crypto.randomUUID(),
      nombre,
      tipo,
      montos: Array(numeroPeriodos).fill(0),
      orden: categorias.length,
    }
    await dbSaveEgreso(nueva)
    set({ categorias: [...categorias, nueva] })
  },

  actualizarMonto: async (id, periodoIdx, monto) => {
    const categorias = get().categorias.map((c) => {
      if (c.id !== id) return c
      const montos = [...c.montos]
      montos[periodoIdx] = monto
      return { ...c, montos }
    })
    const actualizada = categorias.find((c) => c.id === id)
    if (actualizada) await dbSaveEgreso(actualizada)
    set({ categorias })
  },

  eliminarCategoria: async (id) => {
    await dbDeleteEgreso(id)
    set({ categorias: get().categorias.filter((c) => c.id !== id) })
  },

  redimensionar: async (nuevaLongitud) => {
    const categorias = get().categorias.map((c) => {
      const montos =
        nuevaLongitud > c.montos.length
          ? [...c.montos, ...Array(nuevaLongitud - c.montos.length).fill(0)]
          : c.montos.slice(0, nuevaLongitud)
      return { ...c, montos }
    })
    await Promise.all(categorias.map(dbSaveEgreso))
    set({ categorias })
  },
}))
