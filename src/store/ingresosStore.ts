import { create } from 'zustand'
import { dbGetIngresos, dbSaveIngreso, dbDeleteIngreso, dbClearIngresos } from '../db'
import type { CategoriaIngreso } from '../types'

interface IngresosStore {
  categorias: CategoriaIngreso[]
  isLoaded: boolean
  cargar: () => Promise<void>
  agregarCategoria: (nombre: string, numeroPeriodos: number) => Promise<void>
  actualizarMonto: (id: string, periodoIdx: number, monto: number) => Promise<void>
  eliminarCategoria: (id: string) => Promise<void>
  redimensionar: (nuevaLongitud: number) => Promise<void>
}

export const useIngresosStore = create<IngresosStore>((set, get) => ({
  categorias: [],
  isLoaded: false,

  cargar: async () => {
    const categorias = await dbGetIngresos()
    set({ categorias, isLoaded: true })
  },

  agregarCategoria: async (nombre, numeroPeriodos) => {
    const categorias = get().categorias
    const nueva: CategoriaIngreso = {
      id: crypto.randomUUID(),
      nombre,
      montos: Array(numeroPeriodos).fill(0),
      orden: categorias.length,
    }
    await dbSaveIngreso(nueva)
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
    if (actualizada) await dbSaveIngreso(actualizada)
    set({ categorias })
  },

  eliminarCategoria: async (id) => {
    await dbDeleteIngreso(id)
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
    await Promise.all(categorias.map(dbSaveIngreso))
    set({ categorias })
  },
}))
