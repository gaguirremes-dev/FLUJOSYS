# Constitution — Flujosys

## Descripción del Sistema

Flujosys es un sistema web de proyección, gestión y simulación de flujo de caja orientado a
MYPES, emprendedores, contadores y estudiantes de contabilidad. Permite registrar ingresos,
egresos y financiamiento por períodos, calcular el flujo neto y saldo acumulado, simular
escenarios financieros en tiempo real y generar alertas ante déficits de liquidez.

El sistema reemplaza el uso de hojas de cálculo manuales propensas a errores, ofreciendo
proyecciones estructuradas, simulación interactiva y reportes exportables — todo desde el
navegador, sin instalación ni registro.

## Principios Fundamentales

- **Cero backend en Fase 1:** Toda la lógica de negocio vive en el frontend. No hay servidor,
  no hay base de datos remota. Los datos persisten en localStorage/IndexedDB. Esto garantiza
  funcionamiento offline y despliegue como sitio estático.
- **Corrección financiera ante todo:** Los cálculos de flujo, saldo acumulado e intereses deben
  ser exactos y verificables por tests. Ningún módulo de cálculo se considera completo sin su
  test correspondiente.
- **Recalculo reactivo:** Cualquier cambio en los datos debe reflejarse inmediatamente en todos
  los módulos que dependen de él — sin botón "Calcular", sin recarga de página.
- **Simplicidad para el usuario no técnico:** La interfaz debe ser usable por alguien sin
  conocimientos de sistemas. Términos financieros claros, flujos lineales, sin jerga técnica.
- **Extensible a Fase 2:** La arquitectura de datos y la estructura de módulos deben permitir
  agregar autenticación y multi-usuario en Fase 2 sin reescribir la lógica de negocio.

## Stack Tecnológico

- **Lenguaje:** TypeScript 5
- **Framework UI:** React 18 + Vite 5
- **Estilos:** Tailwind CSS 3
- **Persistencia:** localStorage (datos de sesión) + IndexedDB via `idb` (datos estructurados)
- **Gráficos:** Recharts
- **Formularios:** React Hook Form + Zod (validación de esquemas financieros)
- **Exportación:** jsPDF (PDF) + SheetJS/xlsx (Excel) — client-side
- **Testing:** Vitest + React Testing Library
- **Linter:** ESLint (config react-ts)
- **Formatter:** Prettier
- **Control de versiones:** Git + GitHub (repositorio remoto)
- **CI/CD:** Vercel conectado a rama `main` de GitHub — deploy automático en cada push
- **Hosting:** Vercel (deploy estático)
- **Backend:** N/A — Fase 1

## Módulos del Sistema

- `01-ingreso-datos`: Formularios para registrar ingresos, egresos, saldo inicial y financiamiento
- `02-proyeccion-ingresos`: Registro y visualización de ingresos estimados por período
- `03-proyeccion-egresos`: Registro de compras, planilla, servicios y tributos por período
- `04-flujo-caja`: Motor de cálculo — Flujo = Ingresos − Egresos, saldo acumulado por período
- `05-financiamiento`: Registro de préstamos, cálculo de cuotas e intereses, impacto en flujo
- `06-simulacion`: Capa de escenarios — modificar variables sin afectar datos reales, recalculo live
- `07-alertas`: Detección automática de déficits y generación de advertencias contextuales
- `08-reportes`: Visualización tabular/gráfica y exportación a PDF y Excel

## Estándares de Calidad

- **Cobertura de tests:** 100% en funciones de cálculo financiero (flujo, saldo, intereses, cuotas)
- **Cobertura de tests:** 80% mínimo en lógica de negocio general
- **Linter:** ESLint sin warnings en build
- **Formatter:** Prettier — aplicado antes de cada commit
- **Nombrado:** camelCase para variables/funciones, PascalCase para componentes, kebab-case para archivos
- **Commits:** Mensajes en español, descriptivos del cambio
- **Ramas:** `main` para producción, `dev` para desarrollo, feature branches desde `dev`

## Seguridad

- Los datos del usuario nunca salen del navegador en Fase 1 — no hay transmisión a servidores.
- No se almacenan contraseñas ni datos sensibles de autenticación en Fase 1.
- Validación de todos los inputs con Zod antes de procesarlos — no se aceptan valores NaN,
  negativos donde no corresponda, ni strings en campos numéricos.
- En Fase 2: autenticación con JWT, contraseñas hasheadas con bcrypt, HTTPS obligatorio.

## Restricciones para la IA

- No agregar dependencias npm sin aprobación explícita del usuario.
- No modificar la estructura de datos persistidos en localStorage/IndexedDB sin migración.
- No implementar features de Fase 2 (login, registro, API) en código de Fase 1.
- Los cálculos financieros deben revisarse manualmente antes de darse por correctos.
- No cambiar la librería de gráficos (Recharts) ni de exportación (jsPDF/SheetJS) sin consultar.
