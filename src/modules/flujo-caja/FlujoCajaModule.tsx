import { useConfigStore } from '../../store/configStore'
import { useFlujoStore } from '../../store/flujoStore'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Legend,
} from 'recharts'
import type { Moneda } from '../../types'

const simbolos: Record<Moneda, string> = { PEN: 'S/', USD: 'US$', EUR: '€' }

export function FlujoCajaModule() {
  const config = useConfigStore((s) => s.config)
  const resultados = useFlujoStore((s) => s.resultados)

  if (!config) return <p className="text-gray-500">Configura la proyección primero.</p>
  if (resultados.length === 0) return <p className="text-gray-500">Ingresa datos para ver el flujo de caja.</p>

  const simbolo = simbolos[config.moneda]
  const fmt = (n: number) => `${simbolo}${n.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Flujo de Caja</h2>
        <p className="text-sm text-gray-500 mt-1">Proyección completa período a período</p>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-700 w-28">Período</th>
              <th className="text-right px-3 py-3 font-medium text-gray-500">Ingresos</th>
              <th className="text-right px-3 py-3 font-medium text-gray-500">Egresos</th>
              <th className="text-right px-3 py-3 font-medium text-gray-500">Financiamiento</th>
              <th className="text-right px-3 py-3 font-medium text-gray-700">Flujo Neto</th>
              <th className="text-right px-3 py-3 font-medium text-gray-700">Saldo Acumulado</th>
            </tr>
          </thead>
          <tbody>
            {resultados.map((r) => {
              const flujoNeg = r.flujoNeto < 0
              const saldoNeg = r.saldoAcumulado < 0
              return (
                <tr key={r.periodo} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-gray-600">{r.label}</td>
                  <td className="px-3 py-2.5 text-right text-green-700">{fmt(r.totalIngresos)}</td>
                  <td className="px-3 py-2.5 text-right text-red-600">{fmt(r.totalEgresos)}</td>
                  <td className="px-3 py-2.5 text-right text-blue-600">
                    {r.desembolsosPrestamos > 0 && <span className="text-green-600">+{fmt(r.desembolsosPrestamos)} </span>}
                    {r.cuotasPrestamos > 0 && <span className="text-red-500">-{fmt(r.cuotasPrestamos)}</span>}
                    {r.desembolsosPrestamos === 0 && r.cuotasPrestamos === 0 && <span className="text-gray-400">—</span>}
                  </td>
                  <td className={`px-3 py-2.5 text-right font-medium ${flujoNeg ? 'bg-red-50 text-red-600' : 'text-gray-900'}`}>
                    {fmt(r.flujoNeto)}
                  </td>
                  <td className={`px-3 py-2.5 text-right font-semibold ${saldoNeg ? 'bg-red-100 text-red-700' : 'text-gray-900'}`}>
                    {fmt(r.saldoAcumulado)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Gráfico saldo acumulado */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-medium text-gray-800 mb-4">Saldo acumulado</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={resultados}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v) => `${simbolo}${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => fmt(v)} labelFormatter={(l) => `${l}`} />
            <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 4" />
            <Line type="monotone" dataKey="saldoAcumulado" name="Saldo acumulado" stroke="#2563eb" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico flujo neto */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-medium text-gray-800 mb-4">Flujo neto por período</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={resultados}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v) => `${simbolo}${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => fmt(v)} />
            <ReferenceLine y={0} stroke="#374151" />
            <Legend />
            <Bar dataKey="totalIngresos" name="Ingresos" fill="#22c55e" radius={[3, 3, 0, 0]} />
            <Bar dataKey="totalEgresos" name="Egresos" fill="#ef4444" radius={[3, 3, 0, 0]} />
            <Bar dataKey="flujoNeto" name="Flujo neto" fill="#3b82f6" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
