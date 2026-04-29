# Tasks — Flujosys

Trabajo individual. Tareas secuenciales por fase. Cada tarea tiene input, output y verificación.

---

## Phase 0: Setup e Infraestructura

- [ ] TASK-001: Inicializar proyecto React + Vite + TypeScript
  - Input: Node.js instalado, npm disponible
  - Output: Proyecto corriendo en localhost:5173 con `npm run dev`
  - Depends on: —
  - Verification: `npm run dev` abre la app sin errores en consola

- [ ] TASK-002: Configurar Tailwind CSS
  - Input: Proyecto TASK-001 creado
  - Output: Clase `text-blue-500` funciona en un componente de prueba
  - Depends on: TASK-001
  - Verification: Elemento con clase Tailwind visible en el navegador

- [ ] TASK-003: Configurar ESLint + Prettier
  - Input: Proyecto base
  - Output: `npm run lint` y `npm run format` funcionan sin errores
  - Depends on: TASK-001
  - Verification: Archivo con error de formato es detectado por ESLint

- [ ] TASK-004: Configurar Vitest + React Testing Library
  - Input: Proyecto base
  - Output: `npm run test` ejecuta una prueba de ejemplo y pasa
  - Depends on: TASK-001
  - Verification: Test dummy `expect(1+1).toBe(2)` pasa en verde

- [ ] TASK-005: Inicializar Git + repositorio GitHub
  - Input: Cuenta GitHub disponible
  - Output: Repositorio `flujosys` en GitHub con primer commit
  - Depends on: TASK-001
  - Verification: `git log` muestra commit inicial; repositorio visible en GitHub

- [ ] TASK-006: Conectar Vercel al repositorio
  - Input: Cuenta Vercel, repositorio TASK-005
  - Output: URL pública de Vercel desplegando la app de ejemplo
  - Depends on: TASK-005
  - Verification: URL de Vercel abre la app sin errores

- [ ] TASK-007: Instalar dependencias del proyecto
  - Input: Proyecto base
  - Output: `node_modules` con todas las librerías instaladas
  - Depends on: TASK-001
  - Command: `npm install zustand idb react-hook-form zod @hookform/resolvers recharts jspdf jspdf-autotable xlsx`
  - Verification: `npm ls zustand recharts jspdf xlsx` sin errores

---

## Phase 1: Tipos, DB y Estructura Base

- [ ] TASK-008: Definir todos los tipos TypeScript del dominio
  - Input: data-model.md y contratos-internos.md
  - Output: `src/types/index.ts` con todos los interfaces y tipos exportados
  - Depends on: TASK-001
  - Verification: `npm run build` sin errores de tipos

- [ ] TASK-009: Configurar IndexedDB schema e helpers
  - Input: TASK-008 (tipos definidos)
  - Output: `src/db/schema.ts` y `src/db/index.ts` con CRUD para cada object store
  - Depends on: TASK-008
  - Verification: Test manual — guardar y recuperar un objeto en IDB desde DevTools

- [ ] TASK-010: Crear estructura de carpetas de módulos y stores
  - Input: plan.md (estructura de carpetas)
  - Output: Carpetas `src/modules/`, `src/store/`, `src/lib/calculos/`, `src/components/` creadas con archivos index vacíos
  - Depends on: TASK-008
  - Verification: Estructura coincide exactamente con plan.md

---

## Phase 2: Lógica de Negocio + Tests (100% cobertura)

- [ ] TASK-011: Implementar `src/lib/calculos/flujo.ts` + tests
  - Input: Spec 004, contratos-internos.md — funciones `calcularFlujoPeriodo`, `calcularProyeccion`, `generarLabelPeriodo`, `redondear`
  - Output: Funciones implementadas + `tests/lib/flujo.test.ts` con 100% cobertura
  - Depends on: TASK-008
  - Verification: `npm run test flujo` — todos los casos pasan:
    - Flujo positivo: ingresos > egresos
    - Flujo negativo: egresos > ingresos
    - Saldo acumulado encadenado correctamente
    - Saldo inicial negativo funciona
    - 0 períodos no rompe la función
    - Sin errores de punto flotante en 120 períodos

- [ ] TASK-012: Implementar `src/lib/calculos/amortizacion.ts` + tests
  - Input: Spec 005, contratos-internos.md — funciones `convertirTasaAnual`, `calcularCuotaFrances`, `generarTablaAmortizacion`, `mapearFinanciamientoAPeriodos`
  - Output: Funciones implementadas + `tests/lib/amortizacion.test.ts` con 100% cobertura
  - Depends on: TASK-008
  - Verification: `npm run test amortizacion` — todos los casos pasan:
    - Cuota sistema francés correcta vs. calculadora financiera externa
    - Suma de capitales amortizados = monto original del préstamo
    - Tasa 0% divide en cuotas iguales
    - Conversión de tasa mensual, semanal, diaria, anual correcta
    - Múltiples préstamos se acumulan correctamente por período

- [ ] TASK-013: Implementar `src/lib/calculos/alertas.ts` + tests
  - Input: Spec 007, contratos-internos.md — funciones `evaluarAlertas`, `generarRecomendacion`
  - Output: Funciones implementadas + `tests/lib/alertas.test.ts` con 100% cobertura
  - Depends on: TASK-011
  - Verification: `npm run test alertas` — todos los casos pasan:
    - Saldo negativo en período N → alerta crítica con períodoAfectado correcto
    - Déficit inminente detectado 2 períodos antes
    - Flujo negativo pero saldo positivo → alerta media
    - Umbral configurado → alerta cuando saldo < umbral
    - Sin alertas cuando todo está en positivo → array vacío

- [ ] TASK-014: Implementar `src/lib/calculos/simulacion.ts` + tests
  - Input: Spec 006, contratos-internos.md — funciones `clonarProyeccionComoEscenario`, `redimensionarMontos`, `calcularEscenario`, `compararEscenarios`
  - Output: Funciones implementadas + `tests/lib/simulacion.test.ts` con 100% cobertura
  - Depends on: TASK-011
  - Verification: `npm run test simulacion` — todos los casos pasan:
    - Clon es una copia profunda (modificar clon no afecta base)
    - Redimensionar a más períodos rellena con 0
    - Redimensionar a menos períodos trunca correctamente
    - Comparación identifica correctamente escenario mejor/peor

---

## Phase 3: Zustand Stores

- [ ] TASK-015: Implementar `configStore` + persistencia IDB
  - Input: TASK-009, TASK-008, contratos-internos.md
  - Output: Store con `cargarConfig`, `actualizarConfig`, `cambiarUnidadPeriodo`, `resetear`
  - Depends on: TASK-009, TASK-010
  - Verification: Cambiar nombre de empresa persiste al recargar el navegador

- [ ] TASK-016: Implementar `ingresosStore` y `egresosStore` + persistencia IDB
  - Input: TASK-009, TASK-008
  - Output: Stores con CRUD de categorías y montos, persistencia automática
  - Depends on: TASK-015
  - Verification: Agregar categoría de ingreso → visible tras recargar navegador

- [ ] TASK-017: Implementar `financiamientoStore` + persistencia IDB
  - Input: TASK-012 (amortizacion.ts), TASK-009
  - Output: Store con CRUD de préstamos, `getTablaAmortizacion`, `getImpactoPorPeriodos`
  - Depends on: TASK-012, TASK-016
  - Verification: Agregar préstamo → tabla de amortización correcta en consola

- [ ] TASK-018: Implementar `flujoStore` (derivado)
  - Input: TASK-011 (flujo.ts), stores anteriores
  - Output: Store de solo lectura que recalcula `resultados` automáticamente al cambiar datos
  - Depends on: TASK-011, TASK-016, TASK-017
  - Verification: Cambiar un monto de ingreso → `flujoStore.resultados` actualizado en < 300ms

- [ ] TASK-019: Implementar `alertasStore` (derivado)
  - Input: TASK-013 (alertas.ts), TASK-018
  - Output: Store que recalcula alertas automáticamente cuando cambia flujoStore
  - Depends on: TASK-013, TASK-018
  - Verification: Ingresar egreso mayor que ingresos → alerta aparece automáticamente

- [ ] TASK-020: Implementar `simulacionStore` + persistencia IDB
  - Input: TASK-014 (simulacion.ts), TASK-009
  - Output: Store con crear, duplicar, eliminar, actualizar escenarios y comparación
  - Depends on: TASK-014, TASK-018
  - Verification: Crear escenario → modificar ingreso → flujo del escenario se actualiza sin tocar la base

---

## Phase 4: UI — Módulos

- [ ] TASK-021: Layout principal + navegación lateral
  - Input: Lista de 8 módulos del plan
  - Output: Shell de la app con sidebar navegable, área de contenido, responsive con Tailwind
  - Depends on: TASK-015
  - Verification: Navegar entre secciones sin errores; activa el ítem correcto del sidebar

- [ ] TASK-022: Módulo de Configuración inicial
  - Input: Spec 001 — Historia 1 (configurar proyección), configStore
  - Output: Formulario con nombre empresa, moneda, unidad período, nº períodos, saldo inicial, logo opcional
  - Depends on: TASK-015, TASK-021
  - Verification:
    - Validación Zod bloquea envío con períodos < 1
    - Cambiar unidad con datos existentes muestra modal de confirmación
    - Logo subido aparece en preview
    - Datos persisten al recargar

- [ ] TASK-023: Módulo de Ingresos
  - Input: Spec 001 — Historias 2 y 5, ingresosStore
  - Output: Tabla editable de categorías de ingreso con un campo por período
  - Depends on: TASK-016, TASK-021
  - Verification:
    - Agregar categoría aparece en la tabla inmediatamente
    - Valor negativo es rechazado con error inline
    - Total de ingresos por período se actualiza al escribir
    - Datos persisten al recargar

- [ ] TASK-024: Módulo de Egresos
  - Input: Spec 001 — Historia 3, egresosStore
  - Output: Tabla editable de categorías de egreso con selector de tipo
  - Depends on: TASK-016, TASK-021
  - Verification: Igual que TASK-023 pero para egresos

- [ ] TASK-025: Módulo de Financiamiento
  - Input: Spec 005, financiamientoStore
  - Output: Formulario de registro de préstamos + tabla de amortización expandible por préstamo
  - Depends on: TASK-017, TASK-021
  - Verification:
    - Cuota calculada coincide con calculadora financiera externa (BCP, BBVA)
    - Advertencia visible cuando cuotas exceden el horizonte
    - Eliminar préstamo actualiza el flujo inmediatamente

- [ ] TASK-026: Módulo de Flujo de Caja (tabla)
  - Input: Spec 004, flujoStore
  - Output: Tabla de resultados con columnas: período, ingresos, egresos, financiamiento, flujo neto, saldo acumulado
  - Depends on: TASK-018, TASK-021
  - Verification:
    - Celdas de flujo neto negativo resaltadas en rojo
    - Celdas de saldo acumulado negativo resaltadas en rojo
    - Tabla se actualiza en < 300ms al cambiar cualquier dato

- [ ] TASK-027: Módulo de Flujo de Caja (gráficos)
  - Input: Spec 008 — Historia 4, flujoStore, Recharts
  - Output: Gráfico de línea (saldo acumulado) + gráfico de barras (flujo neto) debajo de la tabla
  - Depends on: TASK-026
  - Verification:
    - Área bajo cero sombreada en rojo en el gráfico de línea
    - Gráficos se actualizan reactivamente con los datos

- [ ] TASK-028: Módulo de Alertas
  - Input: Spec 007, alertasStore
  - Output: Panel lateral o sección dedicada con lista de alertas por severidad + badge de count en sidebar
  - Depends on: TASK-019, TASK-021
  - Verification:
    - Ingresar déficit → alerta crítica aparece con período y monto correcto
    - Corregir déficit → alerta desaparece
    - Sin alertas → mensaje "Liquidez saludable" en verde
    - Badge en sidebar muestra el número de alertas activas

- [ ] TASK-029: Módulo de Simulación — gestión de escenarios
  - Input: Spec 006 — Historias 1, 2 y 3, simulacionStore
  - Output: Lista de escenarios con crear, duplicar, eliminar; formulario de edición de variables del escenario activo
  - Depends on: TASK-020, TASK-021
  - Verification:
    - Crear escenario → tiene los mismos datos que la base
    - Modificar ingreso en escenario → base sin cambios
    - Máximo 10 escenarios: botón crear deshabilitado al llegar al límite

- [ ] TASK-030: Módulo de Simulación — vista comparativa
  - Input: Spec 006 — Historia 4, simulacionStore
  - Output: Tabla y gráfico comparando saldo final de base vs. todos los escenarios
  - Depends on: TASK-029, TASK-027
  - Verification:
    - Escenario con mejor saldo resaltado en verde
    - Escenario con peor saldo resaltado en rojo
    - Seleccionar período específico muestra saldo en ese punto

- [ ] TASK-031: Módulo de Reportes — resumen ejecutivo + tabla
  - Input: Spec 008 — Historias 1 y 5, flujoStore, alertasStore
  - Output: Vista de reporte con resumen ejecutivo (6 indicadores) + tabla de flujo completa
  - Depends on: TASK-026, TASK-028
  - Verification:
    - Indicadores calculados correctamente (saldo inicial, final, mínimo, totales)
    - Períodos con saldo negativo resaltados en la tabla del reporte

- [ ] TASK-032: Exportación PDF
  - Input: Spec 008 — Historia 2, jsPDF + jspdf-autotable
  - Output: Botón "Exportar PDF" que descarga archivo con tabla, gráfico y marca Flujosys
  - Depends on: TASK-031
  - Verification:
    - Nombre del archivo: `FlujoCaja_[Empresa]_[Fecha].pdf`
    - PDF contiene: logo empresa (si existe), nombre empresa, tabla de flujo, gráfico de saldo, alertas activas, marca Flujosys en footer
    - Tabla se pagina correctamente para > 24 períodos
    - Funciona sin conexión a internet

- [ ] TASK-033: Exportación Excel
  - Input: Spec 008 — Historia 3, SheetJS/xlsx
  - Output: Botón "Exportar Excel" que descarga .xlsx con hojas separadas
  - Depends on: TASK-031
  - Verification:
    - Nombre del archivo: `FlujoCaja_[Empresa]_[Fecha].xlsx`
    - Hojas: "Flujo de Caja", "Ingresos", "Egresos", "Préstamos" + una hoja por escenario
    - Valores numéricos en Excel son números, no texto
    - Funciona sin conexión a internet

---

## Phase 5: QA, Pulido y Deploy

- [ ] TASK-034: Tests de integración de stores
  - Input: Todos los stores implementados
  - Output: Tests que simulan flujo completo: configurar → ingresar datos → verificar flujo → verificar alertas
  - Depends on: TASK-015 al TASK-020
  - Verification: `npm run test` — cobertura global ≥ 80%, cobertura en `src/lib/` = 100%

- [ ] TASK-035: Validación de precisión financiera
  - Input: TASK-011, TASK-012
  - Output: Tests con valores reales verificados contra calculadora financiera externa
  - Depends on: TASK-034
  - Verification:
    - Cuota sistema francés con 3 decimales de precisión vs. referencia externa
    - Saldo acumulado de 120 períodos sin drift de punto flotante

- [ ] TASK-036: Revisión de responsive y UX
  - Input: Todos los módulos UI
  - Output: App usable en pantallas de 1024px, 1280px y 1440px de ancho
  - Depends on: TASK-021 al TASK-033
  - Verification: Ningún elemento desbordado o ilegible en las 3 resoluciones

- [ ] TASK-037: Verificación de persistencia completa
  - Input: App completa
  - Output: Todos los datos sobreviven al cierre del navegador
  - Depends on: TASK-036
  - Verification: Ingresar set completo de datos → cerrar navegador → abrir → todos los datos intactos

- [ ] TASK-038: Deploy final a Vercel + verificación en producción
  - Input: Repositorio GitHub en rama `main`
  - Output: URL de producción en Vercel funcionando correctamente
  - Depends on: TASK-037
  - Verification:
    - `npm run build` sin errores ni warnings
    - URL de Vercel carga la app
    - Exportación PDF/Excel funciona en producción
    - Sin errores en consola del navegador en producción
