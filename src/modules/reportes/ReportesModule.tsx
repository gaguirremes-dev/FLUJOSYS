import { useConfigStore } from '../../store/configStore'
import { useFlujoStore } from '../../store/flujoStore'
import { useAlertasStore } from '../../store/alertasStore'
import { Button } from '../../components/Button'
import { exportarPDF } from './exportPDF'
import { exportarExcel } from './exportExcel'
import type { Moneda } from '../../types'

const simbolos: Record<Moneda, string> = { PEN: 'S/', USD: 'US$', EUR: '€' }

export function ReportesModule() {
  const config = useConfigStore((s) => s.config)
  const resultados = useFlujoStore((s) => s.resultados)
  const alertas = useAlertasStore((s) => s.alertas)

  if (!config) return <p className="text-gray-500">Configura la proyección primero.</p>

  const simbolo = simbolos[config.moneda]
  const fmt = (n: number) => `${simbolo}${n.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`

  // Indicadores del resumen ejecutivo
  const saldoFinal = resultados.at(-1)?.saldoAcumulado ?? 0
  const periodosNeg = resultados.filter((r) => r.saldoAcumulado < 0).length
  const periodoMinimo = resultados.reduce(
    (min, r) => (r.saldoAcumulado < min.saldoAcumulado ? r : min),
    resultados[0] ?? { saldoAcumulado: 0, label: '—' }
  )
  const totalIngresos = resultados.reduce((s, r) => s + r.totalIngresos, 0)
  const totalEgresos = resultados.reduce((s, r) => s + r.totalEgresos, 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Reportes</h2>
          <p className="text-sm text-gray-500 mt-1">Exporta tu proyección en PDF o Excel</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => exportarExcel({ config, resultados })}>
            📊 Exportar Excel
          </Button>
          <Button onClick={() => exportarPDF({ config, resultados, alertas })}>
            📄 Exportar PDF
          </Button>
        </div>
      </div>

      {/* Resumen ejecutivo */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-medium text-gray-800 mb-4">Resumen ejecutivo</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <KPI label="Saldo inicial" value={fmt(config.saldoInicial)} />
          <KPI label="Saldo final proyectado" value={fmt(saldoFinal)} highlight={saldoFinal < 0 ? 'danger' : saldoFinal === 0 ? 'neutral' : 'success'} />
          <KPI label="Total ingresos" value={fmt(totalIngresos)} highlight="success" />
          <KPI label="Total egresos" value={fmt(totalEgresos)} highlight="danger" />
          <KPI label="Período con menor saldo" value={`${periodoMinimo?.label ?? '—'} (${fmt(periodoMinimo?.saldoAcumulado ?? 0)})`} />
          <KPI label="Períodos con saldo negativo" value={`${periodosNeg} de ${config.numeroPeriodos}`} highlight={periodosNeg > 0 ? 'danger' : 'success'} />
        </div>
      </div>

      {/* Alertas en reporte */}
      {alertas.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-medium text-gray-800 mb-3">Alertas activas ({alertas.length})</h3>
          <div className="space-y-2">
            {alertas.map((a) => (
              <div key={a.id} className="flex items-start gap-2 text-sm text-gray-700">
                <span>{a.severidad === 'critica' ? '🚨' : a.severidad === 'alta' ? '⚠️' : 'ℹ️'}</span>
                <span>{a.recomendacion}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabla completa */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <div className="px-5 py-4 border-b border-gray-200">
          <h3 className="font-medium text-gray-800">Flujo de caja proyectado — {config.nombreEmpresa}</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Período</th>
              <th className="text-right px-3 py-3 font-medium text-gray-600">Ingresos</th>
              <th className="text-right px-3 py-3 font-medium text-gray-600">Egresos</th>
              <th className="text-right px-3 py-3 font-medium text-gray-600">Flujo neto</th>
              <th className="text-right px-3 py-3 font-medium text-gray-600">Saldo acumulado</th>
            </tr>
          </thead>
          <tbody>
            {resultados.map((r) => (
              <tr key={r.periodo} className={`border-b border-gray-100 ${r.saldoAcumulado < 0 ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                <td className="px-4 py-2.5 text-gray-600">{r.label}</td>
                <td className="px-3 py-2.5 text-right text-green-700">{fmt(r.totalIngresos)}</td>
                <td className="px-3 py-2.5 text-right text-red-600">{fmt(r.totalEgresos)}</td>
                <td className={`px-3 py-2.5 text-right font-medium ${r.flujoNeto < 0 ? 'text-red-600' : 'text-gray-900'}`}>{fmt(r.flujoNeto)}</td>
                <td className={`px-3 py-2.5 text-right font-semibold ${r.saldoAcumulado < 0 ? 'text-red-700' : 'text-gray-900'}`}>{fmt(r.saldoAcumulado)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function KPI({ label, value, highlight }: { label: string; value: string; highlight?: 'success' | 'danger' | 'neutral' }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`font-semibold text-sm ${highlight === 'success' ? 'text-green-700' : highlight === 'danger' ? 'text-red-700' : 'text-gray-900'}`}>
        {value}
      </p>
    </div>
  )
}
