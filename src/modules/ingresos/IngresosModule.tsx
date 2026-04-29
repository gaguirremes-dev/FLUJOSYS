import { useState } from 'react'
import { useConfigStore } from '../../store/configStore'
import { useIngresosStore } from '../../store/ingresosStore'
import { useFlujoStore } from '../../store/flujoStore'
import { useAlertasStore } from '../../store/alertasStore'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
import { Input } from '../../components/Input'
import type { Moneda } from '../../types'

const simbolos: Record<Moneda, string> = { PEN: 'S/', USD: 'US$', EUR: '€' }

export function IngresosModule() {
  const config = useConfigStore((s) => s.config)
  const { categorias, agregarCategoria, actualizarMonto, eliminarCategoria } = useIngresosStore()
  const recalcularFlujo = useFlujoStore((s) => s.recalcular)
  const recalcularAlertas = useAlertasStore((s) => s.recalcular)
  const [showModal, setShowModal] = useState(false)
  const [nombre, setNombre] = useState('')
  const [errores, setErrores] = useState<Record<string, string>>({})

  if (!config) return <p className="text-gray-500">Configura la proyección primero.</p>

  const simbolo = simbolos[config.moneda]
  const periodos = Array.from({ length: config.numeroPeriodos }, (_, i) => i)
  const labels = periodos.map((i) => {
    const map = { dia: 'D', semana: 'S', mes: 'M', año: 'A' }
    return `${map[config.unidadPeriodo]}${i + 1}`
  })

  const handleAgregar = async () => {
    if (!nombre.trim()) return
    await agregarCategoria(nombre.trim(), config.numeroPeriodos)
    setNombre('')
    setShowModal(false)
  }

  const handleMonto = async (id: string, periodoIdx: number, valor: string) => {
    const num = parseFloat(valor)
    const key = `${id}-${periodoIdx}`
    if (valor !== '' && (isNaN(num) || num < 0)) {
      setErrores((prev) => ({ ...prev, [key]: 'Valor inválido' }))
      return
    }
    setErrores((prev) => { const n = { ...prev }; delete n[key]; return n })
    await actualizarMonto(id, periodoIdx, isNaN(num) ? 0 : num)
    recalcularFlujo()
    recalcularAlertas()
  }

  const totalPorPeriodo = periodos.map((i) =>
    categorias.reduce((sum, c) => sum + (c.montos[i] ?? 0), 0)
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Ingresos</h2>
          <p className="text-sm text-gray-500 mt-1">Ingresos proyectados por período</p>
        </div>
        <Button onClick={() => setShowModal(true)}>+ Agregar categoría</Button>
      </div>

      {categorias.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
          <p className="text-gray-400 mb-3">No hay categorías de ingreso</p>
          <Button size="sm" onClick={() => setShowModal(true)}>Agregar primera categoría</Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-700 w-44">Categoría</th>
                {labels.map((l) => (
                  <th key={l} className="text-right px-2 py-3 font-medium text-gray-500 min-w-24">{l}</th>
                ))}
                <th className="px-3 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {categorias.map((cat) => (
                <tr key={cat.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-800">{cat.nombre}</td>
                  {periodos.map((i) => {
                    const key = `${cat.id}-${i}`
                    return (
                      <td key={i} className="px-1 py-1.5">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">{simbolo}</span>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            defaultValue={cat.montos[i] || ''}
                            placeholder="0"
                            onBlur={(e) => handleMonto(cat.id, i, e.target.value)}
                            className={`w-full text-right pl-6 pr-2 py-1 rounded border text-xs outline-none focus:border-blue-400
                              ${errores[key] ? 'border-red-400' : 'border-gray-200'}`}
                          />
                        </div>
                        {errores[key] && <p className="text-red-500 text-xs mt-0.5">{errores[key]}</p>}
                      </td>
                    )
                  })}
                  <td className="px-3 py-2">
                    <button
                      onClick={async () => { await eliminarCategoria(cat.id); recalcularFlujo(); recalcularAlertas() }}
                      className="text-gray-300 hover:text-red-500 transition-colors text-lg"
                      title="Eliminar"
                    >×</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-blue-50 font-semibold">
                <td className="px-4 py-2.5 text-blue-700">Total</td>
                {totalPorPeriodo.map((t, i) => (
                  <td key={i} className="px-2 py-2.5 text-right text-blue-700">
                    {simbolo}{t.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </td>
                ))}
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <Modal open={showModal} title="Agregar categoría de ingreso" onClose={() => setShowModal(false)}>
        <Input
          label="Nombre de la categoría"
          placeholder="Ej: Ventas al contado"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAgregar()}
          autoFocus
        />
        <div className="flex gap-3 mt-4 justify-end">
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
          <Button onClick={handleAgregar} disabled={!nombre.trim()}>Agregar</Button>
        </div>
      </Modal>
    </div>
  )
}
