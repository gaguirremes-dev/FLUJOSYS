# Spec — Ingreso de Datos Financieros

**Feature ID:** 001
**Módulo:** 01-ingreso-datos
**Estado:** Aprobado

## Resumen

El módulo de ingreso de datos es la puerta de entrada al sistema. Aquí el usuario registra
todos los elementos que alimentan el flujo de caja: ingresos proyectados, egresos proyectados,
saldo inicial y datos de financiamiento. Sin datos correctamente ingresados, el motor de
cálculo no puede operar.

La prioridad es claridad y facilidad de uso para personas sin experiencia técnica, con
validación inmediata que guíe al usuario a ingresar datos financieramente coherentes.

## Contexto de Usuario

**Usuario principal:** Empresario MYPE, emprendedor, estudiante de contabilidad.
**Otros usuarios:** Contador, consultor financiero.
**Flujo actual:** Llena filas en una hoja de cálculo sin estructura definida, propenso a
errores de tipeo y fórmulas rotas.

## User Stories

### Historia 1: Configurar la proyección
**Como** usuario,
**quiero** definir el nombre de mi empresa, moneda, unidad de período y número de períodos
antes de ingresar datos,
**para** que toda la proyección esté contextualizada a mi realidad.

**Criterios de aceptación:**
- WHEN el usuario completa la configuración inicial, THEN el sistema genera la estructura
  de períodos y habilita los formularios de ingreso.
- WHEN la moneda seleccionada es PEN (sol peruano), USD u otra, THEN todos los valores
  del sistema se muestran con el símbolo correspondiente.
- WHERE el nombre de empresa esté vacío, THEN se usa "Mi Empresa" como valor por defecto.

### Historia 2: Registrar ingresos proyectados
**Como** usuario,
**quiero** ingresar los ingresos esperados por categoría para cada período,
**para** reflejar con detalle de dónde proviene el dinero.

**Criterios de aceptación:**
- WHEN el usuario agrega una categoría de ingreso (ej: "Ventas al contado"), THEN puede
  asignarle un monto para cada período de la proyección.
- WHEN el monto de un ingreso se deja vacío, THEN el sistema lo trata como 0.
- WHEN el usuario ingresa un valor negativo en un ingreso, THEN el sistema lo rechaza con
  mensaje de error.
- WHEN se modifica cualquier monto, THEN el total de ingresos del período se actualiza
  inmediatamente.

### Historia 3: Registrar egresos proyectados
**Como** usuario,
**quiero** ingresar los egresos por categoría (compras, planilla, servicios, tributos) para
cada período,
**para** tener visibilidad completa de mis salidas de dinero.

**Criterios de aceptación:**
- WHEN el usuario agrega una categoría de egreso (ej: "Planilla"), THEN puede asignarle
  un monto para cada período.
- WHEN el monto de un egreso se deja vacío, THEN el sistema lo trata como 0.
- WHEN el usuario ingresa un valor negativo en un egreso, THEN el sistema lo rechaza con
  mensaje de error.
- WHEN se modifica cualquier egreso, THEN el total de egresos del período se actualiza
  inmediatamente.

### Historia 4: Ingresar saldo inicial
**Como** usuario,
**quiero** ingresar el saldo de caja con el que empieza la proyección,
**para** que el sistema calcule correctamente el saldo acumulado desde el primer período.

**Criterios de aceptación:**
- WHEN el usuario ingresa el saldo inicial, THEN el módulo de flujo de caja lo usa como
  punto de partida del saldo acumulado.
- WHEN el saldo inicial es negativo, THEN el sistema lo acepta sin error.
- WHEN el saldo inicial no está ingresado, THEN el sistema asume 0.

### Historia 5: Persistencia automática
**Como** usuario,
**quiero** que mis datos se guarden automáticamente mientras los ingreso,
**para** no perder información si cierro el navegador accidentalmente.

**Criterios de aceptación:**
- WHEN el usuario ingresa o modifica cualquier dato, THEN el sistema lo persiste en
  IndexedDB en menos de 1 segundo sin acción explícita del usuario.
- WHEN el usuario cierra y vuelve a abrir el navegador, THEN todos los datos ingresados
  siguen disponibles exactamente como los dejó.
- WHEN el usuario quiere limpiar todos los datos, THEN existe una opción explícita de
  "Nueva proyección" con confirmación antes de borrar.

## Requerimientos Funcionales

1. [RF-001] El sistema debe permitir configurar: nombre de empresa, moneda, unidad de período y número de períodos.
2. [RF-002] El sistema debe permitir agregar categorías de ingreso con nombre personalizado.
3. [RF-003] El sistema debe permitir agregar categorías de egreso con nombre personalizado.
4. [RF-004] Cada categoría debe tener un campo de monto por período.
5. [RF-005] El sistema debe rechazar valores negativos en ingresos y egresos, mostrando mensaje de error.
6. [RF-006] El sistema debe tratar campos vacíos como valor 0 en los cálculos.
7. [RF-007] El sistema debe calcular y mostrar el total de ingresos y egresos por período en tiempo real.
8. [RF-008] El sistema debe persistir todos los datos automáticamente en IndexedDB.
9. [RF-009] El sistema debe ofrecer una opción de "Nueva proyección" que limpia todos los datos previo a confirmación.
10. [RF-010] El sistema debe mostrar el símbolo de moneda seleccionado en todos los campos numéricos.

## Requerimientos No Funcionales

- **Persistencia:** Guardado automático en < 1 segundo tras cada cambio.
- **Validación:** Errores mostrados inline junto al campo, no en alertas emergentes.
- **Accesibilidad:** Labels descriptivos en todos los inputs. Tab navigation funcional.
- **Offline:** Funciona completamente sin conexión.

## Fuera de Scope (Fase 1)

- Importación de datos desde Excel o CSV.
- Plantillas predefinidas por industria.
- Múltiples proyecciones simultáneas.
- Historial de cambios por campo.
- Datos compartidos entre usuarios (Fase 2).

## Open Questions

- Ninguna pendiente.
