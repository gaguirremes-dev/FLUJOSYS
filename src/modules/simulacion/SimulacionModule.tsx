import { useState } from 'react'
import { useSimulacionStore } from '../../store/simulacionStore'
import { useConfigStore } from '../../store/configStore'
import { useFlujoStore } from '../../store/flujoStore'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
import { Input } from '../../components/Input'
import type { Moneda } from '../../types'

const simbolos: Record<Moneda, string> = { PEN: 'S/', USD: 'US$', EUR: '€' }

export function SimulacionModule() {
  const config = useConfigStore((s) => s.config)
  const base = useFlujoStore((s) => s.resultados)
  const {
    escenarios, escenarioActivoId, crearEscenario, duplicarEscenario,
    eliminarEscenario, seleccionarEscenario, getResultadosEscenario, getComparacion,
  } = useSimulacionStore()

  const [showModal, setShowModal] = useState(false)
  const [nombre, setNombre] = useState('')
  const [vista, setVista] = useState<'lista' | 'comparacion'>('lista')

  if (!config) return <p className="text-gray-500">Configura la proyección primero.</p>

  const simbolo = simbolos[config.moneda]
  const fmt = (n: number) => `${simbolo}${n.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
  const comparacion = getComparacion()
  const saldoBase = base.at(-1)?.saldoAcumulado ?? 0
  const escenarioActivo = escenarios.find((e) => e.id === escenarioActivoId)

  const handleCrear = async () => {
    if (!nombre.trim()) return
    await crearEscenario(nombre.trim())
    setNombre('')
    setShowModal(false)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Simulación de Escenarios</h2>
          <p className="text-sm text-gray-500 mt-1">Proyecta hipótesis sin modificar tus datos reales</p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => setVista('lista')}
              className={`px-3 py-1.5 text-sm ${vista === 'lista' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >Lista</button>
            <button
              onClick={() => setVista('comparacion')}
              className={`px-3 py-1.5 text-sm ${vista === 'comparacion' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >Comparar</button>
          </div>
          <Button onClick={() => setShowModal(true)} disabled={escenarios.length >= 10}>
            + Nuevo escenario
          </Button>
        </div>
      </div>

      {vista === 'lista' && (
        <>
          {escenarios.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
              <p className="text-gray-400 mb-3">No hay escenarios creados</p>
              <Button size="sm" onClick={() => setShowModal(true)}>Crear primer escenario</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {escenarios.map((e) => {
                const resultados = getResultadosEscenario(e.id)
                const saldoFinal = resultados.at(-1)?.saldoAcumulado ?? 0
                const isActivo = escenarioActivoId === e.id
                return (
                  <div key={e.id} className={`bg-white rounded-xl border p-5 transition-all ${isActivo ? 'border-blue-400 ring-1 ring-blue-400' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{e.nombre}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{e.numeroPeriodos} períodos · Saldo final: <span className={`font-semibold ${saldoFinal >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(saldoFinal)}</span></p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant={isActivo ? 'primary' : 'secondary'} onClick={() => seleccionarEscenario(isActivo ? null : e.id)}>
                          {isActivo ? 'Editando' : 'Editar'}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => duplicarEscenario(e.id)} disabled={escenarios.length >= 10}>Duplicar</Button>
                        <Button size="sm" variant="danger" onClick={() => eliminarEscenario(e.id)}>Eliminar</Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Panel de edición del escenario activo */}
          {escenarioActivo && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-5">
              <h3 className="font-medium text-blue-800 mb-3">Editando: {escenarioActivo.nombre}</h3>
              <p className="text-sm text-blue-600">
                Los cambios de montos se realizan desde los módulos de Ingresos y Egresos mientras esté activo este escenario. <br/>
                <span className="font-medium">Períodos del escenario:</span> {escenarioActivo.numeroPeriodos}
              </p>
            </div>
          )}
        </>
      )}

      {vista === 'comparacion' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-5 py-3 font-medium text-gray-700">Escenario</th>
                <th className="text-right px-5 py-3 font-medium text-gray-700">Saldo final</th>
                <th className="text-right px-5 py-3 font-medium text-gray-700">vs. Base</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-700">📊 Proyección base</td>
                <td className="px-5 py-3 text-right font-semibold text-gray-900">{fmt(saldoBase)}</td>
                <td className="px-5 py-3 text-right text-gray-400">—</td>
              </tr>
              {comparacion.map((c) => (
                <tr key={c.id} className="border-b border-gray-100">
                  <td className="px-5 py-3 text-gray-800">{c.nombre}</td>
                  <td className={`px-5 py-3 text-right font-semibold ${c.saldoFinal >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                    {fmt(c.saldoFinal)}
                  </td>
                  <td className={`px-5 py-3 text-right font-medium ${c.mejor ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                    {c.mejor ? '+' : ''}{fmt(c.deltaVsBase)}
                  </td>
                </tr>
              ))}
              {comparacion.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-6 text-center text-gray-400">Crea escenarios para compararlos</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showModal} title="Nuevo escenario" onClose={() => setShowModal(false)}>
        <p className="text-sm text-gray-500 mb-3">El escenario se creará como copia de tu proyección base actual.</p>
        <Input
          label="Nombre del escenario"
          placeholder="Ej: Escenario optimista"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCrear()}
          autoFocus
        />
        <div className="flex gap-3 mt-4 justify-end">
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
          <Button onClick={handleCrear} disabled={!nombre.trim()}>Crear escenario</Button>
        </div>
      </Modal>
    </div>
  )
}
