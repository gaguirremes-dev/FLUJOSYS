# Spec — Reportes y Exportación

**Feature ID:** 008
**Módulo:** 08-reportes
**Estado:** Aprobado

## Resumen

El módulo de reportes genera vistas estructuradas de los resultados del sistema y permite
exportarlas en PDF y Excel. Es la salida formal de Flujosys: el documento que el empresario
presenta a su banco, contador o socio, o que el estudiante entrega como evidencia de análisis.

Los reportes incluyen la proyección base, el historial de alertas y los escenarios simulados,
con gráficos de saldo acumulado y flujo neto por período.

## Contexto de Usuario

**Usuario principal:** Empresario MYPE, contador, estudiante de contabilidad.
**Flujo actual:** Imprime o exporta su hoja de cálculo sin formato, sin gráficos y con
fórmulas visibles que dan aspecto poco profesional.

## Tipos de Reporte

| Reporte | Contenido | Formatos |
|---------|-----------|---------|
| Flujo de caja proyectado | Tabla completa de períodos con ingresos, egresos, flujo neto y saldo acumulado | PDF, Excel |
| Saldo acumulado | Gráfico de línea del saldo a lo largo del tiempo | PDF |
| Escenarios comparados | Tabla y gráfico comparativo de hasta 3 escenarios vs. base | PDF, Excel |
| Amortización de préstamos | Tabla de amortización por cada préstamo registrado | PDF, Excel |
| Resumen ejecutivo | Vista condensada: indicadores clave, alertas activas, saldo final | PDF |

## User Stories

### Historia 1: Ver el reporte de flujo proyectado
**Como** usuario,
**quiero** ver una tabla organizada del flujo de caja completo con totales por período,
**para** tener una vista clara y profesional de toda la proyección.

**Criterios de aceptación:**
- WHEN el usuario accede al módulo de reportes, THEN el sistema muestra la tabla de flujo
  de caja con columnas: período, ingresos totales, egresos totales, financiamiento neto,
  flujo neto y saldo acumulado.
- WHEN hay períodos con saldo negativo, THEN se resaltan en la tabla del reporte.
- WHEN hay alertas activas, THEN el reporte las lista en una sección separada.

### Historia 2: Exportar a PDF
**Como** usuario,
**quiero** exportar el reporte de flujo de caja a PDF con el nombre de mi empresa,
**para** compartirlo o presentarlo de forma profesional.

**Criterios de aceptación:**
- WHEN el usuario hace clic en "Exportar PDF", THEN el sistema genera y descarga un archivo
  PDF con: nombre de empresa, fecha de generación, tabla de flujo completa y gráfico de
  saldo acumulado.
- WHEN el PDF se genera, THEN el nombre del archivo sigue el formato:
  `FlujoCaja_[NombreEmpresa]_[Fecha].pdf`.
- WHEN la generación tarda más de 3 segundos, THEN el sistema muestra un indicador de carga.
- WHERE el número de períodos es mayor a 24, THEN la tabla se pagina automáticamente en el PDF.

### Historia 3: Exportar a Excel
**Como** usuario,
**quiero** exportar el flujo de caja a Excel,
**para** seguir trabajando con los datos en una hoja de cálculo si lo necesito.

**Criterios de aceptación:**
- WHEN el usuario hace clic en "Exportar Excel", THEN el sistema genera un archivo .xlsx
  con los datos organizados en hojas: "Flujo de Caja", "Ingresos", "Egresos", "Préstamos".
- WHEN el archivo se descarga, THEN el nombre sigue el formato:
  `FlujoCaja_[NombreEmpresa]_[Fecha].xlsx`.
- WHEN hay escenarios guardados, THEN cada escenario se exporta en su propia hoja.

### Historia 4: Ver gráficos de saldo y flujo
**Como** usuario,
**quiero** ver un gráfico de línea del saldo acumulado y un gráfico de barras del flujo
neto por período,
**para** entender visualmente la tendencia financiera de mi proyección.

**Criterios de aceptación:**
- WHEN el usuario accede al reporte, THEN el sistema muestra un gráfico de línea del
  saldo acumulado por período.
- WHEN el saldo cruza el eje cero (pasa a negativo), THEN el área bajo cero se sombrea en rojo.
- WHEN hay escenarios activos, THEN el usuario puede activar la visualización de líneas
  adicionales por escenario en el mismo gráfico.

### Historia 5: Resumen ejecutivo
**Como** usuario,
**quiero** ver un resumen con los indicadores más importantes de la proyección,
**para** tener un diagnóstico rápido sin leer toda la tabla.

**Criterios de aceptación:**
- WHEN el usuario accede al resumen ejecutivo, THEN el sistema muestra:
  - Saldo inicial
  - Saldo final proyectado
  - Período con menor saldo (y su valor)
  - Total de ingresos del horizonte
  - Total de egresos del horizonte
  - Número de períodos con saldo negativo
  - Alertas activas resumidas

## Requerimientos Funcionales

1. [RF-001] El sistema debe mostrar la tabla completa de flujo de caja proyectado con todos sus componentes.
2. [RF-002] El sistema debe mostrar un gráfico de línea del saldo acumulado por período.
3. [RF-003] El sistema debe mostrar un gráfico de barras del flujo neto por período.
4. [RF-004] El sistema debe permitir exportar el flujo a PDF con nombre de empresa y fecha.
5. [RF-005] El sistema debe permitir exportar el flujo a Excel con datos en hojas separadas.
6. [RF-006] El sistema debe incluir los escenarios guardados como hojas adicionales en el Excel.
7. [RF-007] El sistema debe mostrar un resumen ejecutivo con los indicadores financieros clave.
8. [RF-008] El sistema debe incluir las alertas activas en el reporte PDF.
9. [RF-009] La exportación PDF debe ocurrir completamente en el cliente (sin servidor).
10. [RF-010] La exportación Excel debe ocurrir completamente en el cliente (sin servidor).

## Requerimientos No Funcionales

- **Performance:** Generación de PDF en < 5 segundos para proyecciones de hasta 120 períodos.
- **Formato:** PDF con aspecto profesional — sin elementos de UI del navegador visibles.
- **Client-side:** jsPDF para PDF, SheetJS/xlsx para Excel. Sin dependencia de backend.
- **Offline:** La exportación funciona sin conexión a internet.

## Fuera de Scope (Fase 1)

- Envío del reporte por email directamente desde la app.
- Reporte de flujo de caja histórico (datos reales vs. proyectados).
- Plantillas de reporte personalizables.
- Reportes en formatos distintos a PDF y Excel (Word, CSV).
- Dashboard analítico con métricas avanzadas (EBITDA, ROI, etc.).

## Open Questions

- Ninguna pendiente.
