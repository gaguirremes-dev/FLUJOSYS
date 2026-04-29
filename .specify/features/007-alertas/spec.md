# Spec — Alertas Financieras Automáticas

**Feature ID:** 007
**Módulo:** 07-alertas
**Estado:** Aprobado

## Resumen

El módulo de alertas monitorea continuamente los resultados del motor de flujo de caja y
genera advertencias automáticas cuando detecta situaciones de riesgo financiero: déficits
de liquidez, saldos negativos proyectados, o períodos críticos donde los egresos superan
ampliamente a los ingresos.

Las alertas son proactivas — aparecen sin que el usuario las solicite — y van acompañadas
de recomendaciones concretas de acción.

## Contexto de Usuario

**Usuario principal:** Empresario MYPE, administrador financiero.
**Flujo actual:** El usuario detecta los problemas visualmente al revisar su hoja de cálculo,
a veces demasiado tarde para tomar acción correctiva.

## Tipos de Alerta

| Tipo | Condición | Severidad |
|------|-----------|-----------|
| Saldo negativo | Saldo acumulado < 0 en cualquier período | Crítica |
| Déficit inminente | Saldo acumulado < 0 en los próximos 2 períodos | Alta |
| Flujo neto negativo | Flujo neto < 0 en un período (aunque saldo siga positivo) | Media |
| Saldo bajo | Saldo acumulado < umbral definido por el usuario | Media |
| Cuotas exceden proyección | Cuotas de préstamos más allá del horizonte proyectado | Informativa |

## User Stories

### Historia 1: Ver alertas automáticas al revisar el flujo
**Como** usuario,
**quiero** recibir alertas automáticas cuando el sistema detecte problemas de liquidez,
**para** actuar antes de que el problema ocurra.

**Criterios de aceptación:**
- WHEN el saldo acumulado cae por debajo de 0 en cualquier período, THEN el sistema
  muestra una alerta crítica indicando en qué período ocurre y el monto del déficit.
- WHEN el saldo acumulado estará en negativo dentro de los próximos 2 períodos, THEN
  el sistema muestra una alerta de déficit inminente.
- WHEN el flujo neto de un período es negativo pero el saldo sigue positivo, THEN el
  sistema muestra una alerta de nivel medio.
- WHEN no hay alertas activas, THEN el panel muestra un estado "Liquidez saludable" en verde.

### Historia 2: Configurar umbral de saldo mínimo
**Como** usuario,
**quiero** definir un saldo mínimo aceptable para mi empresa,
**para** recibir alerta cuando el saldo proyectado baje de ese nivel aunque siga positivo.

**Criterios de aceptación:**
- WHEN el usuario define un umbral mínimo (ej: S/ 5,000), THEN el sistema genera alerta
  media cuando el saldo acumulado de cualquier período cae por debajo de ese umbral.
- WHEN el usuario no define umbral, THEN el sistema solo alerta con saldo < 0.
- WHEN el usuario modifica el umbral, THEN las alertas se recalculan inmediatamente.

### Historia 3: Recomendaciones de acción
**Como** usuario,
**quiero** que cada alerta incluya una recomendación concreta,
**para** saber qué hacer ante el problema detectado.

**Criterios de aceptación:**
- WHEN se genera alerta de saldo negativo, THEN la recomendación sugiere: aumentar ingresos
  en períodos previos, reducir egresos, o evaluar financiamiento.
- WHEN se genera alerta de déficit inminente, THEN la recomendación indica los períodos
  específicos donde actuar.
- WHEN se genera alerta de flujo negativo, THEN la recomendación señala qué categoría
  de egreso tiene mayor peso en ese período.

### Historia 4: Alertas se actualizan con los datos
**Como** usuario,
**quiero** que las alertas cambien en tiempo real cuando modifico mis datos,
**para** ver inmediatamente si una acción correctiva resuelve el problema.

**Criterios de aceptación:**
- WHEN el usuario modifica un ingreso, egreso o préstamo, THEN las alertas se
  recalculan en menos de 300ms.
- WHEN una corrección del usuario resuelve el déficit, THEN la alerta desaparece
  automáticamente y el estado vuelve a "Liquidez saludable".

## Requerimientos Funcionales

1. [RF-001] El sistema debe detectar automáticamente saldos acumulados negativos y generar alerta crítica.
2. [RF-002] El sistema debe detectar déficits inminentes (saldo negativo en los próximos 2 períodos) y generar alerta alta.
3. [RF-003] El sistema debe detectar flujo neto negativo por período y generar alerta media.
4. [RF-004] El sistema debe permitir al usuario configurar un umbral de saldo mínimo aceptable.
5. [RF-005] Cada alerta debe incluir: tipo, severidad, período(s) afectado(s), monto del problema y recomendación de acción.
6. [RF-006] Las alertas deben recalcularse en tiempo real cuando cambian los datos (< 300ms).
7. [RF-007] Cuando no hay alertas, el sistema debe mostrar un estado positivo visible ("Liquidez saludable").
8. [RF-008] El sistema debe diferenciar visualmente la severidad de cada alerta (colores: rojo crítica, naranja alta, amarillo media, azul informativa).

## Requerimientos No Funcionales

- **Performance:** Evaluación de todas las alertas en < 300ms tras cualquier cambio de datos.
- **Claridad:** El mensaje de alerta debe ser comprensible para un usuario sin formación financiera avanzada.
- **No invasivo:** Las alertas se muestran en un panel dedicado, no como popups que interrumpen el flujo de trabajo.

## Fuera de Scope (Fase 1)

- Notificaciones push o por email (Fase 2).
- Alertas programadas por fecha real (ej: "el día 15 del mes").
- Alertas configurables por el usuario más allá del umbral de saldo mínimo.
- Historial de alertas pasadas.

## Open Questions

- Ninguna pendiente.
