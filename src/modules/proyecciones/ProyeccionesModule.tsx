import { useState } from 'react'
import { useProyeccionesStore } from '../../store/proyeccionesStore'
import { useConfigStore } from '../../store/configStore'
import { useIngresosStore } from '../../store/ingresosStore'
import { useEgresosStore } from '../../store/egresosStore'
import { useFinanciamientoStore } from '../../store/financiamientoStore'
import { useFlujoStore } from '../../store/flujoStore'
import { useAlertasStore } from '../../store/alertasStore'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
import type { Seccion } from '../../components/Layout'
import type { Moneda } from '../../types'

const simbolos: Record<Moneda, string> = { PEN: 'S/', USD: 'US$', EUR: '€' }
const UNIDAD_LABEL: Record<string, string> = { dia: 'día', semana: 'semana', mes: 'mes', año: 'año' }

interface Props {
  onNavegar: (s: Seccion) => void
}

export function ProyeccionesModule({ onNavegar }: Props) {
  const { proyecciones, guardarActual, cargarProyeccion, eliminarProyeccion } = useProyeccionesStore()
  const { resetear } = useConfigStore()
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [confirmLoad, setConfirmLoad] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [maxError, setMaxError] = useState(false)
  const [confirmNew, setConfirmNew] = useState(false)

  const handleGuardar = async () => {
    setSaving(true)
    const result = await guardarActual()
    setSaving(false)
    if (result === 'max') setMaxError(true)
  }

  const handleCargar = async (id: string) => {
    await cargarProyeccion(id)
    setConfirmLoad(null)
    onNavegar('config')
  }

  const handleNueva = async () => {
    setConfirmNew(false)
    await resetear()
    await useIngresosStore.getState().cargar()
    await useEgresosStore.getState().cargar()
    await useFinanciamientoStore.getState().cargar()
    useFlujoStore.getState().recalcular()
    useAlertasStore.getState().recalcular()
    onNavegar('config')
  }

  const confirmToLoad = confirmLoad ? proyecciones.find((p) => p.id === confirmLoad) : null

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Mis proyecciones</h2>
          <p className="text-sm text-gray-500 mt-1">
            {proyecciones.length} de 12 guardadas
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleGuardar} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar proyeccion actual'}
          </Button>
          <Button onClick={() => setConfirmNew(true)}>
            + Nueva proyeccion
          </Button>
        </div>
      </div>

      {proyecciones.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-400 text-sm mb-1">No hay proyecciones guardadas</p>
          <p className="text-gray-400 text-xs mb-4">
            Configura tu proyeccion y presiona "Guardar proyeccion actual"
          </p>
          <Button size="sm" onClick={handleGuardar} disabled={saving}>
            Guardar la actual
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {proyecciones.map((p) => {
            const saldoInicial = p.snapshot.config.saldoInicial
            const simbolo = simbolos[p.moneda]
            const unidad = UNIDAD_LABEL[p.snapshot.config.unidadPeriodo] ?? p.snapshot.config.unidadPeriodo
            const fecha = new Date(p.actualizadoEn).toLocaleDateString('es-PE', {
              day: '2-digit', month: 'short', year: 'numeric',
            })
            return (
              <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3 hover:border-blue-300 transition-colors">
                <div>
                  <h3 className="font-semibold text-gray-900 truncate">{p.nombre}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Actualizado: {fecha}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-50 rounded-lg px-3 py-2">
                    <p className="text-gray-400">Moneda</p>
                    <p className="font-medium text-gray-700">{p.moneda} ({simbolo})</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg px-3 py-2">
                    <p className="text-gray-400">Periodos</p>
                    <p className="font-medium text-gray-700">{p.numeroPeriodos} {unidad}s</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg px-3 py-2">
                    <p className="text-gray-400">Saldo inicial</p>
                    <p className="font-medium text-gray-700">{simbolo}{saldoInicial.toLocaleString('es-PE')}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg px-3 py-2">
                    <p className="text-gray-400">Categorias</p>
                    <p className="font-medium text-gray-700">
                      {p.snapshot.categoriasIngreso.length}I / {p.snapshot.categoriasEgreso.length}E
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setConfirmLoad(p.id)}
                    className="flex-1"
                  >
                    Abrir
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setConfirmDelete(p.id)}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            )
          })}

          {proyecciones.length < 12 && (
            <button
              onClick={() => setConfirmNew(true)}
              className="bg-white rounded-xl border border-dashed border-gray-300 p-5 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors min-h-44"
            >
              <span className="text-2xl">+</span>
              <span className="text-sm">Nueva proyeccion</span>
            </button>
          )}
        </div>
      )}

      {/* Modal: confirmar cargar */}
      <Modal
        open={!!confirmLoad}
        title="Abrir proyeccion"
        onClose={() => setConfirmLoad(null)}
      >
        <p className="text-sm text-gray-600 mb-4">
          Se cargara <span className="font-semibold">{confirmToLoad?.nombre}</span>. Los datos del espacio de trabajo actual se reemplazaran. Los escenarios de simulacion no se veran afectados.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setConfirmLoad(null)}>Cancelar</Button>
          <Button onClick={() => confirmLoad && handleCargar(confirmLoad)}>Abrir</Button>
        </div>
      </Modal>

      {/* Modal: confirmar eliminar */}
      <Modal
        open={!!confirmDelete}
        title="Eliminar proyeccion"
        onClose={() => setConfirmDelete(null)}
      >
        <p className="text-sm text-gray-600 mb-4">
          Esta accion no se puede deshacer. Los datos de la proyeccion se eliminaran permanentemente.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
          <Button
            variant="danger"
            onClick={async () => {
              if (confirmDelete) await eliminarProyeccion(confirmDelete)
              setConfirmDelete(null)
            }}
          >
            Eliminar
          </Button>
        </div>
      </Modal>

      {/* Modal: max proyecciones */}
      <Modal
        open={maxError}
        title="Limite alcanzado"
        onClose={() => setMaxError(false)}
      >
        <p className="text-sm text-gray-600 mb-4">
          Ya tienes 12 proyecciones guardadas, que es el maximo permitido. Elimina alguna para poder guardar una nueva.
        </p>
        <div className="flex justify-end">
          <Button onClick={() => setMaxError(false)}>Entendido</Button>
        </div>
      </Modal>

      {/* Modal: confirmar nueva proyeccion */}
      <Modal
        open={confirmNew}
        title="Nueva proyeccion"
        onClose={() => setConfirmNew(false)}
      >
        <p className="text-sm text-gray-600 mb-4">
          Se limpiara el espacio de trabajo actual para comenzar una nueva proyeccion. Asegurate de haber guardado la proyeccion actual si quieres conservarla.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setConfirmNew(false)}>Cancelar</Button>
          <Button onClick={handleNueva}>Comenzar nueva</Button>
        </div>
      </Modal>
    </div>
  )
}
