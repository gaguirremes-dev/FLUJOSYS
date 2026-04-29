import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Alerta, ProyeccionConfig, ResultadoPeriodo } from '../../types'

interface Params {
  config: ProyeccionConfig
  resultados: ResultadoPeriodo[]
  alertas: Alerta[]
}

const MONEDA_SIMBOLO: Record<string, string> = { PEN: 'S/', USD: 'US$', EUR: '€' }

export function exportarPDF({ config, resultados, alertas }: Params): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const simbolo = MONEDA_SIMBOLO[config.moneda] ?? 'S/'
  const fmt = (n: number) => `${simbolo}${n.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
  const fecha = new Date().toLocaleDateString('es-PE')

  // Header
  let y = 15
  if (config.logoBase64) {
    try {
      doc.addImage(config.logoBase64, 'JPEG', 15, y - 5, 25, 15)
    } catch { /* logo opcional */ }
    doc.setFontSize(16).setFont('helvetica', 'bold').text(config.nombreEmpresa, 45, y + 2)
  } else {
    doc.setFontSize(16).setFont('helvetica', 'bold').text(config.nombreEmpresa, 15, y + 2)
  }
  doc.setFontSize(10).setFont('helvetica', 'normal').setTextColor(100)
  doc.text(`Flujo de Caja Proyectado — ${fecha}`, 15, y + 9)
  doc.setTextColor(0)
  y += 20

  // Tabla de flujo
  autoTable(doc, {
    startY: y,
    head: [['Período', 'Ingresos', 'Egresos', 'Desembolsos', 'Cuotas', 'Flujo Neto', 'Saldo Acumulado']],
    body: resultados.map((r) => [
      r.label,
      fmt(r.totalIngresos),
      fmt(r.totalEgresos),
      r.desembolsosPrestamos > 0 ? fmt(r.desembolsosPrestamos) : '—',
      r.cuotasPrestamos > 0 ? fmt(r.cuotasPrestamos) : '—',
      fmt(r.flujoNeto),
      fmt(r.saldoAcumulado),
    ]),
    didParseCell: (data) => {
      if (data.section === 'body') {
        const r = resultados[data.row.index]
        if (r?.saldoAcumulado < 0) data.cell.styles.fillColor = [255, 235, 235]
        if (data.column.index === 6 && r?.saldoAcumulado < 0) {
          data.cell.styles.textColor = [185, 28, 28]
          data.cell.styles.fontStyle = 'bold'
        }
        if (data.column.index === 5 && r?.flujoNeto < 0) {
          data.cell.styles.textColor = [185, 28, 28]
        }
      }
    },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' },
      4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right', fontStyle: 'bold' },
    },
  })

  // Alertas
  if (alertas.length > 0) {
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
    if (finalY < 185) {
      doc.setFontSize(11).setFont('helvetica', 'bold').text('Alertas activas', 15, finalY)
      alertas.forEach((a, i) => {
        doc.setFontSize(8).setFont('helvetica', 'normal')
        doc.text(`• ${a.recomendacion}`, 18, finalY + 7 + i * 6, { maxWidth: 250 })
      })
    }
  }

  // Footer con marca Flujosys
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7).setTextColor(150)
    doc.text(`Generado con Flujosys — Sistema de Gestión de Flujo de Caja | Página ${i} de ${pageCount}`, 15, 205)
    doc.setTextColor(0)
  }

  const nombreArchivo = `FlujoCaja_${config.nombreEmpresa.replace(/\s+/g, '_')}_${fecha.replace(/\//g, '-')}.pdf`
  doc.save(nombreArchivo)
}
