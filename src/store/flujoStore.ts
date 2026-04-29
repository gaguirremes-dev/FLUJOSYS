import { create } from 'zustand'
import { calcularProyeccion } from '../lib/calculos/flujo'
import type { ResultadoPeriodo } from '../types'
import { useConfigStore } from './configStore'
import { useIngresosStore } from './ingresosStore'
import { useEgresosStore } from './egresosStore'
import { useFinanciamientoStore } from './financiamientoStore'

interface FlujoStore {
  resultados: ResultadoPeriodo[]
  recalcular: () => void
}

export const useFlujoStore = create<FlujoStore>((set) => ({
  resultados: [],

  recalcular: () => {
    const config = useConfigStore.getState().config
    const categorias = useIngresosStore.getState().categorias
    const egresos = useEgresosStore.getState().categorias
    const prestamos = useFinanciamientoStore.getState().prestamos

    if (!config) {
      set({ resultados: [] })
      return
    }

    const resultados = calcularProyeccion({
      config,
      categoriasIngreso: categorias,
      categoriasEgreso: egresos,
      prestamos,
    })

    set({ resultados })
  },
}))
