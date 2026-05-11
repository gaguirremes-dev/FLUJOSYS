import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Alerta, ProyeccionConfig, ResultadoPeriodo } from '../../types'
import { getLogoFlujosysBase64 } from '../../utils/logoCache'

interface Params {
  config: ProyeccionConfig
  resultados: ResultadoPeriodo[]
  alertas: Alerta[]
}

const MONEDA_SIMBOLO: Record<string, string> = { PEN: 'S/', USD: 'US$', EUR: '€' }

// A4 portrait: 210 x 297 mm, margenes 15mm
const MARGIN = 15
const PAGE_W = 210
const CONTENT_W = PAGE_W - MARGIN * 2
const FOOTER_Y = 289

export async function exportarPDF({ config, resultados, alertas }: Params): Promise<void> {
  const logoFlujosys = await getLogoFlujosysBase64()
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const simbolo = MONEDA_SIMBOLO[config.moneda] ?? 'S/'
  const fmt = (n: number) => `${simbolo}${n.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
  const fecha = new Date().toLocaleDateString('es-PE')

  // ─── Cabecera ─────────────────────────────────────────────────────────────────
  let y = MARGIN

  // Banda azul de fondo de cabecera
  doc.setFillColor(30, 58, 95)
  doc.rect(0, 0, PAGE_W, 38, 'F')

  // Logo en esquina superior izquierda dentro de la banda
  let textStartX = MARGIN
  if (config.logoBase64) {
    try {
      doc.addImage(config.logoBase64, 'JPEG', MARGIN, y - 2, 22, 14)
      textStartX = MARGIN + 26
    } catch { /* logo opcional */ }
  }

  // Nombre empresa
  doc.setFontSize(15).setFont('helvetica', 'bold').setTextColor(255, 255, 255)
  doc.text(config.nombreEmpresa, textStartX, y + 5)

  // Subtitulo
  doc.setFontSize(9).setFont('helvetica', 'normal').setTextColor(186, 214, 255)
  doc.text('Reporte de Flujo de Caja Proyectado', textStartX, y + 12)

  // Logo Flujosys en esquina superior derecha (fondo blanco + logo)
  const logoW = 22
  const logoH = 13
  const logoX = PAGE_W - MARGIN - logoW
  const logoY = y - 3
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(logoX, logoY, logoW, logoH, 1, 1, 'F')
  try {
    doc.addImage(logoFlujosys, 'JPEG', logoX, logoY, logoW, logoH)
  } catch { /* logo opcional */ }

  // Fecha y periodos debajo del logo
  doc.setFontSize(8).setTextColor(186, 214, 255)
  doc.text(fecha, PAGE_W - MARGIN, y + 13, { align: 'right' })
  doc.text(`${config.numeroPeriodos} periodos · ${config.moneda}`, PAGE_W - MARGIN, y + 20, { align: 'right' })

  doc.setTextColor(0, 0, 0)
  y = 44

  // ─── Indicadores resumidos (fila de KPIs) ────────────────────────────────────
  const saldoFinal   = resultados.at(-1)?.saldoAcumulado ?? 0
  const totalIng     = resultados.reduce((s, r) => s + r.totalIngresos, 0)
  const totalEgr     = resultados.reduce((s, r) => s + r.totalEgresos, 0)
  const periodosNeg  = resultados.filter((r) => r.saldoAcumulado < 0).length

  const kpis = [
    { label: 'Saldo inicial', valor: fmt(config.saldoInicial), color: [37, 99, 235] as [number,number,number] },
    { label: 'Total ingresos', valor: fmt(totalIng), color: [21, 128, 61] as [number,number,number] },
    { label: 'Total egresos', valor: fmt(totalEgr), color: [185, 28, 28] as [number,number,number] },
    { label: 'Saldo final', valor: fmt(saldoFinal), color: saldoFinal < 0 ? [185, 28, 28] as [number,number,number] : [21, 128, 61] as [number,number,number] },
  ]

  const kpiW = CONTENT_W / kpis.length
  kpis.forEach(({ label, valor, color }, i) => {
    const x = MARGIN + i * kpiW
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(x, y, kpiW - 2, 16, 2, 2, 'F')
    doc.setFontSize(7).setTextColor(100, 116, 139)
    doc.text(label, x + (kpiW - 2) / 2, y + 5, { align: 'center' })
    doc.setFontSize(9).setFont('helvetica', 'bold').setTextColor(...color)
    doc.text(valor, x + (kpiW - 2) / 2, y + 12, { align: 'center' })
    doc.setFont('helvetica', 'normal').setTextColor(0)
  })
  y += 22

  // Alerta periodos negativos
  if (periodosNeg > 0) {
    doc.setFillColor(254, 226, 226)
    doc.roundedRect(MARGIN, y, CONTENT_W, 8, 1, 1, 'F')
    doc.setFontSize(8).setTextColor(185, 28, 28)
    doc.text(`Atencion: ${periodosNeg} periodo(s) con saldo negativo detectado(s)`, MARGIN + 3, y + 5.5)
    doc.setTextColor(0)
    y += 12
  }

  // ─── Tabla principal ─────────────────────────────────────────────────────────
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [['Periodo', 'Ingresos', 'Egresos', 'Desembolsos', 'Cuotas', 'Flujo Neto', 'Saldo Acum.']],
    body: resultados.map((r) => [
      r.label,
      fmt(r.totalIngresos),
      fmt(r.totalEgresos),
      r.desembolsosPrestamos > 0 ? fmt(r.desembolsosPrestamos) : '-',
      r.cuotasPrestamos > 0 ? fmt(r.cuotasPrestamos) : '-',
      fmt(r.flujoNeto),
      fmt(r.saldoAcumulado),
    ]),
    foot: [[
      'TOTALES',
      fmt(totalIng),
      fmt(totalEgr),
      '',
      '',
      fmt(totalIng - totalEgr),
      fmt(saldoFinal),
    ]],
    didParseCell: (data) => {
      if (data.section === 'body') {
        const r = resultados[data.row.index]
        if (r?.saldoAcumulado < 0) {
          data.cell.styles.fillColor = [255, 235, 235]
        }
        if (data.column.index === 6 && r?.saldoAcumulado < 0) {
          data.cell.styles.textColor = [185, 28, 28]
          data.cell.styles.fontStyle = 'bold'
        }
        if (data.column.index === 5 && r?.flujoNeto < 0) {
          data.cell.styles.textColor = [185, 28, 28]
        }
        if (data.column.index === 1) {
          data.cell.styles.textColor = [21, 128, 61]
        }
      }
    },
    headStyles: {
      fillColor: [30, 58, 95],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    footStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: { fontSize: 7.5 },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 20, halign: 'left' },
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right', fontStyle: 'bold' },
    },
  })

  // ─── Alertas ─────────────────────────────────────────────────────────────────
  if (alertas.length > 0) {
    const lastTableY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
    let ay = lastTableY + 8

    if (ay + alertas.length * 7 + 10 < FOOTER_Y - 10) {
      doc.setFontSize(9).setFont('helvetica', 'bold').setTextColor(30, 58, 95)
      doc.text('Alertas activas', MARGIN, ay)
      ay += 6

      alertas.forEach((a) => {
        const icono = a.severidad === 'critica' ? '!' : a.severidad === 'alta' ? '>' : 'i'
        const [r, g, b] = a.severidad === 'critica' ? [185, 28, 28] : a.severidad === 'alta' ? [180, 83, 9] : [37, 99, 235]
        doc.setFontSize(7.5).setFont('helvetica', 'normal').setTextColor(r, g, b)
        const lines = doc.splitTextToSize(`[${icono}] ${a.recomendacion}`, CONTENT_W - 4)
        doc.text(lines, MARGIN + 2, ay)
        ay += lines.length * 5 + 1
        if (ay > FOOTER_Y - 15) return
      })
      doc.setTextColor(0)
    }
  }

  // ─── Footer en cada pagina ────────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages()
  const footerLogoH = 6
  const footerLogoW = footerLogoH * (22 / 13)
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setDrawColor(203, 213, 225)
    doc.line(MARGIN, FOOTER_Y - 4, PAGE_W - MARGIN, FOOTER_Y - 4)
    try {
      doc.addImage(logoFlujosys, 'JPEG', MARGIN, FOOTER_Y - footerLogoH - 1, footerLogoW, footerLogoH)
    } catch { /* logo opcional */ }
    doc.setFontSize(6.5).setTextColor(148, 163, 184)
    doc.text('Sistema de Gestion de Flujo de Caja', MARGIN + footerLogoW + 2, FOOTER_Y - 1)
    doc.text(`Pagina ${i} de ${pageCount}`, PAGE_W - MARGIN, FOOTER_Y - 1, { align: 'right' })
    doc.setFontSize(5.5).setTextColor(180, 180, 180)
    doc.text(
      'Autores: Giannier Aguirre Mestanza  |  MA Ing. Roberto Carlos Arteaga Lora  |  Dra. CPC. Giuliana Vilma Millones Orrego de Gastelo',
      PAGE_W / 2, FOOTER_Y + 4, { align: 'center' }
    )
    doc.setTextColor(0)
  }

  const nombreArchivo = `FlujoCaja_${config.nombreEmpresa.replace(/\s+/g, '_')}_${fecha.replace(/\//g, '-')}.pdf`
  doc.save(nombreArchivo)
}
