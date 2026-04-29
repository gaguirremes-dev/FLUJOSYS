import type { CuotaAmortizacion, Prestamo, UnidadPeriodo } from '../../types'
import { redondear } from './flujo'

const PERIODOS_POR_ANIO: Record<UnidadPeriodo, number> = {
  dia: 365,
  semana: 52,
  mes: 12,
  año: 1,
}

export function convertirTasaAnual(params: {
  tasaAnualPorcentaje: number
  unidadPeriodo: UnidadPeriodo
}): number {
  const { tasaAnualPorcentaje, unidadPeriodo } = params
  if (tasaAnualPorcentaje === 0) return 0
  const tasaAnual = tasaAnualPorcentaje / 100
  const n = PERIODOS_POR_ANIO[unidadPeriodo]
  return Math.pow(1 + tasaAnual, 1 / n) - 1
}

export function calcularCuotaFrances(params: {
  monto: number
  tasaPeriodo: number
  numeroCuotas: number
}): number {
  const { monto, tasaPeriodo, numeroCuotas } = params
  if (numeroCuotas === 0) return 0
  if (tasaPeriodo === 0) return redondear(monto / numeroCuotas)
  const factor = Math.pow(1 + tasaPeriodo, numeroCuotas)
  return redondear((monto * tasaPeriodo * factor) / (factor - 1))
}

export function generarTablaAmortizacion(params: {
  prestamo: Prestamo
  unidadPeriodo: UnidadPeriodo
}): CuotaAmortizacion[] {
  const { prestamo, unidadPeriodo } = params
  const { monto, tasaAnual, numeroCuotas, periodoInicio } = prestamo

  const tasaPeriodo = convertirTasaAnual({ tasaAnualPorcentaje: tasaAnual, unidadPeriodo })
  const cuotaFija = calcularCuotaFrances({ monto, tasaPeriodo, numeroCuotas })

  const tabla: CuotaAmortizacion[] = []
  let saldoPendiente = monto

  for (let i = 0; i < numeroCuotas; i++) {
    const interes = redondear(saldoPendiente * tasaPeriodo)
    const capital = redondear(cuotaFija - interes)
    saldoPendiente = redondear(saldoPendiente - capital)

    // Ajuste del último período para eliminar residuo de redondeo
    if (i === numeroCuotas - 1 && Math.abs(saldoPendiente) < 0.05) {
      saldoPendiente = 0
    }

    tabla.push({
      periodo: periodoInicio + i + 1, // cuotas empiezan en el período siguiente al desembolso
      cuotaTotal: cuotaFija,
      interes,
      capital,
      saldoPendiente,
    })
  }

  return tabla
}

export function mapearFinanciamientoAPeriodos(params: {
  prestamos: Prestamo[]
  numeroPeriodos: number
  unidadPeriodo: UnidadPeriodo
}): Array<{ desembolsos: number; cuotas: number }> {
  const { prestamos, numeroPeriodos, unidadPeriodo } = params
  const mapa = Array.from({ length: numeroPeriodos }, () => ({ desembolsos: 0, cuotas: 0 }))

  for (const prestamo of prestamos) {
    // Desembolso en el período de inicio (índice 0-based)
    if (prestamo.periodoInicio < numeroPeriodos) {
      mapa[prestamo.periodoInicio].desembolsos = redondear(
        mapa[prestamo.periodoInicio].desembolsos + prestamo.monto
      )
    }

    // Cuotas en los períodos siguientes
    const tabla = generarTablaAmortizacion({ prestamo, unidadPeriodo })
    for (const cuota of tabla) {
      const idx = cuota.periodo // periodo ya es 0-based (periodoInicio+1+i)
      if (idx >= 0 && idx < numeroPeriodos) {
        mapa[idx].cuotas = redondear(mapa[idx].cuotas + cuota.cuotaTotal)
      }
    }
  }

  return mapa
}
