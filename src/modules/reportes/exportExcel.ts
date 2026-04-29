import * as XLSX from 'xlsx'
import type { ProyeccionConfig, ResultadoPeriodo } from '../../types'

interface Params {
  config: ProyeccionConfig
  resultados: ResultadoPeriodo[]
}

export function exportarExcel({ config, resultados }: Params): void {
  const wb = XLSX.utils.book_new()
  const fecha = new Date().toLocaleDateString('es-PE')

  // Hoja: Flujo de Caja
  const flujoDatos = [
    ['Empresa:', config.nombreEmpresa],
    ['Moneda:', config.moneda],
    ['Fecha:', fecha],
    [],
    ['Período', 'Ingresos', 'Egresos', 'Desembolsos Préstamos', 'Cuotas Préstamos', 'Flujo Neto', 'Saldo Acumulado'],
    ...resultados.map((r) => [
      r.label,
      r.totalIngresos,
      r.totalEgresos,
      r.desembolsosPrestamos,
      r.cuotasPrestamos,
      r.flujoNeto,
      r.saldoAcumulado,
    ]),
    [],
    ['TOTALES', resultados.reduce((s, r) => s + r.totalIngresos, 0), resultados.reduce((s, r) => s + r.totalEgresos, 0)],
  ]

  const wsFlujo = XLSX.utils.aoa_to_sheet(flujoDatos)
  wsFlujo['!cols'] = [{ wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 20 }, { wch: 18 }, { wch: 14 }, { wch: 18 }]
  XLSX.utils.book_append_sheet(wb, wsFlujo, 'Flujo de Caja')

  // Hoja: Indicadores
  const indicadores = [
    ['Indicador', 'Valor'],
    ['Saldo inicial', config.saldoInicial],
    ['Saldo final proyectado', resultados.at(-1)?.saldoAcumulado ?? 0],
    ['Total ingresos', resultados.reduce((s, r) => s + r.totalIngresos, 0)],
    ['Total egresos', resultados.reduce((s, r) => s + r.totalEgresos, 0)],
    ['Períodos con saldo negativo', resultados.filter((r) => r.saldoAcumulado < 0).length],
    ['Total períodos proyectados', config.numeroPeriodos],
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(indicadores), 'Indicadores')

  const nombreArchivo = `FlujoCaja_${config.nombreEmpresa.replace(/\s+/g, '_')}_${fecha.replace(/\//g, '-')}.xlsx`
  XLSX.writeFile(wb, nombreArchivo)
}
