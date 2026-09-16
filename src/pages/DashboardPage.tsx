import { Users, Calendar, Target, FileBadge } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { StatCard } from '@/components/dashboard/StatCard'
import { ProjectsChart } from '@/components/dashboard/ProjectsChart'
import { FunnelPanel } from '@/components/dashboard/FunnelPanel'
import { AttentionTable } from '@/components/dashboard/AttentionTable'
import { statsData } from '@/features/dashboard/mocks/dashboardMocks'

export function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Hola {user?.email?.split('@')[0] ?? 'Usuario'}
        </h1>
        <p className="text-sm text-slate-500">¡Bienvenido al sistema de la ruta emprendedora!</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Emprendedores"
          value={statsData.totalEmprendedores.value}
          icon={Users}
          accentColor="blue"
          trend={statsData.totalEmprendedores.trend}
        />
        <StatCard
          title="Inscritos a Orientaciones"
          value={statsData.inscritosOrientaciones.value}
          icon={Calendar}
          accentColor="green"
          trend={statsData.inscritosOrientaciones.trend}
        />
        <StatCard
          title="Activos en Retos"
          value={statsData.activosRetos.value}
          icon={Target}
          accentColor="orange"
          trend={statsData.activosRetos.trend}
        />
        <StatCard
          title="Total Miniperfiles"
          value={statsData.totalMiniperfiles.value}
          icon={FileBadge}
          accentColor="red"
          trend={statsData.totalMiniperfiles.trend}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProjectsChart />
        </div>
        <FunnelPanel />
      </div>

      <AttentionTable />
    </div>
  )
}