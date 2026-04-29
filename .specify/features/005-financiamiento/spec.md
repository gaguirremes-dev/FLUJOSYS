# Spec — Financiamiento

**Feature ID:** 005
**Módulo:** 05-financiamiento
**Estado:** Aprobado

## Resumen

El módulo de financiamiento permite registrar préstamos obtenidos por la empresa y calcular
automáticamente su impacto en el flujo de caja: el desembolso del préstamo aumenta la caja
en el período en que se recibe, y las cuotas la reducen en los períodos siguientes.

Este módulo es crítico para MYPES que operan con crédito bancario o financiamiento externo,
ya que permite visualizar cómo la deuda afecta la liquidez a lo largo del tiempo.

## Contexto de Usuario

**Usuario principal:** Empresario MYPE, contador.
**Flujo actual:** Registra el préstamo manualmente en una celda y calcula las cuotas
en otra hoja, sin integración con el flujo de caja general.

## Fórmulas del Sistema

```
Cuota fija (sistema francés) = P × [i(1+i)^n] / [(1+i)^n − 1]

Donde:
  P = monto del préstamo
  i = tasa de interés por período
  n = número de cuotas

Conversión de tasa anual a tasa por período:
  i_período = (1 + i_anual)^(1/períodos_por_año) − 1

Impacto en flujo del período K:
  + Monto del préstamo  → solo en el período de desembolso
  − Cuota(K)            → en cada período que corresponda una cuota
```

## User Stories

### Historia 1: Registrar un préstamo
**Como** usuario,
**quiero** ingresar los datos de un préstamo (monto, tasa de interés, número de cuotas,
período de inicio),
**para** que el sistema calcule automáticamente las cuotas y su impacto en el flujo.

**Criterios de aceptación:**
- WHEN el usuario ingresa monto, tasa de interés, número de cuotas y período de inicio,
  THEN el sistema calcula la cuota fija usando el sistema francés (amortización constante).
- WHEN el período de inicio es el período N, THEN el desembolso aparece como ingreso en N
  y las cuotas como egresos desde N+1 en adelante.
- WHEN el número de cuotas excede los períodos restantes de la proyección, THEN el sistema
  advierte que algunas cuotas quedan fuera del horizonte proyectado.
- WHERE la tasa de interés sea 0, THEN el sistema acepta el préstamo sin interés y divide
  el monto en cuotas iguales.

### Historia 2: Ver tabla de amortización
**Como** usuario,
**quiero** ver la tabla de amortización del préstamo (cuota, interés, amortización, saldo),
**para** entender cómo se distribuye el pago de la deuda en el tiempo.

**Criterios de aceptación:**
- WHEN el usuario registra un préstamo, THEN el sistema muestra la tabla completa de
  amortización con: período, cuota total, interés, capital amortizado y saldo pendiente.
- WHEN el usuario tiene múltiples préstamos, THEN puede ver la tabla individual de cada uno.

### Historia 3: Múltiples préstamos
**Como** usuario,
**quiero** registrar más de un préstamo activo simultáneamente,
**para** reflejar la realidad de empresas con varias obligaciones financieras.

**Criterios de aceptación:**
- WHEN el usuario agrega un segundo préstamo, THEN sus cuotas se suman a las del primero
  en los períodos que coincidan.
- WHEN el usuario elimina un préstamo, THEN su impacto desaparece del flujo de caja
  de todos los períodos afectados de inmediato.

### Historia 4: Impacto visible en el flujo de caja
**Como** usuario,
**quiero** ver cómo el préstamo afecta el flujo neto y el saldo acumulado,
**para** evaluar si el financiamiento mejora o compromete mi liquidez.

**Criterios de aceptación:**
- WHEN se registra un préstamo, THEN el flujo de caja del módulo 004 se actualiza
  automáticamente reflejando el desembolso y las cuotas.
- WHEN el pago de cuotas genera un flujo neto negativo en algún período, THEN ese período
  se resalta en la tabla de flujo.

## Requerimientos Funcionales

1. [RF-001] El sistema debe permitir registrar préstamos con: nombre, monto, tasa de interés anual, número de cuotas y período de inicio.
2. [RF-002] El sistema debe calcular la cuota fija usando el sistema francés de amortización.
3. [RF-003] El sistema debe convertir la tasa anual a la tasa del período seleccionado usando fórmula compuesta.
4. [RF-004] El sistema debe registrar el desembolso como entrada de efectivo en el período de inicio.
5. [RF-005] El sistema debe distribuir las cuotas como salidas de efectivo en los períodos correspondientes.
6. [RF-006] El sistema debe mostrar la tabla de amortización completa por cada préstamo.
7. [RF-007] El sistema debe permitir registrar múltiples préstamos y acumular su impacto.
8. [RF-008] El sistema debe permitir eliminar un préstamo con actualización inmediata del flujo.
9. [RF-009] El sistema debe advertir cuando las cuotas exceden el horizonte de proyección.

## Requerimientos No Funcionales

- **Precisión:** Cálculo de cuotas con 2 decimales. Sin errores de redondeo acumulados en la tabla de amortización.
- **Conversión de tasas:** Usar fórmula compuesta: `i_período = (1 + i_anual)^(1/n) − 1`.
- **Persistencia:** Todos los préstamos persisten en IndexedDB.

## Fuera de Scope (Fase 1)

- Sistema de amortización alemán (cuota de capital fija) o americano (bullet).
- Préstamos en moneda extranjera con tipo de cambio variable.
- Cálculo de TEA/TCEA automático desde cuota.
- Integración con entidades bancarias.
- Préstamos otorgados por la empresa (cuentas por cobrar financieras).

## Open Questions

- Ninguna pendiente.
