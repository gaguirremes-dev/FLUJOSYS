# Spec — Motor de Flujo de Caja

**Feature ID:** 004
**Módulo:** 04-flujo-caja
**Estado:** Aprobado

## Resumen

El motor de flujo de caja es el núcleo de Flujosys. Toma los ingresos, egresos y movimientos
de financiamiento registrados por el usuario para cada período y calcula el flujo neto y el
saldo acumulado a lo largo del tiempo proyectado.

Sin esta pieza, el resto del sistema no tiene sentido. Todos los demás módulos — simulación,
alertas, reportes — consumen los resultados que este motor produce. Su corrección es el
requisito más crítico del sistema.

## Contexto de Usuario

**Usuario principal:** Empresario MYPE, contador, administrador financiero.
**Flujo de trabajo actual:** Ingresa datos en una hoja de cálculo y calcula manualmente fila
por fila. Si cambia un dato, debe recalcular todo desde ese punto.

## Fórmulas del Sistema

```
Flujo neto (período N) = Ingresos(N) − Egresos(N) + Desembolsos de préstamo(N) − Cuotas de préstamo(N)

Saldo acumulado (período N) = Saldo inicial + Σ Flujo neto(1..N)
```

## User Stories

### Historia 1: Configurar el horizonte de proyección
**Como** usuario,
**quiero** definir la unidad de tiempo (días, semanas, meses, años) y el número de períodos,
**para** que el sistema genere una tabla de proyección ajustada a mi realidad financiera.

**Criterios de aceptación:**
- WHEN el usuario selecciona una unidad de tiempo y un número de períodos, THEN el sistema
  genera exactamente ese número de columnas/filas de proyección.
- WHEN el usuario cambia la unidad de tiempo, THEN la estructura de períodos se recalcula
  y los datos existentes se conservan mapeados a los nuevos períodos.
- WHERE el número de períodos sea menor a 1 o no sea entero, THEN el sistema bloquea
  el ingreso y muestra un mensaje de error.

### Historia 2: Ingresar saldo inicial
**Como** usuario,
**quiero** ingresar un único saldo inicial de caja,
**para** que el sistema tome ese valor como punto de partida del saldo acumulado.

**Criterios de aceptación:**
- WHEN el usuario ingresa el saldo inicial, THEN el saldo acumulado del período 1 parte
  desde ese valor.
- WHEN el saldo inicial es 0, THEN el sistema lo acepta y opera normalmente.
- WHERE el saldo inicial sea negativo, THEN el sistema lo acepta (empresa puede empezar
  con deuda) y lo refleja en el saldo acumulado.
- WHEN el usuario modifica el saldo inicial, THEN todos los saldos acumulados se recalculan
  automáticamente de inmediato.

### Historia 3: Ver el flujo neto y saldo acumulado por período
**Como** usuario,
**quiero** ver una tabla con el flujo neto y el saldo acumulado para cada período,
**para** identificar en qué momentos tengo superávit o déficit de liquidez.

**Criterios de aceptación:**
- WHEN los datos de ingresos, egresos y financiamiento están ingresados, THEN el sistema
  muestra una tabla con: período, ingresos totales, egresos totales, movimientos de
  financiamiento, flujo neto y saldo acumulado.
- WHEN el flujo neto de un período es negativo, THEN esa celda se resalta visualmente en rojo.
- WHEN el saldo acumulado cae por debajo de cero en algún período, THEN ese valor se
  resalta visualmente y se dispara el módulo de alertas.
- WHEN cualquier dato de entrada cambia, THEN la tabla se recalcula en tiempo real sin
  acción adicional del usuario.

### Historia 4: Recalculo automático reactivo
**Como** usuario,
**quiero** que cualquier cambio en mis datos se refleje inmediatamente en el flujo,
**para** no tener que hacer clic en "Calcular" cada vez que ajusto un valor.

**Criterios de aceptación:**
- WHEN el usuario modifica cualquier ingreso, egreso o cuota de financiamiento, THEN el
  flujo neto y saldo acumulado de ese período y todos los siguientes se actualizan en
  menos de 300ms.
- WHEN el usuario está en el módulo de simulación y modifica variables, THEN los cambios
  se reflejan en la tabla sin alterar los datos reales registrados.

## Requerimientos Funcionales

1. [RF-001] El sistema debe permitir seleccionar la unidad de período: días, semanas, meses o años.
2. [RF-002] El sistema debe permitir definir el número de períodos a proyectar (mínimo 1, máximo 120).
3. [RF-003] El sistema debe aceptar un único saldo inicial de caja (positivo, cero o negativo).
4. [RF-004] El sistema debe calcular el flujo neto por período: Ingresos − Egresos + Desembolsos − Cuotas.
5. [RF-005] El sistema debe calcular el saldo acumulado de forma encadenada período a período.
6. [RF-006] Cuando cualquier dato de entrada cambia, el sistema debe recalcular de forma inmediata.
7. [RF-007] El sistema debe resaltar visualmente períodos con flujo neto negativo.
8. [RF-008] El sistema debe resaltar visualmente períodos donde el saldo acumulado sea negativo.
9. [RF-009] Los resultados del motor deben ser consumibles por los módulos de simulación, alertas y reportes.

## Requerimientos No Funcionales

- **Performance:** Recalculo completo en < 300ms para proyecciones de hasta 120 períodos.
- **Precisión:** Operaciones con 2 decimales máximo. Sin errores de punto flotante en
  acumulaciones (usar redondeo explícito a centavos).
- **Persistencia:** El saldo inicial y la configuración de períodos deben sobrevivir al
  cierre del navegador (IndexedDB).
- **Offline:** El motor debe funcionar sin conexión a internet.

## Fuera de Scope (Fase 1)

- Múltiples saldos iniciales por cuenta bancaria.
- Conversión entre monedas.
- Cálculo de impuestos automático.
- Sincronización con datos reales de bancos o ERPs.
- Histórico de versiones del flujo.
- Autenticación y datos por usuario (Fase 2).

## Open Questions

- [x] ~~Unidad de período~~ — configurable: días, semanas, meses, años.
- [x] ~~Saldo inicial~~ — único al inicio de la proyección.
- [x] ~~Financiamiento en el flujo~~ — sí, entra como desembolsos y cuotas en cada período.
