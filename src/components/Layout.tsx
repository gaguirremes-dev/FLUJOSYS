import type { ReactNode } from 'react'
import { useAlertasStore } from '../store/alertasStore'
import { useProyeccionesStore } from '../store/proyeccionesStore'
import { Badge } from './Badge'

type Seccion =
  | 'proyecciones'
  | 'config'
  | 'ingresos'
  | 'egresos'
  | 'financiamiento'
  | 'flujo'
  | 'simulacion'
  | 'alertas'
  | 'reportes'

interface NavItem {
  id: Seccion
  label: string
  icon: string
}

const NAV: NavItem[] = [
  { id: 'proyecciones', label: 'Proyecciones', icon: '📁' },
  { id: 'config', label: 'Configuracion', icon: '⚙️' },
  { id: 'ingresos', label: 'Ingresos', icon: '📈' },
  { id: 'egresos', label: 'Egresos', icon: '📉' },
  { id: 'financiamiento', label: 'Financiamiento', icon: '🏦' },
  { id: 'flujo', label: 'Flujo de Caja', icon: '💰' },
  { id: 'simulacion', label: 'Simulacion', icon: '🔮' },
  { id: 'alertas', label: 'Alertas', icon: '🔔' },
  { id: 'reportes', label: 'Reportes', icon: '📄' },
]

interface Props {
  seccionActiva: Seccion
  onNavegar: (s: Seccion) => void
  children: ReactNode
}

export function Layout({ seccionActiva, onNavegar, children }: Props) {
  const alertas = useAlertasStore((s) => s.alertas)
  const proyecciones = useProyeccionesStore((s) => s.proyecciones)
  const criticas = alertas.filter((a) => a.severidad === 'critica').length
  const totalAlertas = alertas.length

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-center">
          <img src="/logoflujosys.jpeg" alt="Flujosys" className="h-14 w-auto object-contain" />
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {NAV.map((item) => {
            const isActive = seccionActiva === item.id
            const isAlertas = item.id === 'alertas'
            const isProyecciones = item.id === 'proyecciones'
            return (
              <button
                key={item.id}
                onClick={() => onNavegar(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left
                  ${isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <span className="text-base">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {isAlertas && totalAlertas > 0 && (
                  <Badge count={criticas > 0 ? criticas : totalAlertas} variant={criticas > 0 ? 'danger' : 'warning'} />
                )}
                {isProyecciones && proyecciones.length > 0 && (
                  <Badge count={proyecciones.length} variant="neutral" />
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 space-y-0.5">
          <p className="text-[10px] text-gray-400 font-medium text-center">Autores</p>
          <p className="text-[9px] text-gray-400 text-center leading-tight">Giannier Aguirre Mestanza</p>
          <p className="text-[9px] text-gray-400 text-center leading-tight">MA Ing. Roberto Carlos Arteaga Lora</p>
          <p className="text-[9px] text-gray-400 text-center leading-tight">Dra. CPC. Giuliana Vilma Millones Orrego de Gastelo</p>
        </div>
      </aside>

      {/* Contenido */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6">{children}</div>
      </main>
    </div>
  )
}

export type { Seccion }
