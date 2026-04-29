# Spec — Simulación de Escenarios

**Feature ID:** 006
**Módulo:** 06-simulacion
**Estado:** Aprobado

## Resumen

El módulo de simulación permite al usuario crear escenarios financieros alternativos
modificando ingresos, egresos, financiamiento u otras variables — sin afectar los datos
reales de la proyección base. Cada escenario es independiente, puede nombrarse y compararse
con otros, permitiendo evaluar situaciones como un aumento de ventas, un recorte de gastos
o la incorporación de un nuevo préstamo.

Es la herramienta de toma de decisiones estratégicas del sistema: el usuario "juega" con
los números para anticipar consecuencias antes de actuar.

## Contexto de Usuario

**Usuario principal:** Empresario MYPE, consultor financiero, contador.
**Flujo actual:** Hace copias manuales de la hoja de cálculo y modifica valores a mano,
perdiendo fácilmente el hilo de qué cambió en cada versión.

## Conceptos Clave

- **Proyección base:** Los datos reales ingresados en los módulos 001-005. Nunca se modifica desde simulación.
- **Escenario:** Copia de la proyección base con variables modificadas por el usuario. Tiene nombre propio.
- **Comparación:** Vista lado a lado de dos o más escenarios vs. la proyección base.

## User Stories

### Historia 1: Crear un escenario nuevo
**Como** usuario,
**quiero** crear un escenario a partir de mis datos reales y darle un nombre,
**para** poder experimentar con distintas hipótesis sin perder mis datos originales.

**Criterios de aceptación:**
- WHEN el usuario crea un escenario, THEN el sistema genera una copia exacta de todos
  los datos de la proyección base con un nombre editable (ej: "Escenario optimista").
- WHEN el usuario modifica cualquier valor dentro del escenario, THEN la proyección base
  permanece intacta.
- WHEN el usuario guarda el escenario, THEN queda persistido en IndexedDB con su nombre
  y todos sus valores modificados.
- WHERE el nombre del escenario esté vacío, THEN el sistema asigna "Escenario 1",
  "Escenario 2", etc. automáticamente.

### Historia 2: Modificar variables del escenario
**Como** usuario,
**quiero** ajustar ingresos, egresos, saldo inicial y datos de financiamiento dentro
del escenario,
**para** simular distintas hipótesis financieras con libertad total.

**Criterios de aceptación:**
- WHEN el usuario modifica cualquier ingreso, egreso o parámetro de financiamiento en
  el escenario, THEN el flujo neto y saldo acumulado del escenario se recalculan
  en tiempo real (< 300ms).
- WHEN el usuario cambia el saldo inicial dentro del escenario, THEN el saldo acumulado
  de todos los períodos del escenario se recalcula.
- WHEN el usuario agrega una categoría de ingreso o egreso solo en el escenario, THEN
  esa categoría no aparece en la proyección base.

### Historia 3: Gestionar múltiples escenarios
**Como** usuario,
**quiero** tener varios escenarios guardados (optimista, pesimista, neutro, etc.),
**para** poder alternar entre ellos y evaluar cada hipótesis sin recrearla.

**Criterios de aceptación:**
- WHEN el usuario tiene múltiples escenarios, THEN puede seleccionar cualquiera desde
  una lista y ver su flujo de caja de forma individual.
- WHEN el usuario elimina un escenario, THEN se solicita confirmación antes de borrar.
- WHEN el usuario duplica un escenario existente, THEN el sistema crea una copia con
  el nombre "[Original] — copia".
- El sistema soporta hasta 10 escenarios simultáneos.

### Historia 4: Comparar escenarios con la proyección base
**Como** usuario,
**quiero** ver una tabla comparativa entre la proyección base y uno o más escenarios,
**para** identificar de un vistazo cuál hipótesis genera mejor liquidez.

**Criterios de aceptación:**
- WHEN el usuario activa la vista comparativa, THEN el sistema muestra el saldo acumulado
  final de la proyección base y de cada escenario seleccionado en columnas paralelas.
- WHEN un escenario tiene mejor saldo final que la base, THEN se resalta en verde.
- WHEN un escenario tiene peor saldo final que la base, THEN se resalta en rojo.
- WHEN el usuario selecciona un período específico, THEN la comparación muestra el saldo
  acumulado en ese punto para todos los escenarios.

## Requerimientos Funcionales

1. [RF-001] El sistema debe permitir crear escenarios como copias de la proyección base.
2. [RF-002] Cada escenario debe tener un nombre editable.
3. [RF-003] El sistema debe permitir modificar cualquier variable financiera dentro de un escenario sin afectar la base.
4. [RF-004] El recalculo del flujo dentro del escenario debe ocurrir en tiempo real (< 300ms).
5. [RF-005] El sistema debe persistir todos los escenarios en IndexedDB.
6. [RF-006] El sistema debe permitir gestionar hasta 10 escenarios simultáneos.
7. [RF-007] El sistema debe permitir duplicar escenarios existentes.
8. [RF-008] El sistema debe permitir eliminar escenarios con confirmación previa.
9. [RF-009] El sistema debe ofrecer una vista comparativa de saldo acumulado entre escenarios y la base.
10. [RF-010] La vista comparativa debe resaltar visualmente cuál escenario resulta mejor o peor que la base.

## Requerimientos No Funcionales

- **Aislamiento de datos:** Ninguna modificación en un escenario puede alterar la proyección base ni otros escenarios.
- **Performance:** Recalculo en < 300ms para escenarios de hasta 120 períodos.
- **Persistencia:** Escenarios sobreviven al cierre del navegador.

## Fuera de Scope (Fase 1)

- Exportación individual de un escenario como PDF/Excel (cubierto en módulo 008 para la base).
- Compartir escenarios con otros usuarios (Fase 2).
- Escenarios con probabilidad asignada (análisis de Monte Carlo).
- Más de 10 escenarios simultáneos.

## Open Questions

- Ninguna pendiente.
