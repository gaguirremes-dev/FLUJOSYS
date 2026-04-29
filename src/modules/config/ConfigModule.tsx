import { useEffect, useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useConfigStore } from '../../store/configStore'
import { useIngresosStore } from '../../store/ingresosStore'
import { useEgresosStore } from '../../store/egresosStore'
import { useFinanciamientoStore } from '../../store/financiamientoStore'
import { useFlujoStore } from '../../store/flujoStore'
import { useAlertasStore } from '../../store/alertasStore'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { Modal } from '../../components/Modal'
import type { Moneda, UnidadPeriodo } from '../../types'

const schema = z.object({
  nombreEmpresa: z.string().min(1, 'Requerido'),
  moneda: z.enum(['PEN', 'USD', 'EUR']),
  unidadPeriodo: z.enum(['dia', 'semana', 'mes', 'año']),
  numeroPeriodos: z.coerce.number().int().min(1, 'Mín. 1').max(120, 'Máx. 120'),
  saldoInicial: z.coerce.number(),
  umbralSaldoMinimo: z.coerce.number().min(0).optional(),
})

type FormData = z.infer<typeof schema>

export function ConfigModule() {
  const { config, actualizarConfig, resetear } = useConfigStore()
  const recalcularFlujo = useFlujoStore((s) => s.recalcular)
  const recalcularAlertas = useAlertasStore((s) => s.recalcular)
  const redimensionarIngresos = useIngresosStore((s) => s.redimensionar)
  const redimensionarEgresos = useEgresosStore((s) => s.redimensionar)
  const [showResetModal, setShowResetModal] = useState(false)
  const [showUnidadModal, setShowUnidadModal] = useState(false)
  const [pendingUnidad, setPendingUnidad] = useState<UnidadPeriodo | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | undefined>(config?.logoBase64)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: {
      nombreEmpresa: config?.nombreEmpresa ?? 'Mi Empresa',
      moneda: (config?.moneda ?? 'PEN') as Moneda,
      unidadPeriodo: (config?.unidadPeriodo ?? 'mes') as UnidadPeriodo,
      numeroPeriodos: config?.numeroPeriodos ?? 12,
      saldoInicial: config?.saldoInicial ?? 0,
      umbralSaldoMinimo: config?.umbralSaldoMinimo,
    },
  })

  useEffect(() => {
    if (config) {
      reset({
        nombreEmpresa: config.nombreEmpresa,
        moneda: config.moneda,
        unidadPeriodo: config.unidadPeriodo,
        numeroPeriodos: config.numeroPeriodos,
        saldoInicial: config.saldoInicial,
        umbralSaldoMinimo: config.umbralSaldoMinimo,
      })
      setLogoPreview(config.logoBase64)
    }
  }, [config, reset])

  const onSubmit = async (data: FormData) => {
    const unidadCambio = config && data.unidadPeriodo !== config.unidadPeriodo
    const periodosCambio = config && data.numeroPeriodos !== config.numeroPeriodos

    if (unidadCambio) {
      setPendingUnidad(data.unidadPeriodo as UnidadPeriodo)
      setShowUnidadModal(true)
      return
    }

    await actualizarConfig({ ...data, logoBase64: logoPreview })

    if (periodosCambio) {
      await redimensionarIngresos(data.numeroPeriodos)
      await redimensionarEgresos(data.numeroPeriodos)
    }

    recalcularFlujo()
    recalcularAlertas()
  }

  const handleConfirmarUnidad = async () => {
    setShowUnidadModal(false)
    const values = { ...useConfigStore.getState().config! }
    const form = document.querySelector('form')
    const fd = new FormData(form!)
    const numeroPeriodos = Number(fd.get('numeroPeriodos')) || 12

    await actualizarConfig({ unidadPeriodo: pendingUnidad!, numeroPeriodos, logoBase64: logoPreview })
    await redimensionarIngresos(0)
    await redimensionarEgresos(0)

    // Refill con nueva longitud
    await redimensionarIngresos(numeroPeriodos)
    await redimensionarEgresos(numeroPeriodos)

    recalcularFlujo()
    recalcularAlertas()
    setPendingUnidad(null)
    void values
  }

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 500 * 1024) {
      alert('El logo no debe superar 500KB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setLogoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleReset = async () => {
    setShowResetModal(false)
    await resetear()
    await useIngresosStore.getState().cargar()
    await useEgresosStore.getState().cargar()
    await useFinanciamientoStore.getState().cargar()
    recalcularFlujo()
    recalcularAlertas()
    setLogoPreview(undefined)
  }

  const simbolos: Record<Moneda, string> = { PEN: 'S/', USD: 'US$', EUR: '€' }

  return (
    <div className="max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Configuración</h2>
          <p className="text-sm text-gray-500 mt-1">Define los parámetros de tu proyección financiera</p>
        </div>
        <Button variant="danger" size="sm" onClick={() => setShowResetModal(true)}>
          Nueva proyección
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h3 className="font-medium text-gray-800">Datos de la empresa</h3>
          <Input label="Nombre de la empresa" error={errors.nombreEmpresa?.message} {...register('nombreEmpresa')} />

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Moneda</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" {...register('moneda')}>
              <option value="PEN">PEN — Sol peruano (S/)</option>
              <option value="USD">USD — Dólar americano (US$)</option>
              <option value="EUR">EUR — Euro (€)</option>
            </select>
          </div>

          {/* Logo */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Logo de la empresa (opcional)</label>
            <div className="flex items-center gap-4">
              {logoPreview && (
                <img src={logoPreview} alt="Logo" className="h-12 w-auto object-contain border rounded p-1" />
              )}
              <input type="file" accept="image/png,image/jpeg" onChange={handleLogo} className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              {logoPreview && (
                <button type="button" onClick={() => setLogoPreview(undefined)} className="text-xs text-red-500 hover:underline">
                  Eliminar
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">PNG o JPG, máximo 500KB</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h3 className="font-medium text-gray-800">Parámetros de proyección</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Unidad de período</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" {...register('unidadPeriodo')}>
                <option value="dia">Días</option>
                <option value="semana">Semanas</option>
                <option value="mes">Meses</option>
                <option value="año">Años</option>
              </select>
            </div>
            <Input
              label="Número de períodos"
              type="number"
              min={1}
              max={120}
              error={errors.numeroPeriodos?.message}
              {...register('numeroPeriodos')}
            />
          </div>

          <Input
            label="Saldo inicial de caja"
            type="number"
            step="0.01"
            prefix={config ? simbolos[config.moneda] : 'S/'}
            error={errors.saldoInicial?.message}
            {...register('saldoInicial')}
          />

          <Input
            label="Saldo mínimo aceptable (opcional)"
            type="number"
            step="0.01"
            min={0}
            prefix={config ? simbolos[config.moneda] : 'S/'}
            placeholder="Alerta cuando el saldo baje de este valor"
            {...register('umbralSaldoMinimo')}
          />
        </div>

        <Button type="submit" className="w-full">Guardar configuración</Button>
      </form>

      {/* Modal cambio de unidad */}
      <Modal open={showUnidadModal} title="Cambiar unidad de período" onClose={() => setShowUnidadModal(false)}>
        <p className="text-sm text-gray-600 mb-4">
          Cambiar la unidad de período borrará todos los montos de ingresos y egresos ingresados. La estructura de categorías se conserva.
        </p>
        <p className="text-sm font-medium text-red-600 mb-5">¿Deseas continuar?</p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setShowUnidadModal(false)}>Cancelar</Button>
          <Button variant="danger" onClick={handleConfirmarUnidad}>Sí, cambiar unidad</Button>
        </div>
      </Modal>

      {/* Modal reset */}
      <Modal open={showResetModal} title="Nueva proyección" onClose={() => setShowResetModal(false)}>
        <p className="text-sm text-gray-600 mb-4">
          Esto eliminará todos los datos ingresados: ingresos, egresos, préstamos y escenarios. La acción no se puede deshacer.
        </p>
        <p className="text-sm font-medium text-red-600 mb-5">¿Estás seguro?</p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setShowResetModal(false)}>Cancelar</Button>
          <Button variant="danger" onClick={handleReset}>Sí, empezar de cero</Button>
        </div>
      </Modal>
    </div>
  )
}
