import { useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useConfigStore } from '../../store/configStore'
import { useFinanciamientoStore } from '../../store/financiamientoStore'
import { useFlujoStore } from '../../store/flujoStore'
import { useAlertasStore } from '../../store/alertasStore'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
import { Input } from '../../components/Input'
import type { Moneda } from '../../types'

const simbolos: Record<Moneda, string> = { PEN: 'S/', USD: 'US$', EUR: '€' }

const schema = z.object({
  nombre: z.string().min(1, 'Requerido'),
  monto: z.coerce.number().positive('Debe ser mayor a 0'),
  tasaAnual: z.coerce.number().min(0, 'Mín. 0%').max(200, 'Máx. 200%'),
  numeroCuotas: z.coerce.number().int().min(1, 'Mín. 1'),
  periodoInicio: z.coerce.number().int().min(0, 'Mín. 0'),
})

type FormData = z.infer<typeof schema>

export function FinanciamientoModule() {
  const config = useConfigStore((s) => s.config)
  const { prestamos, agregarPrestamo, eliminarPrestamo, getTablaAmortizacion } = useFinanciamientoStore()
  const recalcularFlujo = useFlujoStore((s) => s.recalcular)
  const recalcularAlertas = useAlertasStore((s) => s.recalcular)
  const [showModal, setShowModal] = useState(false)
  const [tablaAbierta, setTablaAbierta] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: { nombre: '', monto: 0, tasaAnual: 0, numeroCuotas: 12, periodoInicio: 0 },
  })

  if (!config) return <p className="text-gray-500">Configura la proyección primero.</p>

  const simbolo = simbolos[config.moneda]
  const fmt = (n: number) => `${simbolo}${n.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`

  const onSubmit = async (data: FormData) => {
    const excede = data.periodoInicio + data.numeroCuotas > config.numeroPeriodos
    await agregarPrestamo(data)
    recalcularFlujo()
    recalcularAlertas()
    reset()
    setShowModal(false)
    if (excede) alert('Algunas cuotas de este préstamo exceden el horizonte de proyección. Amplía el número de períodos para verlas.')
  }

  const handleEliminar = async (id: string) => {
    await eliminarPrestamo(id)
    recalcularFlujo()
    recalcularAlertas()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Financiamiento</h2>
          <p className="text-sm text-gray-500 mt-1">Préstamos e impacto en el flujo de caja</p>
        </div>
        <Button onClick={() => setShowModal(true)}>+ Agregar préstamo</Button>
      </div>

      {prestamos.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
          <p className="text-gray-400 mb-3">No hay préstamos registrados</p>
          <Button size="sm" onClick={() => setShowModal(true)}>Registrar primer préstamo</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {prestamos.map((p) => {
            const tabla = getTablaAmortizacion(p.id, config.unidadPeriodo)
            const cuotaFija = tabla[0]?.cuotaTotal ?? 0
            const abierto = tablaAbierta === p.id
            return (
              <div key={p.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex gap-6">
                    <div>
                      <p className="font-medium text-gray-900">{p.nombre}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Inicio: período {p.periodoInicio + 1}</p>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-semibold text-gray-900">{fmt(p.monto)}</span>
                      <span className="text-gray-400 ml-1">monto</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-semibold text-gray-900">{p.tasaAnual}%</span>
                      <span className="text-gray-400 ml-1">TEA anual</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-semibold text-gray-900">{p.numeroCuotas}</span>
                      <span className="text-gray-400 ml-1">cuotas de {fmt(cuotaFija)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setTablaAbierta(abierto ? null : p.id)}>
                      {abierto ? 'Ocultar' : 'Ver tabla'}
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleEliminar(p.id)}>Eliminar</Button>
                  </div>
                </div>

                {abierto && (
                  <div className="border-t border-gray-100 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left px-4 py-2 text-gray-500">Cuota</th>
                          <th className="text-right px-3 py-2 text-gray-500">Cuota total</th>
                          <th className="text-right px-3 py-2 text-gray-500">Interés</th>
                          <th className="text-right px-3 py-2 text-gray-500">Capital</th>
                          <th className="text-right px-3 py-2 text-gray-500">Saldo pendiente</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tabla.map((c, i) => (
                          <tr key={i} className="border-b border-gray-100">
                            <td className="px-4 py-1.5 text-gray-600">{i + 1}</td>
                            <td className="px-3 py-1.5 text-right font-medium">{fmt(c.cuotaTotal)}</td>
                            <td className="px-3 py-1.5 text-right text-red-500">{fmt(c.interes)}</td>
                            <td className="px-3 py-1.5 text-right text-blue-600">{fmt(c.capital)}</td>
                            <td className="px-3 py-1.5 text-right text-gray-600">{fmt(c.saldoPendiente)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Modal open={showModal} title="Registrar préstamo" onClose={() => { setShowModal(false); reset() }}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <Input label="Nombre del préstamo" placeholder="Ej: Préstamo BCP" error={errors.nombre?.message} {...register('nombre')} />
          <Input label="Monto del préstamo" type="number" step="0.01" prefix={simbolo} error={errors.monto?.message} {...register('monto')} />
          <Input label="Tasa de interés anual (TEA %)" type="number" step="0.01" min={0} placeholder="0 para sin interés" error={errors.tasaAnual?.message} {...register('tasaAnual')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Número de cuotas" type="number" min={1} error={errors.numeroCuotas?.message} {...register('numeroCuotas')} />
            <Input label="Período de inicio (0 = inicio)" type="number" min={0} error={errors.periodoInicio?.message} {...register('periodoInicio')} />
          </div>
          <div className="flex gap-3 pt-2 justify-end">
            <Button type="button" variant="secondary" onClick={() => { setShowModal(false); reset() }}>Cancelar</Button>
            <Button type="submit">Registrar préstamo</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
