import { create } from 'zustand'
import { dbGetEscenarios, dbSaveEscenario, dbDeleteEscenario } from '../db'
import {
  clonarProyeccionComoEscenario,
  calcularEscenario,
  compararEscenarios,
} from '../lib/calculos/simulacion'
import type { ComparacionEscenario, Escenario, ResultadoPeriodo } from '../types'
import { useConfigStore } from './configStore'
import { useIngresosStore } from './ingresosStore'
import { useEgresosStore } from './egresosStore'
import { useFinanciamientoStore } from './financiamientoStore'
import { useFlujoStore } from './flujoStore'

const MAX_ESCENARIOS = 10

interface SimulacionStore {
  escenarios: Escenario[]
  escenarioActivoId: string | null
  isLoaded: boolean
  cargar: () => Promise<void>
  crearEscenario: (nombre: string) => Promise<void>
  duplicarEscenario: (id: string) => Promise<void>
  eliminarEscenario: (id: string) => Promise<void>
  actualizarEscenario: (id: string, changes: Partial<Escenario>) => Promise<void>
  seleccionarEscenario: (id: string | null) => void
  getResultadosEscenario: (id: string) => ResultadoPeriodo[]
  getComparacion: () => ComparacionEscenario[]
}

export const useSimulacionStore = create<SimulacionStore>((set, get) => ({
  escenarios: [],
  escenarioActivoId: null,
  isLoaded: false,

  cargar: async () => {
    const escenarios = await dbGetEscenarios()
    set({ escenarios, isLoaded: true })
  },

  crearEscenario: async (nombre) => {
    if (get().escenarios.length >= MAX_ESCENARIOS) return
    const config = useConfigStore.getState().config
    if (!config) return

    const escenario = clonarProyeccionComoEscenario({
      config,
      categoriasIngreso: useIngresosStore.getState().categorias,
      categoriasEgreso: useEgresosStore.getState().categorias,
      prestamos: useFinanciamientoStore.getState().prestamos,
      nombre,
    })

    await dbSaveEscenario(escenario)
    set({ escenarios: [...get().escenarios, escenario], escenarioActivoId: escenario.id })
  },

  duplicarEscenario: async (id) => {
    if (get().escenarios.length >= MAX_ESCENARIOS) return
    const original = get().escenarios.find((e) => e.id === id)
    if (!original) return

    const now = new Date().toISOString()
    const copia: Escenario = {
      ...original,
      id: crypto.randomUUID(),
      nombre: `${original.nombre} — copia`,
      categoriasIngreso: original.categoriasIngreso.map((c) => ({
        ...c,
        id: crypto.randomUUID(),
        montos: [...c.montos],
      })),
      categoriasEgreso: original.categoriasEgreso.map((c) => ({
        ...c,
        id: crypto.randomUUID(),
        montos: [...c.montos],
      })),
      prestamos: original.prestamos.map((p) => ({ ...p, id: crypto.randomUUID() })),
      creadoEn: now,
      actualizadoEn: now,
    }

    await dbSaveEscenario(copia)
    set({ escenarios: [...get().escenarios, copia] })
  },

  eliminarEscenario: async (id) => {
    await dbDeleteEscenario(id)
    const escenarios = get().escenarios.filter((e) => e.id !== id)
    const activoId = get().escenarioActivoId === id ? null : get().escenarioActivoId
    set({ escenarios, escenarioActivoId: activoId })
  },

  actualizarEscenario: async (id, changes) => {
    const escenarios = get().escenarios.map((e) => {
      if (e.id !== id) return e
      return { ...e, ...changes, actualizadoEn: new Date().toISOString() }
    })
    const actualizado = escenarios.find((e) => e.id === id)
    if (actualizado) await dbSaveEscenario(actualizado)
    set({ escenarios })
  },

  seleccionarEscenario: (id) => set({ escenarioActivoId: id }),

  getResultadosEscenario: (id) => {
    const escenario = get().escenarios.find((e) => e.id === id)
    if (!escenario) return []
    return calcularEscenario(escenario)
  },

  getComparacion: () => {
    const base = useFlujoStore.getState().resultados
    const escenarios = get().escenarios.map((e) => ({
      id: e.id,
      nombre: e.nombre,
      resultados: calcularEscenario(e),
    }))
    return compararEscenarios({ base, escenarios })
  },
}))
