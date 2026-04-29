import { useEffect, useState } from 'react'
import { Layout, type Seccion } from './components/Layout'
import { ConfigModule } from './modules/config/ConfigModule'
import { IngresosModule } from './modules/ingresos/IngresosModule'
import { EgresosModule } from './modules/egresos/EgresosModule'
import { FinanciamientoModule } from './modules/financiamiento/FinanciamientoModule'
import { FlujoCajaModule } from './modules/flujo-caja/FlujoCajaModule'
import { SimulacionModule } from './modules/simulacion/SimulacionModule'
import { AlertasModule } from './modules/alertas/AlertasModule'
import { ReportesModule } from './modules/reportes/ReportesModule'
import { useConfigStore } from './store/configStore'
import { useIngresosStore } from './store/ingresosStore'
import { useEgresosStore } from './store/egresosStore'
import { useFinanciamientoStore } from './store/financiamientoStore'
import { useSimulacionStore } from './store/simulacionStore'
import { useFlujoStore } from './store/flujoStore'
import { useAlertasStore } from './store/alertasStore'

export default function App() {
  const [seccion, setSeccion] = useState<Seccion>('config')
  const [listo, setListo] = useState(false)

  const cargarConfig = useConfigStore((s) => s.cargarConfig)
  const cargarIngresos = useIngresosStore((s) => s.cargar)
  const cargarEgresos = useEgresosStore((s) => s.cargar)
  const cargarFinanciamiento = useFinanciamientoStore((s) => s.cargar)
  const cargarSimulacion = useSimulacionStore((s) => s.cargar)
  const recalcularFlujo = useFlujoStore((s) => s.recalcular)
  const recalcularAlertas = useAlertasStore((s) => s.recalcular)

  useEffect(() => {
    async function init() {
      await cargarConfig()
      await Promise.all([cargarIngresos(), cargarEgresos(), cargarFinanciamiento(), cargarSimulacion()])
      recalcularFlujo()
      recalcularAlertas()
      setListo(true)
    }
    init()
  }, [])

  if (!listo) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-3xl mb-3">💰</div>
          <p className="text-gray-500 text-sm">Cargando Flujosys...</p>
        </div>
      </div>
    )
  }

  const modulos: Record<Seccion, React.ReactElement> = {
    config: <ConfigModule />,
    ingresos: <IngresosModule />,
    egresos: <EgresosModule />,
    financiamiento: <FinanciamientoModule />,
    flujo: <FlujoCajaModule />,
    simulacion: <SimulacionModule />,
    alertas: <AlertasModule />,
    reportes: <ReportesModule />,
  }

  return (
    <Layout seccionActiva={seccion} onNavegar={setSeccion}>
      {modulos[seccion]}
    </Layout>
  )
}
