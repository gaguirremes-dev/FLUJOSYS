import { describe, it, expect } from 'vitest'
import {
  redimensionarMontos,
  clonarProyeccionComoEscenario,
  calcularEscenario,
  compararEscenarios,
} from '../../lib/calculos/simulacion'
import type { ProyeccionConfig } from '../../types'

const config: ProyeccionConfig = {
  id: 'singleton',
  nombreEmpresa: 'Test',
  moneda: 'PEN',
  unidadPeriodo: 'mes',
  numeroPeriodos: 3,
  saldoInicial: 1000,
  creadoEn: '',
  actualizadoEn: '',
}

describe('redimensionarMontos', () => {
  it('trunca si nueva longitud es menor', () =>
    expect(redimensionarMontos([1, 2, 3, 4, 5], 3)).toEqual([1, 2, 3]))
  it('rellena con 0 si nueva longitud es mayor', () =>
    expect(redimensionarMontos([1, 2], 5)).toEqual([1, 2, 0, 0, 0]))
  it('misma longitud no cambia', () =>
    expect(redimensionarMontos([1, 2, 3], 3)).toEqual([1, 2, 3]))
  it('longitud 0 retorna vacío', () =>
    expect(redimensionarMontos([1, 2, 3], 0)).toEqual([]))
})

describe('clonarProyeccionComoEscenario', () => {
  const ingresos = [{ id: 'i1', nombre: 'Ventas', montos: [500, 500, 500], orden: 0 }]
  const egresos = [{ id: 'e1', nombre: 'Gastos', tipo: 'otro' as const, montos: [200, 200, 200], orden: 0 }]

  it('clon es una copia profunda — modificar no afecta base', () => {
    const escenario = clonarProyeccionComoEscenario({ config, categoriasIngreso: ingresos, categoriasEgreso: egresos, prestamos: [], nombre: 'Optimista' })
    escenario.categoriasIngreso[0].montos[0] = 99999
    expect(ingresos[0].montos[0]).toBe(500)
  })

  it('hereda numeroPeriodos y saldoInicial de la base', () => {
    const escenario = clonarProyeccionComoEscenario({ config, categoriasIngreso: [], categoriasEgreso: [], prestamos: [], nombre: 'Test' })
    expect(escenario.numeroPeriodos).toBe(config.numeroPeriodos)
    expect(escenario.saldoInicial).toBe(config.saldoInicial)
  })

  it('asigna el nombre correcto', () => {
    const escenario = clonarProyeccionComoEscenario({ config, categoriasIngreso: [], categoriasEgreso: [], prestamos: [], nombre: 'Pesimista' })
    expect(escenario.nombre).toBe('Pesimista')
  })

  it('genera un id único', () => {
    const e1 = clonarProyeccionComoEscenario({ config, categoriasIngreso: [], categoriasEgreso: [], prestamos: [], nombre: 'A' })
    const e2 = clonarProyeccionComoEscenario({ config, categoriasIngreso: [], categoriasEgreso: [], prestamos: [], nombre: 'B' })
    expect(e1.id).not.toBe(e2.id)
  })
})

describe('calcularEscenario', () => {
  it('calcula el flujo correctamente desde un escenario', () => {
    const escenario = clonarProyeccionComoEscenario({
      config,
      categoriasIngreso: [{ id: 'i1', nombre: 'Ventas', montos: [1000, 1000, 1000], orden: 0 }],
      categoriasEgreso: [{ id: 'e1', nombre: 'Gastos', tipo: 'otro', montos: [400, 400, 400], orden: 0 }],
      prestamos: [],
      nombre: 'Test',
    })
    const resultados = calcularEscenario(escenario)
    expect(resultados[0].flujoNeto).toBe(600)
    expect(resultados[0].saldoAcumulado).toBe(1600)
  })
})

describe('compararEscenarios', () => {
  const base = [
    { periodo: 1, label: 'Mes 1', totalIngresos: 1000, totalEgresos: 800, desembolsosPrestamos: 0, cuotasPrestamos: 0, flujoNeto: 200, saldoAcumulado: 1200 },
    { periodo: 2, label: 'Mes 2', totalIngresos: 1000, totalEgresos: 800, desembolsosPrestamos: 0, cuotasPrestamos: 0, flujoNeto: 200, saldoAcumulado: 1400 },
  ]

  it('escenario con mejor saldo marcado como mejor=true', () => {
    const escMejor = [{ ...base[0], saldoAcumulado: 1500 }, { ...base[1], saldoAcumulado: 2000 }]
    const comparacion = compararEscenarios({ base, escenarios: [{ id: '1', nombre: 'Optimista', resultados: escMejor }] })
    expect(comparacion[0].mejor).toBe(true)
    expect(comparacion[0].deltaVsBase).toBe(600)
  })

  it('escenario con peor saldo marcado como mejor=false', () => {
    const escPeor = [{ ...base[0], saldoAcumulado: 500 }, { ...base[1], saldoAcumulado: 800 }]
    const comparacion = compararEscenarios({ base, escenarios: [{ id: '2', nombre: 'Pesimista', resultados: escPeor }] })
    expect(comparacion[0].mejor).toBe(false)
    expect(comparacion[0].deltaVsBase).toBe(-600)
  })
})
