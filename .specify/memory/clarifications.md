# Clarifications — Flujosys

## Clarification 1: Cambio de unidad de período con datos existentes

**Situación:** El usuario configura una proyección (ej: 12 meses), ingresa datos, y luego
decide cambiar la unidad de tiempo (ej: a semanas).

**Decisión:** Opción C — borrar datos y empezar limpio, con confirmación explícita del usuario.

**Motivo:** Cambiar la unidad altera el significado financiero de cada período. Redistribuir
proporcionalmente generaría errores silenciosos en categorías de pago puntual (tributos,
cuotas, pagos únicos). La claridad es preferible a la automatización incorrecta.

**Impacto en implementación:**
- Al seleccionar una nueva unidad de período, mostrar un modal de confirmación:
  "Cambiar la unidad borrará todos los datos ingresados. ¿Deseas continuar?"
- Si el usuario confirma, limpiar IndexedDB y reiniciar la estructura de períodos.
- Si cancela, revertir el selector a la unidad anterior sin cambios.
- La configuración de unidad de período se bloquea fácilmente una vez que hay datos,
  para desincentivar cambios accidentales.

---

## Clarification 2: Horizonte de períodos en escenarios

**Situación:** Al crear un escenario de simulación, ¿el usuario puede definir un número
de períodos diferente al de la proyección base?

**Decisión:** Sí — cada escenario puede tener su propio horizonte de proyección
independiente del de la base.

**Motivo:** Permite simular hipótesis como "¿qué pasa si extiendo la proyección 6 meses
más?" o "¿cómo se ve el flujo si reduzco el horizonte a 6 meses?" sin alterar la base.

**Impacto en implementación:**
- Al crear un escenario, el usuario puede modificar el número de períodos (hereda el de
  la base por defecto, pero es editable).
- La unidad de período del escenario es siempre la misma que la de la base (no se puede
  cambiar por escenario — solo los montos y el número de períodos).
- La vista comparativa entre escenarios y base usa el horizonte más largo como referencia
  y completa con 0 los períodos que el escenario más corto no cubre.
- El número mínimo de períodos por escenario es 1; el máximo es 120.

---

## Clarification 3: Marca y logo en exportación PDF

**Situación:** ¿Qué identidad visual debe tener el PDF exportado?

**Decisión:** El PDF siempre incluye la marca "Flujosys" en el encabezado. El usuario
puede subir opcionalmente el logo de su propia empresa para que aparezca junto al nombre
de la empresa en el reporte.

**Impacto en implementación:**
- Encabezado del PDF: [Logo empresa — opcional] | [Nombre empresa] | Generado por Flujosys
- El logo se sube en la configuración inicial (módulo 001), se almacena en IndexedDB
  como base64, y se incluye en el PDF via jsPDF.
- Formatos de logo aceptados: PNG, JPG. Tamaño máximo: 500KB.
- Si no se sube logo, el espacio del logo se omite — no se deja en blanco.
- La marca "Flujosys" aparece siempre en el pie de página del PDF con el texto:
  "Generado con Flujosys — Sistema de Gestión de Flujo de Caja".
