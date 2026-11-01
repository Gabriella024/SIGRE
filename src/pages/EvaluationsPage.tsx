import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EvaluationTabs } from '@/features/evaluations/components/EvaluationTabs'
import { EvaluationSummaryBar } from '@/features/evaluations/components/EvaluationSummaryBar'
import { EvaluationCard } from '@/features/evaluations/components/EvaluationCard'
import { ResultTable } from '@/features/evaluations/components/ResultTable'
import { ResultFilters } from '@/features/evaluations/components/ResultFilters'
import { ResultsSummaryPills } from '@/features/evaluations/components/ResultsSumaryPills'
import { GradeModal } from '@/features/evaluations/components/GradeModal'
import {
  useConsolidatedResults,
  useEvaluationAccess,
  useGradeMutation,
  useMyEvaluations,
} from '@/features/evaluations/hooks/useEvaluations'
import { APPROVAL_RULE_PENDING_MESSAGE, INITIAL_RESULT_FILTERS, filterResults } from '@/features/evaluations/utils/evaluationUtils'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/query-state'
import { PendingIntegrationNotice } from '@/components/ui/pending-integration'
import { FeedbackMessage } from '@/components/ui/feedback-message'
import { PageHeader } from '@/components/ui/page-header'
import { ENTREPRENEUR_RESULT_COLUMNS } from '@/features/evaluations/resultadosColumns'
import type { Evaluacion } from '@/features/evaluations/types/evaluacion'
import type { EvaluationResults } from '@/features/evaluations/types/resultado'

function EvaluatorAssignments() {
  const access = useEvaluationAccess()
  const { data, error, isLoading, reload } = useMyEvaluations(true)
  const grade = useGradeMutation(access.canGrade)
  const [selected, setSelected] = useState<Evaluacion | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const rows = data ?? []

  const { reset } = grade
  const openGrade = useCallback(
    (evaluacion: Evaluacion) => {
      reset()
      setNotice(null)
      setSelected(evaluacion)
    },
    [reset]
  )

  const saved = useCallback(() => {
    reload()
    setNotice('La calificación se registró correctamente.')
  }, [reload])

  return (
    <div className="space-y-4">
      {access.canGrade && grade.pendingBackend && (
        <PendingIntegrationNotice title="Calificación pendiente de backend">
          Tus pitch asignados son reales. Registrar la calificación requiere la RPC sigre_evaluador_registrar_calificacion. No se envía ninguna solicitud.
        </PendingIntegrationNotice>
      )}
      {notice && <FeedbackMessage type="success" message={notice} />}

      {isLoading && !data ? (
        <LoadingState message="Cargando tus pitch asignados..." />
      ) : error ? (
        <ErrorState message="No fue posible cargar tus asignaciones." detail={error} onRetry={reload} />
      ) : rows.length === 0 ? (
        <EmptyState message="No tienes pitch asignados para evaluar." />
      ) : (
        <>
          <EvaluationSummaryBar
            asignados={rows.length}
            sinAsignar={0}
            completados={rows.filter((row) => row.estado === 'Completado').length}
            pendientes={rows.filter((row) => row.estado === 'Pendiente').length}
          />
          <div className="space-y-3">
            {rows.map((evaluacion) => (
              <EvaluationCard key={evaluacion.id} evaluacion={evaluacion} onGrade={access.canGrade ? openGrade : undefined} />
            ))}
          </div>
        </>
      )}

      <GradeModal evaluacion={selected} mutation={grade} onClose={() => setSelected(null)} onSaved={saved} />
    </div>
  )
}

function AdminAssignments({ rows, onAssign }: { rows: EvaluationResults[]; onAssign?: () => void }) {
  const asignados = rows.filter((row) => row.asignados > 0)
  return (
    <div className="space-y-4">
      <EvaluationSummaryBar
        asignados={asignados.length}
        sinAsignar={rows.length - asignados.length}
        completados={asignados.filter((row) => row.resultado !== 'En revisión').length}
        pendientes={asignados.filter((row) => row.resultado === 'En revisión').length}
        onAssign={onAssign}
      />
      <ResultTable data={rows} />
    </div>
  )
}

function EntrepreneurResults({ rows }: { rows: EvaluationResults[] }) {
  return (
    <div className="space-y-4">
      <PendingIntegrationNotice title="Resultado final en definición">{APPROVAL_RULE_PENDING_MESSAGE}</PendingIntegrationNotice>
      <ResultTable data={rows} columns={ENTREPRENEUR_RESULT_COLUMNS} />
    </div>
  )
}

const PAGE_COPY = {
  evaluador: { title: 'Mis evaluaciones', description: 'Pitch asignados para tu calificación.' },
  emprendedor: { title: 'Evaluación de mi pitch', description: 'Calificaciones registradas por el panel evaluador de tu pitch.' },
  gestion: { title: 'Gestión de Evaluaciones', description: 'Asignaciones y resultados consolidados de las calificaciones.' },
}

export function EvaluationsPage() {
  const access = useEvaluationAccess()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('asignaciones')
  const [filters, setFilters] = useState(INITIAL_RESULT_FILTERS)
  const results = useConsolidatedResults(access.canViewResults)
  const rows = useMemo(() => results.data ?? [], [results.data])
  const filtered = useMemo(() => filterResults(rows, filters), [rows, filters])
  const tab = access.canViewResults ? activeTab : 'asignaciones'
  const copy = access.evaluatorScoped ? PAGE_COPY.evaluador : access.entrepreneurScoped ? PAGE_COPY.emprendedor : PAGE_COPY.gestion

  return (
    <div className="space-y-6">
      <PageHeader title={copy.title} description={copy.description} />

      {!access.entrepreneurScoped && (
        <EvaluationTabs activeTab={tab} onTabChange={setActiveTab} showResults={access.canViewResults} />
      )}

      {access.evaluatorScoped ? (
        <EvaluatorAssignments />
      ) : !access.canViewResults ? (
        <EmptyState message="Tu rol no tiene acceso a las evaluaciones." />
      ) : results.isLoading && !results.data ? (
        <LoadingState message="Cargando evaluaciones..." />
      ) : results.error ? (
        <ErrorState message="No fue posible cargar las evaluaciones." detail={results.error} onRetry={results.reload} />
      ) : rows.length === 0 ? (
        <EmptyState message={access.entrepreneurScoped ? 'Tu pitch aún no tiene calificaciones registradas.' : 'No hay pitch registrados o visibles para tu usuario.'} />
      ) : access.entrepreneurScoped ? (
        <EntrepreneurResults rows={rows} />
      ) : tab === 'asignaciones' ? (
        <AdminAssignments rows={rows} onAssign={access.canManageAssignments ? () => navigate('/pitch') : undefined} />
      ) : (
        <div className="space-y-4">
          <PendingIntegrationNotice title="Regla de aprobación pendiente de confirmación">
            {APPROVAL_RULE_PENDING_MESSAGE}
          </PendingIntegrationNotice>
          <ResultsSummaryPills resultados={rows} />
          <ResultFilters value={filters} onChange={setFilters} />
          <ResultTable data={filtered} />
        </div>
      )}
    </div>
  )
}
