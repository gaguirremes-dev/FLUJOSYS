# Data Model — Flujosys

Persistencia en IndexedDB via librería `idb`. Base de datos: `flujosys-db` versión 1.

---

## TypeScript Types (src/types/index.ts)

```typescript
// ─── Configuración ────────────────────────────────────────────────────────────

export type Moneda = 'PEN' | 'USD' | 'EUR'
export type UnidadPeriodo = 'dia' | 'semana' | 'mes' | 'año'

export interface ProyeccionConfig {
  id: 'singleton'              // único registro
  nombreEmpresa: string        // default: "Mi Empresa"
  moneda: Moneda               // default: 'PEN'
  unidadPeriodo: UnidadPeriodo // default: 'mes'
  numeroPeriodos: number       // 1–120
  saldoInicial: number         // puede ser negativo
  umbralSaldoMinimo?: number   // alerta cuando saldo < umbral
  logoBase64?: string          // PNG/JPG, max 500KB, almacenado como base64
  creadoEn: string             // ISO date string
  actualizadoEn: string
}

// ─── Ingresos ─────────────────────────────────────────────────────────────────

export interface CategoriaIngreso {
  id: string                   // uuid
  nombre: string               // ej: "Ventas al contado"
  montos: number[]             // length = numeroPeriodos, index 0 = período 1
  orden: number                // para mantener orden de visualización
}

// ─── Egresos ──────────────────────────────────────────────────────────────────

export type TipoEgreso = 'compras' | 'planilla' | 'servicios' | 'tributos' | 'otro'

export interface CategoriaEgreso {
  id: string
  nombre: string
  tipo: TipoEgreso
  montos: number[]             // length = numeroPeriodos
  orden: number
}

// ─── Financiamiento ───────────────────────────────────────────────────────────

export interface Prestamo {
  id: string
  nombre: string               // ej: "Préstamo BCP"
  monto: number                // monto del desembolso
  tasaAnual: number            // porcentaje, ej: 12 para 12% anual
  numeroCuotas: number
  periodoInicio: number        // índice 0-based del período de desembolso
}

export interface CuotaAmortizacion {
  periodo: number              // índice 0-based
  cuotaTotal: number
  interes: number
  capital: number
  saldoPendiente: number
}

// ─── Resultados computados (no persisten en IDB) ──────────────────────────────

export interface ResultadoPeriodo {
  periodo: number              // 1-based (para mostrar al usuario)
  label: string                // "Mes 1", "Semana 3", "Año 2", etc.
  totalIngresos: number
  totalEgresos: number
  desembolsosPrestamos: number // suma de desembolsos en este período
  cuotasPrestamos: number      // suma de cuotas en este período
  flujoNeto: number            // totalIngresos - totalEgresos + desembolsos - cuotas
  saldoAcumulado: number       // saldoInicial + Σ flujoNeto(0..periodo)
}

// ─── Simulación ───────────────────────────────────────────────────────────────

export interface Escenario {
  id: string
  nombre: string               // ej: "Escenario optimista"
  numeroPeriodos: number       // puede diferir de la base, 1–120
  saldoInicial: number
  umbralSaldoMinimo?: number
  categoriasIngreso: CategoriaIngreso[]
  categoriasEgreso: CategoriaEgreso[]
  prestamos: Prestamo[]
  creadoEn: string
  actualizadoEn: string
}

// ─── Alertas (no persisten en IDB) ───────────────────────────────────────────

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
  periodosAfectados: number[]  // índices 1-based
  monto: number                // valor del déficit o saldo bajo
  recomendacion: string
}
```

---

## IndexedDB Schema (src/db/schema.ts)

```typescript
export interface FlujosysDB extends DBSchema {
  config: {
    key: 'singleton'
    value: ProyeccionConfig
  }
  categorias_ingreso: {
    key: string              // id
    value: CategoriaIngreso
    indexes: { 'by-orden': number }
  }
  categorias_egreso: {
    key: string
    value: CategoriaEgreso
    indexes: { 'by-orden': number }
  }
  prestamos: {
    key: string
    value: Prestamo
  }
  escenarios: {
    key: string
    value: Escenario
    indexes: { 'by-nombre': string }
  }
}
```

## Reglas de IndexedDB

- **Una sola base de datos:** `flujosys-db`, versión 1.
- **Sin soft delete en Fase 1:** eliminar es eliminar permanentemente.
- **Arrays de montos:** siempre tienen `length === numeroPeriodos`. Al cambiar `numeroPeriodos`, redimensionar todos los arrays (rellenar con 0 o truncar).
- **Logo:** almacenado como string base64 en el campo `config.logoBase64`. Validar tamaño antes de guardar (max ~666KB en base64 para 500KB de imagen).
- **Escenarios:** máximo 10. Validar al crear antes de persistir.
- **Migraciones Fase 2:** al incrementar la versión de IDB, usar el callback `upgrade` de `idb` para agregar el campo `userId` a cada object store.
