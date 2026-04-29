import { create } from 'zustand'
import {
  dbGetProyecciones,
  dbSaveProyeccion,
  dbDeleteProyeccion,
  dbSaveConfig,
  dbSaveIngreso,
  dbSaveEgreso,
  dbSavePrestamo,
  dbClearIngresos,
  dbClearEgresos,
  dbClearPrestamos,
} from '../db'
import type { Proyeccion } from '../types'
import { useConfigStore } from './configStore'
import { useIngresosStore } from './ingresosStore'
import { useEgresosStore } from './egresosStore'
import { useFinanciamientoStore } from './financiamientoStore'
import { useFlujoStore } from './flujoStore'
import { useAlertasStore } from './alertasStore'

const MAX_PROYECCIONES = 12

interface ProyeccionesStore {
  proyecciones: Proyeccion[]
  isLoaded: boolean
  cargar: () => Promise<void>
  guardarActual: () => Promise<'ok' | 'max'>
  cargarProyeccion: (id: string) => Promise<void>
  eliminarProyeccion: (id: string) => Promise<void>
}

export const useProyeccionesStore = create<ProyeccionesStore>((set, get) => ({
  proyecciones: [],
  isLoaded: false,

  cargar: async () => {
    const proyecciones = await dbGetProyecciones()
    set({ proyecciones, isLoaded: true })
  },

  guardarActual: async () => {
    const config = useConfigStore.getState().config
    if (!config) return 'ok'

    const current = get().proyecciones
    let proyeccionId = config.proyeccionId
    const exists = proyeccionId ? current.some((p) => p.id === proyeccionId) : false

    if (!exists && current.length >= MAX_PROYECCIONES) return 'max'

    if (!proyeccionId) {
      proyeccionId = crypto.randomUUID()
      const updatedConfig = { ...config, proyeccionId, actualizadoEn: new Date().toISOString() }
      await dbSaveConfig(updatedConfig)
      useConfigStore.setState({ config: updatedConfig })
    }

    const now = new Date().toISOString()
    const proyeccion: Proyeccion = {
      id: proyeccionId,
      nombre: config.nombreEmpresa,
      moneda: config.moneda,
      numeroPeriodos: config.numeroPeriodos,
      creadoEn: current.find((p) => p.id === proyeccionId)?.creadoEn ?? now,
      actualizadoEn: now,
      snapshot: {
        config: useConfigStore.getState().config!,
        categoriasIngreso: useIngresosStore.getState().categorias,
        categoriasEgreso: useEgresosStore.getState().categorias,
        prestamos: useFinanciamientoStore.getState().prestamos,
      },
    }

    await dbSaveProyeccion(proyeccion)
    const updated = exists
      ? current.map((p) => (p.id === proyeccionId ? proyeccion : p))
      : [...current, proyeccion]
    set({ proyecciones: updated })
    return 'ok'
  },

  cargarProyeccion: async (id) => {
    const proyeccion = get().proyecciones.find((p) => p.id === id)
    if (!proyeccion) return

    const { config, categoriasIngreso, categoriasEgreso, prestamos } = proyeccion.snapshot

    await dbSaveConfig(config)
    await dbClearIngresos()
    await dbClearEgresos()
    await dbClearPrestamos()

    for (const cat of categoriasIngreso) await dbSaveIngreso(cat)
    for (const cat of categoriasEgreso) await dbSaveEgreso(cat)
    for (const p of prestamos) await dbSavePrestamo(p)

    await useConfigStore.getState().cargarConfig()
    await useIngresosStore.getState().cargar()
    await useEgresosStore.getState().cargar()
    await useFinanciamientoStore.getState().cargar()

    useFlujoStore.getState().recalcular()
    useAlertasStore.getState().recalcular()
  },

  eliminarProyeccion: async (id) => {
    await dbDeleteProyeccion(id)
    const proyecciones = get().proyecciones.filter((p) => p.id !== id)
    set({ proyecciones })
  },
}))
