import { useState } from 'react'
import { useSimulacionStore } from '../../store/simulacionStore'
import { useConfigStore } from '../../store/configStore'
import { useFlujoStore } from '../../store/flujoStore'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
import { Input } from '../../components/Input'
import type { Escenario, Moneda } from '../../types'

const simbolos: Record<Moneda, string> = { PEN: 'S/', USD: 'US$', EUR: '€' }

export function SimulacionModule() {
  const config = useConfigStore((s) => s.config)
  const base = useFlujoStore((s) => s.resultados)
  const {
    escenarios, escenarioActivoId, crearEscenario, duplicarEscenario,
    eliminarEscenario, seleccionarEscenario, actualizarEscenario,
    getResultadosEscenario, getComparacion,
  } = useSimulacionStore()

  const [showModal, setShowModal] = useState(false)
  const [nombre, setNombre] = useState('')
  const [vista, setVista] = useState<'lista' | 'comparacion'>('lista')
  const [ajusteId, setAjusteId] = useState<string | null>(null)
  const [editorTab, setEditorTab] = useState<'ingresos' | 'egresos'>('ingresos')

  if (!config) return <p className="text-gray-500">Configura la proyeccion primero.</p>

  const simbolo = simbolos[config.moneda]
  const fmt = (n: number) => `${simbolo}${n.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
  const comparacion = getComparacion()
  const saldoBase = base.at(-1)?.saldoAcumulado ?? 0
  const escenarioActivo = escenarios.find((e) => e.id === escenarioActivoId)
  const escenarioAjuste = ajusteId ? escenarios.find((e) => e.id === ajusteId) : null

  const handleCrear = async () => {
    if (!nombre.trim()) return
    await crearEscenario(nombre.trim())
    setNombre('')
    setShowModal(false)
  }

  const handleEditorMonto = async (
    tipo: 'ingreso' | 'egreso',
    escId: string,
    catId: string,
    periodoIdx: number,
    valor: string
  ) => {
    const num = parseFloat(valor)
    const monto = isNaN(num) || num < 0 ? 0 : num
    const esc = escenarios.find((e) => e.id === escId)
    if (!esc) return

    if (tipo === 'ingreso') {
      const cats = esc.categoriasIngreso.map((c) =>
        c.id === catId ? { ...c, montos: c.montos.map((m, i) => (i === periodoIdx ? monto : m)) } : c
      )
      await actualizarEscenario(escId, { categoriasIngreso: cats })
    } else {
      const cats = esc.categoriasEgreso.map((c) =>
        c.id === catId ? { ...c, montos: c.montos.map((m, i) => (i === periodoIdx ? monto : m)) } : c
      )
      await actualizarEscenario(escId, { categoriasEgreso: cats })
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Simulacion de Escenarios</h2>
          <p className="text-sm text-gray-500 mt-1">Proyecta hipotesis sin modificar tus datos reales</p>
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
                        <p className="text-xs text-gray-400 mt-0.5">
                          {e.numeroPeriodos} periodos - Saldo final:{' '}
                          <span className={`font-semibold ${saldoFinal >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(saldoFinal)}</span>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant={isActivo ? 'primary' : 'secondary'} onClick={() => seleccionarEscenario(isActivo ? null : e.id)}>
                          {isActivo ? 'Editando' : 'Editar numeros'}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setAjusteId(e.id)}>
                          Ajuste %
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

          {escenarioActivo && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-medium text-gray-900">Editando: {escenarioActivo.nombre}</h3>
                  <p className="text-xs text-gray-400">Modifica cada celda y pierde el foco (Tab o click afuera) para guardar</p>
                </div>
                <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
                  <button
                    onClick={() => setEditorTab('ingresos')}
                    className={`px-3 py-1.5 ${editorTab === 'ingresos' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  >Ingresos</button>
                  <button
                    onClick={() => setEditorTab('egresos')}
                    className={`px-3 py-1.5 ${editorTab === 'egresos' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  >Egresos</button>
                </div>
              </div>
              <EscenarioEditor
                key={`${escenarioActivo.id}-${editorTab}-${escenarioActivo.actualizadoEn}`}
                escenario={escenarioActivo}
                tab={editorTab}
                simbolo={simbolo}
                onMonto={handleEditorMonto}
              />
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
                <td className="px-5 py-3 font-medium text-gray-700">Proyeccion base</td>
                <td className="px-5 py-3 text-right font-semibold text-gray-900">{fmt(saldoBase)}</td>
                <td className="px-5 py-3 text-right text-gray-400">-</td>
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
        <p className="text-sm text-gray-500 mb-3">El escenario se creara como copia de tu proyeccion base actual.</p>
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

      {escenarioAjuste && (
        <AjusteModal
          open={!!ajusteId}
          escenario={escenarioAjuste}
          onClose={() => setAjusteId(null)}
          onAplicar={async (changes) => {
            await actualizarEscenario(escenarioAjuste.id, changes)
            setAjusteId(null)
          }}
        />
      )}
    </div>
  )
}

// ─── EscenarioEditor ──────────────────────────────────────────────────────────

interface EditorProps {
  escenario: Escenario
  tab: 'ingresos' | 'egresos'
  simbolo: string
  onMonto: (tipo: 'ingreso' | 'egreso', escId: string, catId: string, periodoIdx: number, valor: string) => Promise<void>
}

function EscenarioEditor({ escenario, tab, simbolo, onMonto }: EditorProps) {
  const periodos = Array.from({ length: escenario.numeroPeriodos }, (_, i) => i)
  const categorias = tab === 'ingresos' ? escenario.categoriasIngreso : escenario.categoriasEgreso
  const tipo: 'ingreso' | 'egreso' = tab === 'ingresos' ? 'ingreso' : 'egreso'
  const totales = periodos.map((i) => categorias.reduce((s, c) => s + (c.montos[i] ?? 0), 0))

  if (categorias.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
        Este escenario no tiene categorias de {tab}. Se heredan de la proyeccion base al crear el escenario.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="text-left px-4 py-3 font-medium text-gray-700 w-44">Categoria</th>
            {periodos.map((i) => (
              <th key={i} className="text-right px-2 py-3 font-medium text-gray-500 min-w-24">P{i + 1}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {categorias.map((cat) => (
            <tr key={cat.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-4 py-2 font-medium text-gray-800 truncate max-w-44">{cat.nombre}</td>
              {periodos.map((i) => (
                <td key={i} className="px-1 py-1.5">
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">{simbolo}</span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      defaultValue={cat.montos[i] || ''}
                      placeholder="0"
                      onBlur={(e) => onMonto(tipo, escenario.id, cat.id, i, e.target.value)}
                      className="w-full text-right pl-6 pr-2 py-1 rounded border border-gray-200 text-xs outline-none focus:border-blue-400"
                    />
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className={tab === 'ingresos' ? 'bg-blue-50 font-semibold' : 'bg-red-50 font-semibold'}>
            <td className={`px-4 py-2.5 ${tab === 'ingresos' ? 'text-blue-700' : 'text-red-700'}`}>Total</td>
            {totales.map((t, i) => (
              <td key={i} className={`px-2 py-2.5 text-right ${tab === 'ingresos' ? 'text-blue-700' : 'text-red-700'}`}>
                {simbolo}{t.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

// ─── AjusteModal ──────────────────────────────────────────────────────────────

interface AjusteProps {
  open: boolean
  escenario: Escenario
  onClose: () => void
  onAplicar: (changes: Partial<Escenario>) => Promise<void>
}

function AjusteModal({ open, escenario, onClose, onAplicar }: AjusteProps) {
  const [pctI, setPctI] = useState(0)
  const [pctE, setPctE] = useState(0)

  const aplicar = async () => {
    const applyPct = (montos: number[], pct: number) =>
      montos.map((m) => Math.round(m * (1 + pct / 100) * 100) / 100)

    await onAplicar({
      categoriasIngreso: escenario.categoriasIngreso.map((c) => ({ ...c, montos: applyPct(c.montos, pctI) })),
      categoriasEgreso: escenario.categoriasEgreso.map((c) => ({ ...c, montos: applyPct(c.montos, pctE) })),
    })
    setPctI(0)
    setPctE(0)
  }

  return (
    <Modal open={open} title={`Ajuste rapido: ${escenario.nombre}`} onClose={onClose}>
      <p className="text-sm text-gray-500 mb-4">
        Aplica un porcentaje de cambio a todos los montos. Usa valores negativos para reducir.
      </p>
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Ingresos (%)</label>
          <input
            type="number"
            step="0.1"
            value={pctI}
            onChange={(e) => setPctI(parseFloat(e.target.value) || 0)}
            placeholder="Ej: 20 para +20%, -10 para -10%"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
          {pctI !== 0 && (
            <p className="text-xs text-gray-400 mt-1">
              {pctI > 0 ? 'Aumenta' : 'Reduce'} todos los ingresos en {Math.abs(pctI)}%
            </p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Egresos (%)</label>
          <input
            type="number"
            step="0.1"
            value={pctE}
            onChange={(e) => setPctE(parseFloat(e.target.value) || 0)}
            placeholder="Ej: -15 para reducir egresos 15%"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
          {pctE !== 0 && (
            <p className="text-xs text-gray-400 mt-1">
              {pctE > 0 ? 'Aumenta' : 'Reduce'} todos los egresos en {Math.abs(pctE)}%
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-3 mt-5 justify-end">
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button onClick={aplicar} disabled={pctI === 0 && pctE === 0}>Aplicar ajuste</Button>
      </div>
    </Modal>
  )
}
