import type {
  CategoriaEgreso,
  CategoriaIngreso,
  ComparacionEscenario,
  Escenario,
  Prestamo,
  ProyeccionConfig,
  ResultadoPeriodo,
} from '../../types'
import { calcularProyeccion } from './flujo'

export function redimensionarMontos(montos: number[], nuevaLongitud: number): number[] {
  if (nuevaLongitud <= montos.length) return montos.slice(0, nuevaLongitud)
  return [...montos, ...Array(nuevaLongitud - montos.length).fill(0)]
}

export function clonarProyeccionComoEscenario(params: {
  config: ProyeccionConfig
  categoriasIngreso: CategoriaIngreso[]
  categoriasEgreso: CategoriaEgreso[]
  prestamos: Prestamo[]
  nombre: string
}): Escenario {
  const { config, categoriasIngreso, categoriasEgreso, prestamos, nombre } = params
  const now = new Date().toISOString()

  return {
    id: crypto.randomUUID(),
    nombre,
    numeroPeriodos: config.numeroPeriodos,
    saldoInicial: config.saldoInicial,
    umbralSaldoMinimo: config.umbralSaldoMinimo,
    categoriasIngreso: categoriasIngreso.map((c) => ({
      ...c,
      id: crypto.randomUUID(),
      montos: [...c.montos],
    })),
    categoriasEgreso: categoriasEgreso.map((c) => ({
      ...c,
      id: crypto.randomUUID(),
      montos: [...c.montos],
    })),
    prestamos: prestamos.map((p) => ({ ...p, id: crypto.randomUUID() })),
    creadoEn: now,
    actualizadoEn: now,
  }
}

export function calcularEscenario(escenario: Escenario): ResultadoPeriodo[] {
  return calcularProyeccion({
    config: {
      id: 'singleton',
      nombreEmpresa: '',
      moneda: 'PEN',
      unidadPeriodo: 'mes',
      numeroPeriodos: escenario.numeroPeriodos,
      saldoInicial: escenario.saldoInicial,
      umbralSaldoMinimo: escenario.umbralSaldoMinimo,
      creadoEn: escenario.creadoEn,
      actualizadoEn: escenario.actualizadoEn,
    },
    categoriasIngreso: escenario.categoriasIngreso,
    categoriasEgreso: escenario.categoriasEgreso,
    prestamos: escenario.prestamos,
  })
}

export function compararEscenarios(params: {
  base: ResultadoPeriodo[]
  escenarios: Array<{ id: string; nombre: string; resultados: ResultadoPeriodo[] }>
}): ComparacionEscenario[] {
  const { base, escenarios } = params
  const saldoBase = base.at(-1)?.saldoAcumulado ?? 0

  return escenarios.map(({ id, nombre, resultados }) => {
    const saldoFinal = resultados.at(-1)?.saldoAcumulado ?? 0
    const delta = Math.round((saldoFinal - saldoBase) * 100) / 100
    return {
      id,
      nombre,
      saldoFinal,
      deltaVsBase: delta,
      mejor: delta > 0,
    }
  })
}
