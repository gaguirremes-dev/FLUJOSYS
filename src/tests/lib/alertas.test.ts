import { describe, it, expect } from 'vitest'
import { evaluarAlertas } from '../../lib/calculos/alertas'
import type { ResultadoPeriodo } from '../../types'

function makePeriodo(overrides: Partial<ResultadoPeriodo> & { periodo: number }): ResultadoPeriodo {
  return {
    label: `Mes ${overrides.periodo}`,
    totalIngresos: 1000,
    totalEgresos: 800,
    desembolsosPrestamos: 0,
    cuotasPrestamos: 0,
    flujoNeto: 200,
    saldoAcumulado: 1000,
    ...overrides,
  }
}

describe('evaluarAlertas — saldo negativo', () => {
  it('genera alerta crítica cuando saldo < 0', () => {
    const resultados = [
      makePeriodo({ periodo: 1, saldoAcumulado: 500 }),
      makePeriodo({ periodo: 2, saldoAcumulado: -200, flujoNeto: -700 }),
    ]
    const alertas = evaluarAlertas({ resultados, prestamos: [], numeroPeriodos: 2 })
    const critica = alertas.find((a) => a.tipo === 'saldo_negativo')
    expect(critica).toBeDefined()
    expect(critica!.severidad).toBe('critica')
    expect(critica!.periodosAfectados).toContain(2)
  })

  it('no genera alerta si todo positivo', () => {
    const resultados = [
      makePeriodo({ periodo: 1, saldoAcumulado: 1000 }),
      makePeriodo({ periodo: 2, saldoAcumulado: 1500 }),
    ]
    const alertas = evaluarAlertas({ resultados, prestamos: [], numeroPeriodos: 2 })
    expect(alertas.find((a) => a.tipo === 'saldo_negativo')).toBeUndefined()
  })
})

describe('evaluarAlertas — déficit inminente', () => {
  it('detecta déficit en 2 períodos siguientes', () => {
    const resultados = [
      makePeriodo({ periodo: 1, saldoAcumulado: 300, flujoNeto: -100 }),
      makePeriodo({ periodo: 2, saldoAcumulado: 100, flujoNeto: -200 }),
      makePeriodo({ periodo: 3, saldoAcumulado: -200, flujoNeto: -300 }),
    ]
    const alertas = evaluarAlertas({ resultados, prestamos: [], numeroPeriodos: 3 })
    expect(alertas.find((a) => a.tipo === 'deficit_inminente')).toBeDefined()
  })
})

describe('evaluarAlertas — flujo negativo', () => {
  it('alerta media si flujo negativo pero saldo positivo', () => {
    const resultados = [
      makePeriodo({ periodo: 1, saldoAcumulado: 5000, flujoNeto: -200 }),
    ]
    const alertas = evaluarAlertas({ resultados, prestamos: [], numeroPeriodos: 1 })
    const media = alertas.find((a) => a.tipo === 'flujo_negativo')
    expect(media).toBeDefined()
    expect(media!.severidad).toBe('media')
  })
})

describe('evaluarAlertas — saldo bajo', () => {
  it('alerta cuando saldo < umbral', () => {
    const resultados = [makePeriodo({ periodo: 1, saldoAcumulado: 300 })]
    const alertas = evaluarAlertas({ resultados, umbralSaldoMinimo: 500, prestamos: [], numeroPeriodos: 1 })
    expect(alertas.find((a) => a.tipo === 'saldo_bajo')).toBeDefined()
  })

  it('sin umbral, no genera alerta saldo_bajo', () => {
    const resultados = [makePeriodo({ periodo: 1, saldoAcumulado: 100 })]
    const alertas = evaluarAlertas({ resultados, prestamos: [], numeroPeriodos: 1 })
    expect(alertas.find((a) => a.tipo === 'saldo_bajo')).toBeUndefined()
  })
})

describe('evaluarAlertas — cuotas exceden horizonte', () => {
  it('alerta informativa cuando cuotas exceden períodos', () => {
    const prestamo = { id: '1', nombre: 'P', monto: 5000, tasaAnual: 0, numeroCuotas: 10, periodoInicio: 0 }
    const resultados = [makePeriodo({ periodo: 1, saldoAcumulado: 5000 })]
    const alertas = evaluarAlertas({ resultados, prestamos: [prestamo], numeroPeriodos: 3 })
    expect(alertas.find((a) => a.tipo === 'cuotas_exceden_horizonte')).toBeDefined()
  })
})

describe('evaluarAlertas — sin alertas', () => {
  it('retorna array vacío si todo está bien', () => {
    const resultados = [
      makePeriodo({ periodo: 1, saldoAcumulado: 2000, flujoNeto: 500 }),
      makePeriodo({ periodo: 2, saldoAcumulado: 2500, flujoNeto: 500 }),
    ]
    const alertas = evaluarAlertas({ resultados, prestamos: [], numeroPeriodos: 2 })
    expect(alertas).toHaveLength(0)
  })
})
