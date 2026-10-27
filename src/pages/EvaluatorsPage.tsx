import { useCallback, useMemo, useState } from 'react'
import { EvaluatorsTable } from '@/features/evaluators/components/EvaluatorsTable'
import { EvaluatorsFilters } from '@/features/evaluators/components/EvaluatorsFilters'
import { EvaluatorFormModal } from '@/features/evaluators/components/EvaluatorFormModal'
import { useEvaluatorAccess, useEvaluatorMutations, useEvaluators } from '@/features/evaluators/hooks/useEvaluators'
import { INITIAL_EVALUATOR_FILTERS, filterEvaluators, isActiveEvaluator } from '@/features/evaluators/utils/evaluatorUtils'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/query-state'
import { MutationAlert } from '@/components/ui/mutation-alert'
import { PendingIntegrationNotice, ReadOnlyBadge } from '@/components/ui/pending-integration'
import { FeedbackMessage } from '@/components/ui/feedback-message'
import { distinctOptions } from '@/lib/format'
import type { Evaluator } from '@/features/evaluators/types/evaluators'

export function EvaluatorPage() {
  const access = useEvaluatorAccess()
  const { data, error, isLoading, reload } = useEvaluators(access.ownOnly)
  const { guardar, cambiarEstado } = useEvaluatorMutations(access)
  const [filters, setFilters] = useState(INITIAL_EVALUATOR_FILTERS)
  const [form, setForm] = useState<{ open: boolean; evaluator: Evaluator | null }>({ open: false, evaluator: null })
  const [notice, setNotice] = useState<string | null>(null)
  const readOnly = !access.canCreate && !access.canEdit

  const rows = useMemo(() => data ?? [], [data])
  const filtered = useMemo(() => filterEvaluators(rows, filters), [rows, filters])
  const estadoOptions = useMemo(() => distinctOptions(rows.map((row) => row.estado)), [rows])
  const registeredUserIds = useMemo(
    () => new Set(rows.flatMap((row) => (row.usuarioId ? [row.usuarioId] : []))),
    [rows]
  )

  const { reset: resetGuardar } = guardar
  const openForm = useCallback(
    (evaluator: Evaluator | null) => {
      resetGuardar()
      setNotice(null)
      setForm({ open: true, evaluator })
    },
    [resetGuardar]
  )
  const openCreate = useCallback(() => openForm(null), [openForm])

  const { run: runEstado } = cambiarEstado
  const toggleEstado = useCallback(
    async (evaluator: Evaluator) => {
      setNotice(null)
      if (!evaluator.updatedAt) return
      const estado = isActiveEvaluator(evaluator) ? 'inactivo' : 'activo'
      const result = await runEstado({ idEvaluador: evaluator.id, estado, updatedAtEsperado: evaluator.updatedAt })
      if (!result.success) return
      reload()
      setNotice(`El evaluador quedó ${estado}.`)
    },
    [runEstado, reload]
  )

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-slate-800">
        {access.ownOnly ? 'Mi perfil de evaluador' : 'Gestión de Evaluadores'}
        {readOnly && <ReadOnlyBadge />}
      </h1>

      {!readOnly && guardar.pendingBackend && (
        <PendingIntegrationNotice title="Gestión de evaluadores pendiente de backend">
          El listado es real. Registrar, editar y activar/desactivar requieren las RPC sigre_admin_guardar_evaluador y
          sigre_admin_cambiar_estado_evaluador. No se envía ninguna solicitud.
        </PendingIntegrationNotice>
      )}

      {!access.ownOnly && (
        <EvaluatorsFilters
          value={filters}
          onChange={setFilters}
          estadoOptions={estadoOptions}
          onCreate={access.canCreate ? openCreate : undefined}
        />
      )}

      {notice && <FeedbackMessage type="success" message={notice} />}
      <MutationAlert feedback={cambiarEstado} onReload={reload} />

      {isLoading && !data ? (
        <LoadingState message="Cargando evaluadores..." />
      ) : error ? (
        <ErrorState message="No fue posible cargar los evaluadores." detail={error} onRetry={reload} />
      ) : rows.length === 0 ? (
        <EmptyState
          message={access.ownOnly ? 'Tu usuario no tiene un perfil de evaluador registrado.' : 'No hay evaluadores registrados o visibles para tu usuario.'}
        />
      ) : (
        <EvaluatorsTable
          data={filtered}
          onEdit={access.canEdit ? openForm : undefined}
          onToggleEstado={access.canEdit ? (evaluator) => void toggleEstado(evaluator) : undefined}
        />
      )}

      <EvaluatorFormModal
        open={form.open}
        evaluator={form.evaluator}
        registeredUserIds={registeredUserIds}
        feedback={guardar}
        onSubmit={guardar.run}
        onClose={() => setForm({ open: false, evaluator: null })}
        onReload={reload}
      />
    </div>
  )
}
