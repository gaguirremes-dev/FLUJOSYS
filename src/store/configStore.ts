import { create } from 'zustand'
import { dbGetConfig, dbSaveConfig, dbResetAll } from '../db'
import type { Moneda, ProyeccionConfig, UnidadPeriodo } from '../types'

interface ConfigStore {
  config: ProyeccionConfig | null
  isLoaded: boolean
  cargarConfig: () => Promise<void>
  actualizarConfig: (partial: Partial<ProyeccionConfig>) => Promise<void>
  resetear: () => Promise<void>
}

const defaultConfig = (): ProyeccionConfig => ({
  id: 'singleton',
  nombreEmpresa: 'Mi Empresa',
  moneda: 'PEN' as Moneda,
  unidadPeriodo: 'mes' as UnidadPeriodo,
  numeroPeriodos: 12,
  saldoInicial: 0,
  creadoEn: new Date().toISOString(),
  actualizadoEn: new Date().toISOString(),
})

export const useConfigStore = create<ConfigStore>((set, get) => ({
  config: null,
  isLoaded: false,

  cargarConfig: async () => {
    const stored = await dbGetConfig()
    const config = stored ?? defaultConfig()
    if (!stored) await dbSaveConfig(config)
    set({ config, isLoaded: true })
  },

  actualizarConfig: async (partial) => {
    const current = get().config ?? defaultConfig()
    const updated: ProyeccionConfig = {
      ...current,
      ...partial,
      actualizadoEn: new Date().toISOString(),
    }
    await dbSaveConfig(updated)
    set({ config: updated })
  },

  resetear: async () => {
    await dbResetAll()
    const config = defaultConfig()
    await dbSaveConfig(config)
    set({ config })
  },
}))
