import {
  AlertCircle,
  CalendarCheck,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Clock,
  FileSearch,
  Hourglass,
  Loader2,
  Presentation,
  Sparkles,
  Target,
  UserCheck,
  Users,
  type LucideIcon,
} from 'lucide-react'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { useAccessControl } from '@/features/access-control/hooks/useAccessControl'
import { MetricCard } from '@/components/ui/metric-card'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/query-state'
import { SectionCard } from '@/components/ui/section-card'
import {
  AgendaList,
  AlertList,
  Checklist,
  DistributionList,
  MonthlyChart,
  ProgressList,
  ProjectOverview,
  StepsList,
} from '@/features/dashboard/components/DashboardWidgets'
import { SOURCE_LABELS, useDashboard, type SourceStatusMap } from '@/features/dashboard/hooks/useDashboard'
import type { DashboardSectionModel, KpiIcon, KpiItem, SectionSpan, SourceId } from '@/features/dashboard/types/dashboard'
import { cn } from '@/lib/utils'

const KPI_ICONS: Record<KpiIcon, LucideIcon> = {
  users: Users,
  projects: Presentation,
  calendar: CalendarDays,
  attendance: CalendarCheck,
  target: Target,
  review: FileSearch,
  pitch: Sparkles,
  evaluation: ClipboardCheck,
  pending: Hourglass,
  clock: Clock,
  userCheck: UserCheck,
  orientador: ClipboardList,
}

const SPAN_CLASSES: Record<SectionSpan, string> = {
  narrow: '',
  wide: 'lg:col-span-2',
  full: 'lg:col-span-3',
}

function kpiGridClass(count: number): string {
  if (count % 4 === 0) return 'sm:grid-cols-2 xl:grid-cols-4'
  if (count === 5) return 'sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 sm:[&>*:last-child]:col-span-2 2xl:[&>*:last-child]:col-span-1'
  return 'sm:grid-cols-2 lg:grid-cols-3'
}

function depsState(deps: readonly SourceId[], status: SourceStatusMap) {
  const failed = deps.find((dep) => status[dep]?.error)
  return {
    loading: deps.some((dep) => status[dep]?.isLoading),
    failed: failed ? { id: failed, reload: status[failed]?.reload } : null,
  }
}

function KpiCard({ kpi, status }: { kpi: KpiItem; status: SourceStatusMap }) {
  const { loading, failed } = depsState(kpi.deps, status)
  const ready = !loading && !failed
  return (
    <MetricCard
      title={kpi.title}
      value={ready ? kpi.value : null}
      icon={KPI_ICONS[kpi.icon]}
      tone={kpi.tone}
      hint={failed ? 'No disponible' : loading ? 'Cargando...' : (kpi.hint ?? undefined)}
    />
  )
}

function SectionBody({ section }: { section: DashboardSectionModel }) {
  switch (section.kind) {
    case 'monthly':
      return <MonthlyChart series={section.series} data={section.data} />
    case 'distribution':
      return <DistributionList items={section.items} emptyMessage={section.emptyMessage} />
    case 'agenda':
      return <AgendaList items={section.items} emptyMessage={section.emptyMessage} />
    case 'alerts':
      return <AlertList items={section.items} emptyMessage={section.emptyMessage} />
    case 'progress':
      return <ProgressList items={section.items} emptyMessage={section.emptyMessage} />
    case 'checklist':
      return <Checklist items={section.items} done={section.done} emptyMessage={section.emptyMessage} />
    case 'steps':
      return <StepsList items={section.items} />
    case 'project':
      return <ProjectOverview project={section.project} pitch={section.pitch} showPitch={section.showPitch} />
  }
}

function DashboardSection({ section, status }: { section: DashboardSectionModel; status: SourceStatusMap }) {
  const { loading, failed } = depsState(section.deps, status)
  return (
    <SectionCard title={section.title} description={section.description} className={cn('h-full', SPAN_CLASSES[section.span])}>
      {failed ? (
        <div role="alert" className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-xl bg-rose-50 px-4 py-6 text-center text-sm text-rose-800 ring-1 ring-inset ring-rose-100">
          <AlertCircle className="h-5 w-5 stroke-[1.75]" aria-hidden="true" />
          No fue posible cargar la información de {SOURCE_LABELS[failed.id]}.
          {failed.reload && (
            <button type="button" onClick={failed.reload} className="text-xs font-semibold text-rose-700 underline underline-offset-2 hover:text-rose-900">
              Reintentar
            </button>
          )}
        </div>
      ) : loading ? (
        <div role="status" className="flex min-h-32 items-center justify-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-brand-600" aria-hidden="true" />
          Cargando...
        </div>
      ) : (
        <SectionBody section={section} />
      )}
    </SectionCard>
  )
}

export function DashboardPage() {
  const { user } = useAuth()
  const access = useAccessControl()
  const { model, status, failures } = useDashboard()
  const rawName = user?.email?.split('@')[0] ?? 'Usuario'
  const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase()
  const today = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())
  const isEmpty = !model || (model.kpis.length === 0 && model.sections.length === 0)

  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        eyebrow={today}
        title={`Hola, ${formattedName}`}
        description={model?.description ?? 'Este es el resumen de la ruta emprendedora.'}
      />

      {access.isLoading ? (
        <LoadingState message="Verificando permisos..." />
      ) : access.error ? (
        <ErrorState message="No fue posible verificar tus permisos." detail={access.error} onRetry={() => void access.refreshPermissions()} />
      ) : isEmpty ? (
        <EmptyState message="Tu rol no tiene indicadores disponibles en el panel." />
      ) : (
        <>
          {failures.length > 0 && (
            <ErrorState
              message={`No fue posible cargar: ${failures.map((failure) => SOURCE_LABELS[failure.id]).join(', ')}.`}
              detail={failures[0].error}
              onRetry={() => failures.forEach((failure) => failure.reload())}
            />
          )}

          {model.kpis.length > 0 && (
            <div className={cn('grid grid-cols-1 gap-4', kpiGridClass(model.kpis.length))}>
              {model.kpis.map((kpi) => (
                <KpiCard key={kpi.id} kpi={kpi} status={status} />
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {model.sections.map((section) => (
              <DashboardSection key={section.id} section={section} status={status} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
