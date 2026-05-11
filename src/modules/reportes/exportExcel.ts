import ExcelJS from 'exceljs'
import type { ProyeccionConfig, ResultadoPeriodo } from '../../types'
import { getLogoFlujosysBase64 } from '../../utils/logoCache'

interface Params {
  config: ProyeccionConfig
  resultados: ResultadoPeriodo[]
}

// Paleta de colores
const AZUL_OSCURO = '1E3A5F'
const AZUL_MEDIO  = '2563EB'
const AZUL_CLARO  = 'DBEAFE'
const GRIS_CLARO  = 'F8FAFC'
const ROJO_FONDO  = 'FEE2E2'
const ROJO_TEXTO  = 'B91C1C'
const VERDE_FONDO = 'DCFCE7'
const VERDE_TEXTO = '15803D'
const BLANCO      = 'FFFFFF'

function fill(argb: string): ExcelJS.Fill {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } }
}

function border(): Partial<ExcelJS.Borders> {
  const thin: ExcelJS.Border = { style: 'thin', color: { argb: 'D1D5DB' } }
  return { top: thin, left: thin, bottom: thin, right: thin }
}

function currency(moneda: string): string {
  return moneda === 'USD' ? '"US$"#,##0.00' : moneda === 'EUR' ? '"€"#,##0.00' : '"S/"#,##0.00'
}

export async function exportarExcel({ config, resultados }: Params): Promise<void> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Flujosys'
  wb.created = new Date()

  const logoBase64 = await getLogoFlujosysBase64()
  const logoImageId = wb.addImage({
    base64: logoBase64.replace(/^data:image\/\w+;base64,/, ''),
    extension: 'jpeg',
  })

  const fecha = new Date().toLocaleDateString('es-PE')
  const fmt = currency(config.moneda)

  // ─── Hoja 1: Flujo de Caja ───────────────────────────────────────────────────
  const ws = wb.addWorksheet('Flujo de Caja', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true },
    views: [{ state: 'frozen', ySplit: 5 }],
  })

  ws.columns = [
    { key: 'periodo',      width: 16 },
    { key: 'ingresos',     width: 16 },
    { key: 'egresos',      width: 16 },
    { key: 'desembolsos',  width: 20 },
    { key: 'cuotas',       width: 18 },
    { key: 'flujoNeto',    width: 16 },
    { key: 'saldo',        width: 18 },
    { key: 'logo',         width: 18 },
  ]

  // Logo Flujosys en esquina superior derecha (columna H, filas 1-3)
  ws.addImage(logoImageId, {
    tl: { col: 7, row: 0 },
    ext: { width: 130, height: 65 },
  })

  // Fila 1 — Titulo principal
  ws.mergeCells('A1:G1')
  const titulo = ws.getCell('A1')
  titulo.value = 'FLUJOSYS — REPORTE DE FLUJO DE CAJA'
  titulo.font = { name: 'Calibri', bold: true, size: 14, color: { argb: BLANCO } }
  titulo.fill = fill(AZUL_OSCURO)
  titulo.alignment = { vertical: 'middle', horizontal: 'center' }
  ws.getRow(1).height = 28

  // Fila 2 — Info empresa
  ws.mergeCells('A2:D2')
  const empresa = ws.getCell('A2')
  empresa.value = `Empresa: ${config.nombreEmpresa}`
  empresa.font = { name: 'Calibri', bold: true, size: 11, color: { argb: AZUL_OSCURO } }
  empresa.fill = fill(AZUL_CLARO)
  empresa.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }

  ws.mergeCells('E2:G2')
  const infoFecha = ws.getCell('E2')
  infoFecha.value = `Fecha: ${fecha}  |  Moneda: ${config.moneda}  |  Periodos: ${config.numeroPeriodos}`
  infoFecha.font = { name: 'Calibri', size: 10, color: { argb: AZUL_OSCURO } }
  infoFecha.fill = fill(AZUL_CLARO)
  infoFecha.alignment = { vertical: 'middle', horizontal: 'right', indent: 1 }
  ws.getRow(2).height = 22

  // Fila 3 — Spacer
  ws.mergeCells('A3:G3')
  ws.getRow(3).height = 6

  // Fila 4 — Encabezados de tabla
  const HEADERS = ['Periodo', 'Ingresos', 'Egresos', 'Desembolsos Prestamos', 'Cuotas Prestamos', 'Flujo Neto', 'Saldo Acumulado']
  const headerRow = ws.getRow(4)
  headerRow.height = 20
  HEADERS.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1)
    cell.value = h
    cell.font = { name: 'Calibri', bold: true, size: 10, color: { argb: BLANCO } }
    cell.fill = fill(AZUL_MEDIO)
    cell.alignment = { vertical: 'middle', horizontal: idx === 0 ? 'left' : 'right', indent: 1 }
    cell.border = border()
  })

  // Filas de datos
  resultados.forEach((r, rowIdx) => {
    const row = ws.getRow(5 + rowIdx)
    row.height = 17
    const esImpar = rowIdx % 2 === 0
    const bgBase = esImpar ? BLANCO : GRIS_CLARO
    const saldoNeg = r.saldoAcumulado < 0

    const values = [
      r.label,
      r.totalIngresos,
      r.totalEgresos,
      r.desembolsosPrestamos,
      r.cuotasPrestamos,
      r.flujoNeto,
      r.saldoAcumulado,
    ]

    values.forEach((v, colIdx) => {
      const cell = row.getCell(colIdx + 1)
      cell.value = v
      cell.border = border()

      const isCurrency = colIdx > 0
      if (isCurrency) {
        cell.numFmt = fmt
        cell.alignment = { horizontal: 'right', vertical: 'middle' }
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
        cell.font = { name: 'Calibri', size: 10 }
      }

      // Color fondo: fila roja si saldo negativo
      if (saldoNeg) {
        cell.fill = fill(ROJO_FONDO)
        if (colIdx === 6) {
          cell.font = { name: 'Calibri', bold: true, size: 10, color: { argb: ROJO_TEXTO } }
        } else {
          cell.font = { name: 'Calibri', size: 10 }
        }
      } else {
        cell.fill = fill(bgBase)
        if (colIdx === 6) cell.font = { name: 'Calibri', bold: true, size: 10 }
        else cell.font = { name: 'Calibri', size: 10 }
      }

      // Flujo neto negativo en rojo aunque el saldo no sea negativo
      if (colIdx === 5 && r.flujoNeto < 0 && !saldoNeg) {
        cell.font = { name: 'Calibri', size: 10, color: { argb: ROJO_TEXTO } }
      }
      // Ingresos en verde
      if (colIdx === 1) cell.font = { name: 'Calibri', size: 10, color: { argb: VERDE_TEXTO } }
    })
  })

  // Fila de totales
  const totRow = ws.getRow(5 + resultados.length + 1)
  totRow.height = 20
  const totalIngresos = resultados.reduce((s, r) => s + r.totalIngresos, 0)
  const totalEgresos  = resultados.reduce((s, r) => s + r.totalEgresos, 0)
  const totValues = ['TOTALES', totalIngresos, totalEgresos, null, null, null, resultados.at(-1)?.saldoAcumulado ?? 0]
  totValues.forEach((v, colIdx) => {
    const cell = totRow.getCell(colIdx + 1)
    cell.value = v as ExcelJS.CellValue
    cell.fill = fill(AZUL_OSCURO)
    cell.font = { name: 'Calibri', bold: true, size: 10, color: { argb: BLANCO } }
    cell.border = border()
    if (colIdx > 0 && v !== null) {
      cell.numFmt = fmt
      cell.alignment = { horizontal: 'right', vertical: 'middle' }
    } else {
      cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
    }
  })

  // Fila de autores — Flujo de Caja
  const autoresRowIdx = 5 + resultados.length + 3
  const autoresRow = ws.getRow(autoresRowIdx)
  ws.mergeCells(`A${autoresRowIdx}:G${autoresRowIdx}`)
  const autoresCell = autoresRow.getCell(1)
  autoresCell.value = 'Autores: Giannier Aguirre Mestanza  |  MA Ing. Roberto Carlos Arteaga Lora  |  Dra. CPC. Giuliana Vilma Millones Orrego de Gastelo'
  autoresCell.font = { name: 'Calibri', italic: true, size: 8, color: { argb: '6B7280' } }
  autoresCell.alignment = { horizontal: 'center', vertical: 'middle' }
  autoresRow.height = 16

  // ─── Hoja 2: Indicadores ─────────────────────────────────────────────────────
  const ws2 = wb.addWorksheet('Indicadores')
  ws2.columns = [{ width: 34 }, { width: 20 }, { width: 16 }]

  ws2.addImage(logoImageId, {
    tl: { col: 2, row: 0 },
    ext: { width: 120, height: 60 },
  })

  ws2.mergeCells('A1:B1')
  const tit2 = ws2.getCell('A1')
  tit2.value = 'INDICADORES CLAVE'
  tit2.font = { name: 'Calibri', bold: true, size: 13, color: { argb: BLANCO } }
  tit2.fill = fill(AZUL_OSCURO)
  tit2.alignment = { vertical: 'middle', horizontal: 'center' }
  ws2.getRow(1).height = 26

  ws2.mergeCells('A2:B2')
  const sub2 = ws2.getCell('A2')
  sub2.value = `${config.nombreEmpresa}  |  ${config.moneda}  |  Generado: ${fecha}`
  sub2.font = { name: 'Calibri', size: 10, color: { argb: AZUL_OSCURO } }
  sub2.fill = fill(AZUL_CLARO)
  sub2.alignment = { vertical: 'middle', horizontal: 'center' }
  ws2.getRow(2).height = 18

  const saldoFinal    = resultados.at(-1)?.saldoAcumulado ?? 0
  const totalIng      = resultados.reduce((s, r) => s + r.totalIngresos, 0)
  const totalEgr      = resultados.reduce((s, r) => s + r.totalEgresos, 0)
  const periodosNeg   = resultados.filter((r) => r.saldoAcumulado < 0).length
  const periodoMinLbl = resultados.reduce(
    (min, r) => (r.saldoAcumulado < min.saldoAcumulado ? r : min),
    resultados[0] ?? { saldoAcumulado: 0, label: '-' }
  ).label

  const indicadores: [string, number | string][] = [
    ['Saldo inicial', config.saldoInicial],
    ['Saldo final proyectado', saldoFinal],
    ['Total ingresos', totalIng],
    ['Total egresos', totalEgr],
    ['Flujo neto total', totalIng - totalEgr],
    ['Periodos con saldo negativo', periodosNeg],
    ['Periodo con menor saldo', periodoMinLbl],
    ['Total periodos proyectados', config.numeroPeriodos],
  ]

  indicadores.forEach(([label, valor], i) => {
    const row = ws2.getRow(4 + i)
    row.height = 18
    const bg = i % 2 === 0 ? BLANCO : GRIS_CLARO

    const cLabel = row.getCell(1)
    cLabel.value = label
    cLabel.font = { name: 'Calibri', size: 10 }
    cLabel.fill = fill(bg)
    cLabel.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
    cLabel.border = border()

    const cVal = row.getCell(2)
    cVal.value = valor as ExcelJS.CellValue
    const isNumber = typeof valor === 'number' && !['Periodos con saldo negativo', 'Total periodos proyectados'].includes(label)
    if (isNumber) {
      cVal.numFmt = fmt
      cVal.alignment = { horizontal: 'right', vertical: 'middle' }
      const negativo = (valor as number) < 0
      cVal.font = { name: 'Calibri', bold: true, size: 10, color: { argb: negativo ? ROJO_TEXTO : VERDE_TEXTO } }
      cVal.fill = fill(negativo ? ROJO_FONDO : VERDE_FONDO)
    } else {
      cVal.font = { name: 'Calibri', bold: true, size: 10 }
      cVal.fill = fill(bg)
      cVal.alignment = { horizontal: 'right', vertical: 'middle', indent: 1 }
    }
    cVal.border = border()
  })

  // Fila de autores — Indicadores
  const autoresRowIdx2 = 4 + indicadores.length + 2
  const autoresRow2 = ws2.getRow(autoresRowIdx2)
  ws2.mergeCells(`A${autoresRowIdx2}:C${autoresRowIdx2}`)
  const autoresCell2 = autoresRow2.getCell(1)
  autoresCell2.value = 'Autores: Giannier Aguirre Mestanza  |  MA Ing. Roberto Carlos Arteaga Lora  |  Dra. CPC. Giuliana Vilma Millones Orrego de Gastelo'
  autoresCell2.font = { name: 'Calibri', italic: true, size: 8, color: { argb: '6B7280' } }
  autoresCell2.alignment = { horizontal: 'center', vertical: 'middle' }
  autoresRow2.height = 16

  // Generar y descargar
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `FlujoCaja_${config.nombreEmpresa.replace(/\s+/g, '_')}_${fecha.replace(/\//g, '-')}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}
