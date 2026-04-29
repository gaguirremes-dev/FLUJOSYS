// ─── Configuración ────────────────────────────────────────────────────────────

export type Moneda = 'PEN' | 'USD' | 'EUR'
export type UnidadPeriodo = 'dia' | 'semana' | 'mes' | 'año'

export interface ProyeccionConfig {
  id: 'singleton'
  proyeccionId?: string
  nombreEmpresa: string
  moneda: Moneda
  unidadPeriodo: UnidadPeriodo
  numeroPeriodos: number // 1–120
  saldoInicial: number
  umbralSaldoMinimo?: number
  logoBase64?: string
  creadoEn: string
  actualizadoEn: string
}

// ─── Ingresos ─────────────────────────────────────────────────────────────────

export interface CategoriaIngreso {
  id: string
  nombre: string
  montos: number[] // length === numeroPeriodos, índice 0 = período 1
  orden: number
}

// ─── Egresos ──────────────────────────────────────────────────────────────────

export type TipoEgreso = 'compras' | 'planilla' | 'servicios' | 'tributos' | 'otro'

export interface CategoriaEgreso {
  id: string
  nombre: string
  tipo: TipoEgreso
  montos: number[]
  orden: number
}

// ─── Financiamiento ───────────────────────────────────────────────────────────

export interface Prestamo {
  id: string
  nombre: string
  monto: number
  tasaAnual: number // porcentaje, ej: 12 para 12% anual
  numeroCuotas: number
  periodoInicio: number // índice 0-based
}

export interface CuotaAmortizacion {
  periodo: number // índice 0-based
  cuotaTotal: number
  interes: number
  capital: number
  saldoPendiente: number
}

// ─── Resultados computados ────────────────────────────────────────────────────

export interface ResultadoPeriodo {
  periodo: number // 1-based (para mostrar al usuario)
  label: string
  totalIngresos: number
  totalEgresos: number
  desembolsosPrestamos: number
  cuotasPrestamos: number
  flujoNeto: number
  saldoAcumulado: number
}

// ─── Simulación ───────────────────────────────────────────────────────────────

export interface Escenario {
  id: string
  nombre: string
  numeroPeriodos: number
  saldoInicial: number
  umbralSaldoMinimo?: number
  categoriasIngreso: CategoriaIngreso[]
  categoriasEgreso: CategoriaEgreso[]
  prestamos: Prestamo[]
  creadoEn: string
  actualizadoEn: string
}

// ─── Alertas ─────────────────────────────────────────────────────────────────

export type TipoAlerta =
  | 'saldo_negativo'
  | 'deficit_inminente'
  | 'flujo_negativo'
  | 'saldo_bajo'
  | 'cuotas_exceden_horizonte'

export type SeveridadAlerta = 'critica' | 'alta' | 'media' | 'informativa'

export interface Alerta {
  id: string
  tipo: TipoAlerta
  severidad: SeveridadAlerta
  periodosAfectados: number[] // 1-based
  monto: number
  recomendacion: string
}

// ─── Proyecciones guardadas ───────────────────────────────────────────────────

export interface Proyeccion {
  id: string
  nombre: string
  moneda: Moneda
  numeroPeriodos: number
  creadoEn: string
  actualizadoEn: string
  snapshot: {
    config: ProyeccionConfig
    categoriasIngreso: CategoriaIngreso[]
    categoriasEgreso: CategoriaEgreso[]
    prestamos: Prestamo[]
  }
}

// ─── Comparación de escenarios ────────────────────────────────────────────────

export interface ComparacionEscenario {
  id: string
  nombre: string
  saldoFinal: number
  deltaVsBase: number
  mejor: boolean
}
