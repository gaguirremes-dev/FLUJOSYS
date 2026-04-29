import { create } from 'zustand'
import { evaluarAlertas } from '../lib/calculos/alertas'
import type { Alerta } from '../types'
import { useConfigStore } from './configStore'
import { useFlujoStore } from './flujoStore'
import { useFinanciamientoStore } from './financiamientoStore'

interface AlertasStore {
  alertas: Alerta[]
  tieneAlertas: boolean
  alertasCriticas: Alerta[]
  recalcular: () => void
}

export const useAlertasStore = create<AlertasStore>((set) => ({
  alertas: [],
  tieneAlertas: false,
  alertasCriticas: [],

  recalcular: () => {
    const config = useConfigStore.getState().config
    const resultados = useFlujoStore.getState().resultados
    const prestamos = useFinanciamientoStore.getState().prestamos

    if (!config) {
      set({ alertas: [], tieneAlertas: false, alertasCriticas: [] })
      return
    }

    const alertas = evaluarAlertas({
      resultados,
      umbralSaldoMinimo: config.umbralSaldoMinimo,
      prestamos,
      numeroPeriodos: config.numeroPeriodos,
    })

    set({
      alertas,
      tieneAlertas: alertas.length > 0,
      alertasCriticas: alertas.filter((a) => a.severidad === 'critica'),
    })
  },
}))
