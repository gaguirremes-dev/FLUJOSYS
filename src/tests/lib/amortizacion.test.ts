import { describe, it, expect } from 'vitest'
import {
  convertirTasaAnual,
  calcularCuotaFrances,
  generarTablaAmortizacion,
  mapearFinanciamientoAPeriodos,
} from '../../lib/calculos/amortizacion'
import type { Prestamo } from '../../types'

describe('convertirTasaAnual', () => {
  it('tasa 0% retorna 0', () =>
    expect(convertirTasaAnual({ tasaAnualPorcentaje: 0, unidadPeriodo: 'mes' })).toBe(0))

  it('12% anual a mensual ≈ 0.9489%', () => {
    const tasa = convertirTasaAnual({ tasaAnualPorcentaje: 12, unidadPeriodo: 'mes' })
    expect(tasa).toBeCloseTo(0.009489, 4)
  })

  it('12% anual a anual = 12%', () => {
    const tasa = convertirTasaAnual({ tasaAnualPorcentaje: 12, unidadPeriodo: 'año' })
    expect(tasa).toBeCloseTo(0.12, 6)
  })
})

describe('calcularCuotaFrances', () => {
  it('tasa 0% divide monto en cuotas iguales', () =>
    expect(calcularCuotaFrances({ monto: 12000, tasaPeriodo: 0, numeroCuotas: 12 })).toBe(1000))

  it('cuota correcta vs. referencia (S/10000, 12% anual, 12 cuotas mensuales)', () => {
    const tasa = convertirTasaAnual({ tasaAnualPorcentaje: 12, unidadPeriodo: 'mes' })
    const cuota = calcularCuotaFrances({ monto: 10000, tasaPeriodo: tasa, numeroCuotas: 12 })
    // TEA 12% → TEM = (1.12)^(1/12)-1 ≈ 0.9489% → cuota ≈ 885.62
    expect(cuota).toBeCloseTo(885.62, 0)
  })

  it('0 cuotas retorna 0', () =>
    expect(calcularCuotaFrances({ monto: 5000, tasaPeriodo: 0.01, numeroCuotas: 0 })).toBe(0))
})

describe('generarTablaAmortizacion', () => {
  const prestamo: Prestamo = {
    id: '1',
    nombre: 'Test',
    monto: 10000,
    tasaAnual: 12,
    numeroCuotas: 12,
    periodoInicio: 0,
  }

  it('suma de capitales amortizados ≈ monto original', () => {
    const tabla = generarTablaAmortizacion({ prestamo, unidadPeriodo: 'mes' })
    const totalCapital = tabla.reduce((sum, c) => sum + c.capital, 0)
    expect(totalCapital).toBeCloseTo(10000, 0)
  })

  it('saldo pendiente llega a 0 al final', () => {
    const tabla = generarTablaAmortizacion({ prestamo, unidadPeriodo: 'mes' })
    expect(tabla.at(-1)!.saldoPendiente).toBe(0)
  })

  it('número de filas = numeroCuotas', () => {
    const tabla = generarTablaAmortizacion({ prestamo, unidadPeriodo: 'mes' })
    expect(tabla).toHaveLength(12)
  })

  it('los períodos empiezan en periodoInicio + 1', () => {
    const tabla = generarTablaAmortizacion({ prestamo: { ...prestamo, periodoInicio: 2 }, unidadPeriodo: 'mes' })
    expect(tabla[0].periodo).toBe(3)
  })
})

describe('mapearFinanciamientoAPeriodos', () => {
  const prestamo: Prestamo = {
    id: '1',
    nombre: 'Préstamo',
    monto: 5000,
    tasaAnual: 0,
    numeroCuotas: 3,
    periodoInicio: 0,
  }

  it('desembolso en período de inicio', () => {
    const mapa = mapearFinanciamientoAPeriodos({ prestamos: [prestamo], numeroPeriodos: 5, unidadPeriodo: 'mes' })
    expect(mapa[0].desembolsos).toBe(5000)
    expect(mapa[1].desembolsos).toBe(0)
  })

  it('cuotas en períodos correctos (tasa 0, 3 cuotas)', () => {
    const mapa = mapearFinanciamientoAPeriodos({ prestamos: [prestamo], numeroPeriodos: 5, unidadPeriodo: 'mes' })
    expect(mapa[0].cuotas).toBe(0)        // período 0 = desembolso, sin cuota
    expect(mapa[1].cuotas).toBeCloseTo(1666.67, 0) // cuota 1
    expect(mapa[2].cuotas).toBeCloseTo(1666.67, 0) // cuota 2
    expect(mapa[3].cuotas).toBeCloseTo(1666.67, 0) // cuota 3
    expect(mapa[4].cuotas).toBe(0)        // fuera de las cuotas
  })

  it('múltiples préstamos se acumulan', () => {
    const p2 = { ...prestamo, id: '2', monto: 3000 }
    const mapa = mapearFinanciamientoAPeriodos({ prestamos: [prestamo, p2], numeroPeriodos: 5, unidadPeriodo: 'mes' })
    expect(mapa[0].desembolsos).toBe(8000)
  })

  it('cuotas fuera del horizonte no aparecen', () => {
    const pLargo: Prestamo = { ...prestamo, numeroCuotas: 10 }
    const mapa = mapearFinanciamientoAPeriodos({ prestamos: [pLargo], numeroPeriodos: 3, unidadPeriodo: 'mes' })
    expect(mapa).toHaveLength(3)
  })
})
