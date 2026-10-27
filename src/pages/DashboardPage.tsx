import { useAuth } from '@/features/auth/context/AuthContext'
import { useAccessControl } from '@/features/access-control/hooks/useAccessControl'
import { MetricCard } from '@/components/ui/metric-card'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/query-state'
import { ProjectsChart } from '@/features/dashboard/components/ProjectsChart'
import { FunnelCard } from '@/features/dashboard/components/FunnelPanel'
import { AttentionTable } from '@/features/dashboard/components/AttentionTable'
import { useDashboard, type DashboardSection } from '@/features/dashboard/hooks/useDashboard'
import { panelSubtitle } from '@/features/dashboard/utils/dashboardUtils'
import type { ReactNode } from 'react'

function SectionState<T>({
  section,
  label,
  children,
}: {
  section: DashboardSection<T>
  label: string
  children: (data: T) => ReactNode
}) {
  if (section.error) return <ErrorState message={`No fue posible cargar ${label}.`} detail={section.error} />
  if (!section.data) return <LoadingState message={`Cargando ${label}...`} />
  return <>{children(section.data)}</>
}

export function DashboardPage() {
  const { user } = useAuth()
  const access = useAccessControl()
  const dashboard = useDashboard()
  const rawName = user?.email?.split('@')[0] ?? 'Usuario';
  const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
  const { scope, year, indicators, timeline, funnel, attention, failures } = dashboard

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
          Hola {formattedName}
        </h1>
        <p className="text-sm md:text-base font-normal text-slate-500">
          ¡Bienvenido al sistema de la ruta emprendedora!
        </p>
      </div>

      {access.isLoading ? (
        <LoadingState message="Verificando permisos..." />
      ) : access.error ? (
        <ErrorState message="No fue posible verificar tus permisos." detail={access.error} onRetry={() => void access.refreshPermissions()} />
      ) : !scope || indicators.length === 0 ? (
        <EmptyState message="Tu rol no tiene indicadores disponibles en el panel." />
      ) : (
        <>
          {failures.map((failure) => (
            <ErrorState
              key={failure.id}
              message={`No fue posible cargar la información de ${failure.label}.`}
              detail={failure.error}
              onRetry={failure.reload}
            />
          ))}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {indicators.map((indicator) => (
              <MetricCard
                key={indicator.id}
                title={indicator.title}
                value={indicator.value}
                icon={indicator.icon}
                tone={indicator.tone}
                hint={indicator.hint}
              />
            ))}
          </div>

          {(timeline.data || timeline.isLoading || timeline.error) && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <SectionState section={timeline} label="la evolución mensual">
                  {(data) => <ProjectsChart title={timeline.title} subtitle={panelSubtitle(scope, year)} data={data} />}
                </SectionState>
              </div>
              <SectionState section={funnel} label="la distribución">
                {(data) => <FunnelCard title={funnel.title} subtitle={panelSubtitle(scope, year)} data={data} />}
              </SectionState>
            </div>
          )}

          {(attention.data || attention.isLoading || attention.error) && (
            <SectionState section={attention} label="los proyectos que requieren atención">
              {(data) => <AttentionTable subtitle="Entregas de retos vencidas sin sustentación y pitch activos sin el mínimo de evaluadores" rows={data} />}
            </SectionState>
          )}
        </>
      )}
    </div>
  )
}
