# Contratos Internos — Flujosys

Sin backend en Fase 1. Los "contratos" son las interfaces TypeScript entre módulos
y las firmas de las funciones puras de cálculo.

---

## Funciones de Cálculo (src/lib/calculos/)

### flujo.ts

```typescript
/**
 * Calcula el flujo neto de un período.
 * Flujo = Ingresos - Egresos + Desembolsos de préstamos - Cuotas de préstamos
 */
export function calcularFlujoPeriodo(params: {
  totalIngresos: number
  totalEgresos: number
  desembolsosPrestamos: number
  cuotasPrestamos: number
}): number

/**
 * Calcula el array completo de ResultadoPeriodo para toda la proyección.
 * Entrada: datos del store. Salida: array listo para renderizar y exportar.
 */
export function calcularProyeccion(params: {
  config: ProyeccionConfig
  categoriasIngreso: CategoriaIngreso[]
  categoriasEgreso: CategoriaEgreso[]
  prestamos: Prestamo[]
}): ResultadoPeriodo[]

/**
 * Genera el label de un período según la unidad de tiempo.
 * Ej: unidad='mes', periodo=3 → "Mes 3"
 *     unidad='semana', periodo=1 → "Semana 1"
 */
export function generarLabelPeriodo(unidad: UnidadPeriodo, periodo: number): string

/**
 * Redondea un valor financiero a 2 decimales.
 * Usar en TODOS los cálculos antes de almacenar o mostrar.
 */
export function redondear(valor: number): number
```

### amortizacion.ts

```typescript
/**
 * Convierte tasa anual (porcentaje) a tasa por período usando fórmula compuesta.
 * i_periodo = (1 + i_anual/100)^(1/periodos_por_año) - 1
 */
export function convertirTasaAnual(params: {
  tasaAnualPorcentaje: number
  unidadPeriodo: UnidadPeriodo
}): number

/**
 * Calcula la cuota fija usando el sistema francés de amortización.
 * Devuelve 0 si tasaPeriodo es 0 (divide monto en cuotas iguales).
 */
export function calcularCuotaFrances(params: {
  monto: number
  tasaPeriodo: number
  numeroCuotas: number
}): number

/**
 * Genera la tabla de amortización completa de un préstamo.
 */
export function generarTablaAmortizacion(params: {
  prestamo: Prestamo
  unidadPeriodo: UnidadPeriodo
}): CuotaAmortizacion[]

/**
 * Mapea las cuotas de TODOS los préstamos a sus períodos correspondientes.
 * Retorna un array de length=numeroPeriodos con {desembolsos, cuotas} por período.
 */
export function mapearFinanciamientoAPeriodos(params: {
  prestamos: Prestamo[]
  numeroPeriodos: number
  unidadPeriodo: UnidadPeriodo
}): Array<{ desembolsos: number; cuotas: number }>
```

### alertas.ts

```typescript
/**
 * Evalúa los resultados del flujo y retorna todas las alertas activas.
 */
export function evaluarAlertas(params: {
  resultados: ResultadoPeriodo[]
  umbralSaldoMinimo?: number
  prestamos: Prestamo[]
  numeroPeriodos: number
}): Alerta[]

/**
 * Genera el texto de recomendación para un tipo de alerta.
 */
export function generarRecomendacion(params: {
  tipo: TipoAlerta
  periodosAfectados: number[]
  categoriasEgreso?: CategoriaEgreso[]
}): string
```

### simulacion.ts

```typescript
/**
 * Clona la proyección base para crear un nuevo escenario.
 * El escenario hereda numeroPeriodos de la base pero es editable.
 */
export function clonarProyeccionComoEscenario(params: {
  config: ProyeccionConfig
  categoriasIngreso: CategoriaIngreso[]
  categoriasEgreso: CategoriaEgreso[]
  prestamos: Prestamo[]
  nombre: string
}): Escenario

/**
 * Redimensiona los arrays de montos al cambiar numeroPeriodos de un escenario.
 * Si crece: rellena con 0. Si reduce: trunca.
 */
export function redimensionarMontos(montos: number[], nuevaLongitud: number): number[]

/**
 * Calcula los resultados de un escenario (misma lógica que calcularProyeccion).
 */
export function calcularEscenario(escenario: Escenario): ResultadoPeriodo[]

/**
 * Compara el saldo final de la base contra cada escenario.
 * Resultado: delta positivo = escenario mejor, negativo = peor.
 */
export function compararEscenarios(params: {
  base: ResultadoPeriodo[]
  escenarios: Array<{ id: string; nombre: string; resultados: ResultadoPeriodo[] }>
}): Array<{
  id: string
  nombre: string
  saldoFinal: number
  deltaVsBase: number
  mejor: boolean
}>
```

---

## Zustand Stores — Interfaz Pública

### useConfigStore

```typescript
interface ConfigStore {
  config: ProyeccionConfig | null
  isLoaded: boolean
  // Actions
  cargarConfig: () => Promise<void>          // hidrata desde IDB al inicio
  actualizarConfig: (partial: Partial<ProyeccionConfig>) => Promise<void>
  cambiarUnidadPeriodo: (nueva: UnidadPeriodo) => Promise<void>  // borra datos con confirmación
  resetear: () => Promise<void>              // "Nueva proyección"
}
```

### useIngresosStore / useEgresosStore

```typescript
interface IngresosStore {
  categorias: CategoriaIngreso[]
  isLoaded: boolean
  // Actions
  cargar: () => Promise<void>
  agregarCategoria: (nombre: string) => Promise<void>
  actualizarMonto: (id: string, periodo: number, monto: number) => Promise<void>
  eliminarCategoria: (id: string) => Promise<void>
  redimensionar: (nuevaLongitud: number) => Promise<void>  // al cambiar períodos
}
```

### useFinanciamientoStore

```typescript
interface FinanciamientoStore {
  prestamos: Prestamo[]
  isLoaded: boolean
  // Actions
  cargar: () => Promise<void>
  agregarPrestamo: (data: Omit<Prestamo, 'id'>) => Promise<void>
  eliminarPrestamo: (id: string) => Promise<void>
  // Computed (via lib/calculos/amortizacion)
  getTablaAmortizacion: (prestamoId: string) => CuotaAmortizacion[]
  getImpactoPorPeriodos: () => Array<{ desembolsos: number; cuotas: number }>
}
```

### useFlujoStore (derivado, no persiste)

```typescript
interface FlujoStore {
  resultados: ResultadoPeriodo[]
  // Se recalcula automáticamente cuando cambian config, ingresos, egresos o préstamos
  // No tiene acciones de mutación — es solo lectura
}
```

### useAlertasStore (derivado, no persiste)

```typescript
interface AlertasStore {
  alertas: Alerta[]
  tieneAlertas: boolean
  alertasCriticas: Alerta[]
  // Se recalcula automáticamente cuando cambia useFlujoStore
}
```

### useSimulacionStore

```typescript
interface SimulacionStore {
  escenarios: Escenario[]
  escenarioActivo: string | null   // id del escenario en edición
  isLoaded: boolean
  // Actions
  cargar: () => Promise<void>
  crearEscenario: (nombre: string) => Promise<void>  // clona la base
  duplicarEscenario: (id: string) => Promise<void>
  eliminarEscenario: (id: string) => Promise<void>
  actualizarEscenario: (id: string, changes: Partial<Escenario>) => Promise<void>
  seleccionarEscenario: (id: string | null) => void
  // Computed
  getResultadosEscenario: (id: string) => ResultadoPeriodo[]
  getComparacion: () => ReturnType<typeof compararEscenarios>
}
```

---

## Convenciones de Integración

- Los módulos de UI **solo** leen stores y llaman actions — nunca calculan directamente.
- Las funciones de `src/lib/calculos/` **nunca** importan stores ni acceden a IDB.
- Los stores **siempre** persisten en IDB antes de actualizar el estado en memoria.
- `useFlujoStore` y `useAlertasStore` se suscriben automáticamente a los stores de datos
  usando `zustand/middleware` o subscriptions — no requieren llamada manual.
