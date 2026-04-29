import type {
  CategoriaIngreso,
  CategoriaEgreso,
  Prestamo,
  ProyeccionConfig,
  ResultadoPeriodo,
  UnidadPeriodo,
} from '../../types'
import { mapearFinanciamientoAPeriodos } from './amortizacion'

export function redondear(valor: number): number {
  return Math.round(valor * 100) / 100
}

export function generarLabelPeriodo(unidad: UnidadPeriodo, periodo: number): string {
  const labels: Record<UnidadPeriodo, string> = {
    dia: 'Día',
    semana: 'Semana',
    mes: 'Mes',
    año: 'Año',
  }
  return `${labels[unidad]} ${periodo}`
}

export function calcularFlujoPeriodo(params: {
  totalIngresos: number
  totalEgresos: number
  desembolsosPrestamos: number
  cuotasPrestamos: number
}): number {
  return redondear(
    params.totalIngresos - params.totalEgresos + params.desembolsosPrestamos - params.cuotasPrestamos
  )
}

export function calcularProyeccion(params: {
  config: ProyeccionConfig
  categoriasIngreso: CategoriaIngreso[]
  categoriasEgreso: CategoriaEgreso[]
  prestamos: Prestamo[]
}): ResultadoPeriodo[] {
  const { config, categoriasIngreso, categoriasEgreso, prestamos } = params
  const { numeroPeriodos, saldoInicial, unidadPeriodo } = config

  const financiamiento = mapearFinanciamientoAPeriodos({
    prestamos,
    numeroPeriodos,
    unidadPeriodo,
  })

  const resultados: ResultadoPeriodo[] = []
  let saldoAcumulado = saldoInicial

  for (let i = 0; i < numeroPeriodos; i++) {
    const totalIngresos = redondear(
      categoriasIngreso.reduce((sum, cat) => sum + (cat.montos[i] ?? 0), 0)
    )
    const totalEgresos = redondear(
      categoriasEgreso.reduce((sum, cat) => sum + (cat.montos[i] ?? 0), 0)
    )
    const { desembolsos, cuotas } = financiamiento[i]
    const flujoNeto = calcularFlujoPeriodo({
      totalIngresos,
      totalEgresos,
      desembolsosPrestamos: desembolsos,
      cuotasPrestamos: cuotas,
    })

    saldoAcumulado = redondear(saldoAcumulado + flujoNeto)

    resultados.push({
      periodo: i + 1,
      label: generarLabelPeriodo(unidadPeriodo, i + 1),
      totalIngresos,
      totalEgresos,
      desembolsosPrestamos: desembolsos,
      cuotasPrestamos: cuotas,
      flujoNeto,
      saldoAcumulado,
    })
  }

  return resultados
}
