import { describe, it, expect } from 'vitest'
import {
  redondear,
  generarLabelPeriodo,
  calcularFlujoPeriodo,
  calcularProyeccion,
} from '../../lib/calculos/flujo'
import type { ProyeccionConfig } from '../../types'

const configBase: ProyeccionConfig = {
  id: 'singleton',
  nombreEmpresa: 'Test',
  moneda: 'PEN',
  unidadPeriodo: 'mes',
  numeroPeriodos: 3,
  saldoInicial: 1000,
  creadoEn: '',
  actualizadoEn: '',
}

describe('redondear', () => {
  it('redondea a 2 decimales', () => expect(redondear(1.235)).toBe(1.24))
  it('no altera enteros', () => expect(redondear(100)).toBe(100))
  it('maneja negativos', () => expect(redondear(-1.234)).toBe(-1.23))
  it('sin drift en 120 operaciones', () => {
    let acum = 0
    for (let i = 0; i < 120; i++) acum = redondear(acum + 0.1)
    expect(acum).toBe(12)
  })
})

describe('generarLabelPeriodo', () => {
  it('mes', () => expect(generarLabelPeriodo('mes', 3)).toBe('Mes 3'))
  it('semana', () => expect(generarLabelPeriodo('semana', 1)).toBe('Semana 1'))
  it('dia', () => expect(generarLabelPeriodo('dia', 10)).toBe('Día 10'))
  it('año', () => expect(generarLabelPeriodo('año', 2)).toBe('Año 2'))
})

describe('calcularFlujoPeriodo', () => {
  it('flujo positivo', () =>
    expect(calcularFlujoPeriodo({ totalIngresos: 5000, totalEgresos: 3000, desembolsosPrestamos: 0, cuotasPrestamos: 0 })).toBe(2000))
  it('flujo negativo', () =>
    expect(calcularFlujoPeriodo({ totalIngresos: 2000, totalEgresos: 3000, desembolsosPrestamos: 0, cuotasPrestamos: 0 })).toBe(-1000))
  it('incorpora desembolso de préstamo', () =>
    expect(calcularFlujoPeriodo({ totalIngresos: 1000, totalEgresos: 500, desembolsosPrestamos: 10000, cuotasPrestamos: 0 })).toBe(10500))
  it('descuenta cuotas', () =>
    expect(calcularFlujoPeriodo({ totalIngresos: 1000, totalEgresos: 500, desembolsosPrestamos: 0, cuotasPrestamos: 300 })).toBe(200))
  it('resultado cero', () =>
    expect(calcularFlujoPeriodo({ totalIngresos: 1000, totalEgresos: 1000, desembolsosPrestamos: 0, cuotasPrestamos: 0 })).toBe(0))
})

describe('calcularProyeccion', () => {
  it('saldo acumulado encadenado correctamente', () => {
    const resultado = calcularProyeccion({
      config: { ...configBase, saldoInicial: 1000, numeroPeriodos: 3 },
      categoriasIngreso: [{ id: '1', nombre: 'Ventas', montos: [500, 500, 500], orden: 0 }],
      categoriasEgreso: [{ id: '2', nombre: 'Gastos', tipo: 'otro', montos: [200, 200, 200], orden: 0 }],
      prestamos: [],
    })
    expect(resultado[0].saldoAcumulado).toBe(1300)
    expect(resultado[1].saldoAcumulado).toBe(1600)
    expect(resultado[2].saldoAcumulado).toBe(1900)
  })

  it('saldo inicial negativo funciona', () => {
    const resultado = calcularProyeccion({
      config: { ...configBase, saldoInicial: -500, numeroPeriodos: 1 },
      categoriasIngreso: [{ id: '1', nombre: 'Ventas', montos: [1000], orden: 0 }],
      categoriasEgreso: [],
      prestamos: [],
    })
    expect(resultado[0].saldoAcumulado).toBe(500)
  })

  it('genera labels correctos', () => {
    const resultado = calcularProyeccion({
      config: { ...configBase, unidadPeriodo: 'semana', numeroPeriodos: 2 },
      categoriasIngreso: [],
      categoriasEgreso: [],
      prestamos: [],
    })
    expect(resultado[0].label).toBe('Semana 1')
    expect(resultado[1].label).toBe('Semana 2')
  })

  it('campos vacíos tratados como 0', () => {
    const resultado = calcularProyeccion({
      config: { ...configBase, saldoInicial: 0, numeroPeriodos: 1 },
      categoriasIngreso: [{ id: '1', nombre: 'Ventas', montos: [], orden: 0 }],
      categoriasEgreso: [],
      prestamos: [],
    })
    expect(resultado[0].totalIngresos).toBe(0)
    expect(resultado[0].flujoNeto).toBe(0)
  })

  it('sin drift en 120 períodos', () => {
    const resultado = calcularProyeccion({
      config: { ...configBase, saldoInicial: 0, numeroPeriodos: 120 },
      categoriasIngreso: [{ id: '1', nombre: 'Ventas', montos: Array(120).fill(100.1), orden: 0 }],
      categoriasEgreso: [{ id: '2', nombre: 'Gastos', tipo: 'otro', montos: Array(120).fill(100), orden: 0 }],
      prestamos: [],
    })
    expect(resultado[119].saldoAcumulado).toBe(12)
  })
})
