import type { Alerta, CategoriaEgreso, Prestamo, ResultadoPeriodo, TipoAlerta } from '../../types'

let alertaIdCounter = 0
function nextId(): string {
  return `alerta-${++alertaIdCounter}`
}

export function generarRecomendacion(params: {
  tipo: TipoAlerta
  periodosAfectados: number[]
  categoriasEgreso?: CategoriaEgreso[]
}): string {
  const { tipo, periodosAfectados } = params
  const periodos = periodosAfectados.join(', ')

  switch (tipo) {
    case 'saldo_negativo':
      return `El saldo acumulado es negativo en el período ${periodos}. Considera aumentar ingresos en períodos anteriores, reducir egresos o incorporar financiamiento.`
    case 'deficit_inminente':
      return `El saldo entrará en déficit en el período ${periodos}. Toma acción antes de que ocurra: revisa tus egresos o gestiona un préstamo puente.`
    case 'flujo_negativo':
      return `El flujo neto es negativo en el período ${periodos}. Los egresos superan a los ingresos en ese período. Revisa si algún egreso puede diferirse.`
    case 'saldo_bajo':
      return `El saldo proyectado en el período ${periodos} está por debajo del mínimo configurado. Considera reforzar los ingresos o reducir egresos no esenciales.`
    case 'cuotas_exceden_horizonte':
      return `Las cuotas de uno o más préstamos exceden el horizonte de proyección. Amplía el número de períodos para ver el impacto completo de la deuda.`
    default:
      return 'Revisa los datos del período afectado.'
  }
}

export function evaluarAlertas(params: {
  resultados: ResultadoPeriodo[]
  umbralSaldoMinimo?: number
  prestamos: Prestamo[]
  numeroPeriodos: number
}): Alerta[] {
  const { resultados, umbralSaldoMinimo, prestamos, numeroPeriodos } = params
  const alertas: Alerta[] = []

  // Saldo negativo (crítica)
  const periodosNegativo = resultados
    .filter((r) => r.saldoAcumulado < 0)
    .map((r) => r.periodo)

  if (periodosNegativo.length > 0) {
    const peorPeriodo = resultados.find((r) => periodosNegativo.includes(r.periodo))
    alertas.push({
      id: nextId(),
      tipo: 'saldo_negativo',
      severidad: 'critica',
      periodosAfectados: periodosNegativo,
      monto: Math.abs(peorPeriodo?.saldoAcumulado ?? 0),
      recomendacion: generarRecomendacion({ tipo: 'saldo_negativo', periodosAfectados: periodosNegativo }),
    })
  }

  // Déficit inminente — saldo positivo ahora pero negativo en los próximos 2 períodos
  const periodosInminente: number[] = []
  for (let i = 0; i < resultados.length - 1; i++) {
    const actual = resultados[i]
    const siguiente = resultados[i + 1]
    const siguiente2 = resultados[i + 2]
    if (
      actual.saldoAcumulado >= 0 &&
      (siguiente?.saldoAcumulado < 0 || siguiente2?.saldoAcumulado < 0)
    ) {
      if (!periodosNegativo.includes(actual.periodo)) {
        periodosInminente.push(actual.periodo + 1)
      }
    }
  }
  if (periodosInminente.length > 0) {
    alertas.push({
      id: nextId(),
      tipo: 'deficit_inminente',
      severidad: 'alta',
      periodosAfectados: [...new Set(periodosInminente)],
      monto: 0,
      recomendacion: generarRecomendacion({ tipo: 'deficit_inminente', periodosAfectados: periodosInminente }),
    })
  }

  // Flujo neto negativo pero saldo positivo (media)
  const periodosFlujoNegativo = resultados
    .filter((r) => r.flujoNeto < 0 && r.saldoAcumulado >= 0)
    .map((r) => r.periodo)

  if (periodosFlujoNegativo.length > 0) {
    alertas.push({
      id: nextId(),
      tipo: 'flujo_negativo',
      severidad: 'media',
      periodosAfectados: periodosFlujoNegativo,
      monto: 0,
      recomendacion: generarRecomendacion({ tipo: 'flujo_negativo', periodosAfectados: periodosFlujoNegativo }),
    })
  }

  // Saldo bajo (media) — solo si hay umbral y el saldo está entre 0 y el umbral
  if (umbralSaldoMinimo !== undefined && umbralSaldoMinimo > 0) {
    const periodosBajo = resultados
      .filter((r) => r.saldoAcumulado >= 0 && r.saldoAcumulado < umbralSaldoMinimo)
      .map((r) => r.periodo)

    if (periodosBajo.length > 0) {
      alertas.push({
        id: nextId(),
        tipo: 'saldo_bajo',
        severidad: 'media',
        periodosAfectados: periodosBajo,
        monto: umbralSaldoMinimo,
        recomendacion: generarRecomendacion({ tipo: 'saldo_bajo', periodosAfectados: periodosBajo }),
      })
    }
  }

  // Cuotas que exceden el horizonte (informativa)
  const exceden = prestamos.some((p) => p.periodoInicio + p.numeroCuotas > numeroPeriodos)
  if (exceden) {
    alertas.push({
      id: nextId(),
      tipo: 'cuotas_exceden_horizonte',
      severidad: 'informativa',
      periodosAfectados: [],
      monto: 0,
      recomendacion: generarRecomendacion({ tipo: 'cuotas_exceden_horizonte', periodosAfectados: [] }),
    })
  }

  return alertas
}
