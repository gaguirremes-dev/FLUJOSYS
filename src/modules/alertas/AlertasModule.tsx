import { useAlertasStore } from '../../store/alertasStore'
import type { SeveridadAlerta } from '../../types'

const severidadConfig: Record<SeveridadAlerta, { bg: string; border: string; icon: string; label: string }> = {
  critica: { bg: 'bg-red-50', border: 'border-red-300', icon: '🚨', label: 'Crítica' },
  alta: { bg: 'bg-orange-50', border: 'border-orange-300', icon: '⚠️', label: 'Alta' },
  media: { bg: 'bg-yellow-50', border: 'border-yellow-300', icon: '⚡', label: 'Media' },
  informativa: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'ℹ️', label: 'Info' },
}

export function AlertasModule() {
  const alertas = useAlertasStore((s) => s.alertas)

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Alertas Financieras</h2>
        <p className="text-sm text-gray-500 mt-1">Detección automática de riesgos de liquidez</p>
      </div>

      {alertas.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-green-800 font-semibold text-lg">Liquidez saludable</p>
          <p className="text-green-600 text-sm mt-1">No se detectaron riesgos financieros en la proyección actual.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alertas.map((alerta) => {
            const cfg = severidadConfig[alerta.severidad]
            return (
              <div key={alerta.id} className={`${cfg.bg} border ${cfg.border} rounded-xl p-5`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl mt-0.5">{cfg.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold uppercase tracking-wide
                        ${alerta.severidad === 'critica' ? 'text-red-700' :
                          alerta.severidad === 'alta' ? 'text-orange-700' :
                          alerta.severidad === 'media' ? 'text-yellow-700' : 'text-blue-700'}`}>
                        {cfg.label}
                      </span>
                      {alerta.periodosAfectados.length > 0 && (
                        <span className="text-xs text-gray-500">
                          Período{alerta.periodosAfectados.length > 1 ? 's' : ''}: {alerta.periodosAfectados.join(', ')}
                        </span>
                      )}
                      {alerta.monto > 0 && (
                        <span className="text-xs text-gray-500">| Monto: {alerta.monto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-800 font-medium">{alerta.recomendacion}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
