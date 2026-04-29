# Plan Técnico — Flujosys

## Constitution Check

| Principio | Cumplimiento |
|-----------|-------------|
| Cero backend Fase 1 | ✅ Todo en frontend. IndexedDB para persistencia. |
| Corrección financiera con tests | ✅ Funciones de cálculo puras en `src/lib/` con 100% cobertura Vitest. |
| Recalculo reactivo | ✅ Zustand stores derivados — cualquier cambio propaga automáticamente. |
| Simplicidad para usuario no técnico | ✅ React Hook Form + Zod validan antes de llegar al store. |
| Extensible a Fase 2 | ✅ Separación clara entre lógica de negocio (`lib/`) y persistencia (`db/`). |

---

## Decisiones Técnicas

### Estado global — Zustand
Zustand maneja el estado compartido entre módulos. Se eligió sobre Context API porque
el flujo de caja es leído simultáneamente por alertas, simulación y reportes — Zustand
evita re-renders innecesarios con selectores granulares.

Cada store tiene responsabilidad única:
- `useConfigStore` — configuración de la proyección (moneda, períodos, saldo inicial)
- `useIngresosStore` — categorías de ingresos con montos por período
- `useEgresosStore` — categorías de egresos con montos por período
- `useFinanciamientoStore` — préstamos registrados y sus cuotas calculadas
- `useFlujoStore` — resultados computados del motor (derivado, no persiste en IDB)
- `useSimulacionStore` — escenarios creados por el usuario
- `useAlertasStore` — alertas activas (derivado del flujo)

### Lógica de negocio — funciones puras en `src/lib/`
Todo cálculo financiero vive en funciones puras sin efectos secundarios. Los stores
llaman estas funciones — nunca calculan ellos mismos. Esto garantiza testabilidad total.

```
src/lib/calculos/
  flujo.ts         → calcularFlujoPeriodo(), calcularSaldoAcumulado()
  amortizacion.ts  → calcularCuotaFrances(), generarTablaAmortizacion(), convertirTasa()
  alertas.ts       → evaluarAlertas(), generarRecomendacion()
  simulacion.ts    → clonarProyeccion(), compararEscenarios()
```

### Persistencia — IndexedDB via `idb`
La librería `idb` envuelve IndexedDB con Promises. Cada store sincroniza con IDB
al mutar. La carga inicial (al abrir el navegador) hidrata los stores desde IDB.

### Validación — Zod + React Hook Form
Zod define los esquemas de validación. React Hook Form los consume con `zodResolver`.
Los errores se muestran inline, nunca como alertas emergentes.

---

## Estructura de Carpetas

```
flujosys/
├── public/
├── src/
│   ├── modules/
│   │   ├── config/              # Configuración inicial (nombre, moneda, períodos)
│   │   ├── ingresos/            # Módulo 01 — ingresos
│   │   ├── egresos/             # Módulo 01 — egresos
│   │   ├── flujo-caja/          # Módulo 04 — tabla y motor
│   │   ├── financiamiento/      # Módulo 05 — préstamos
│   │   ├── simulacion/          # Módulo 06 — escenarios
│   │   ├── alertas/             # Módulo 07 — panel de alertas
│   │   └── reportes/            # Módulo 08 — exportación
│   ├── store/
│   │   ├── configStore.ts
│   │   ├── ingresosStore.ts
│   │   ├── egresosStore.ts
│   │   ├── financiamientoStore.ts
│   │   ├── flujoStore.ts        # Derivado — no persiste
│   │   ├── simulacionStore.ts
│   │   └── alertasStore.ts      # Derivado — no persiste
│   ├── lib/
│   │   └── calculos/
│   │       ├── flujo.ts
│   │       ├── amortizacion.ts
│   │       ├── alertas.ts
│   │       └── simulacion.ts
│   ├── db/
│   │   ├── schema.ts            # Definición de object stores IDB
│   │   └── index.ts             # Instancia idb y helpers CRUD
│   ├── components/              # UI compartida (Button, Table, Modal, etc.)
│   ├── types/
│   │   └── index.ts             # Todos los tipos TypeScript del dominio
│   ├── App.tsx
│   └── main.tsx
├── tests/
│   └── lib/
│       ├── flujo.test.ts
│       ├── amortizacion.test.ts
│       ├── alertas.test.ts
│       └── simulacion.test.ts
├── CLAUDE.md
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## Flujo de Datos

```
[Formulario] → Zod validation → [Store Zustand] → IDB persist
                                      ↓
                              lib/calculos/flujo.ts
                                      ↓
                              [useFlujoStore]  ←── leído por:
                                      ├── Módulo 04 (tabla)
                                      ├── Módulo 07 (alertas)
                                      ├── Módulo 06 (simulación)
                                      └── Módulo 08 (reportes)
```

---

## Navegación

SPA de una sola página con navegación lateral. Secciones:

1. **Configuración** — primer acceso o desde settings
2. **Ingresos** — categorías y montos
3. **Egresos** — categorías y montos
4. **Financiamiento** — préstamos
5. **Flujo de Caja** — tabla principal + gráficos
6. **Simulación** — escenarios
7. **Alertas** — panel de alertas activas
8. **Reportes** — exportación PDF/Excel

---

## Librerías y Justificación

| Librería | Versión | Uso | Justificación |
|----------|---------|-----|---------------|
| zustand | ^4 | Estado global | Selectores granulares, sin boilerplate |
| idb | ^8 | IndexedDB wrapper | API Promise limpia, tipada con TS |
| react-hook-form | ^7 | Formularios | Performance (uncontrolled), integra Zod |
| zod | ^3 | Validación | TypeScript-first, reutilizable en lib/ |
| recharts | ^2 | Gráficos | React-native, responsive, customizable |
| jspdf | ^2 | Exportación PDF | Client-side, sin servidor |
| jspdf-autotable | ^3 | Tablas en PDF | Plugin oficial jsPDF para tablas |
| xlsx | ^0.18 | Exportación Excel | SheetJS, client-side |
| vitest | ^1 | Testing | Nativo Vite, misma config |
| @testing-library/react | ^14 | Testing componentes | Estándar para React |

---

## Fase 2 — Notas de Arquitectura (no implementar)

Para agregar autenticación y multi-usuario en Fase 2:
- Agregar backend (Node.js + Express o Next.js API Routes)
- Migrar persistencia de IndexedDB a PostgreSQL
- Los stores de Zustand ya están diseñados para ser hidratados desde API en lugar de IDB
- La capa `src/lib/calculos/` no requiere cambios — es agnóstica al origen de datos
- Agregar `userId` como discriminador en todos los object stores de IDB (ya considerado en schema)
