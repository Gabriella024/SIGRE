import { useCallback, useMemo, useState } from 'react'
import { ChallengesTable } from '@/features/challenges/components/ChallengesTable'
import { ChallengesFilters } from '@/features/challenges/components/ChallengesFilters'
import { ChallengeFormModal } from '@/features/challenges/components/ChallengeFormModal'
import { ChallengeDetailModal } from '@/features/challenges/components/ChallengeDetailModal'
import { useChallengeAccess, useChallengeMutations, useChallenges } from '@/features/challenges/hooks/useChallenges'
import { INITIAL_CHALLENGE_FILTERS, filterChallenges } from '@/features/challenges/utils/challengeUtils'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/query-state'
import { PendingIntegrationNotice, ReadOnlyBadge } from '@/components/ui/pending-integration'
import { distinctOptions } from '@/lib/format'
import type { Challenge } from '@/features/challenges/types/Challenge'

export function ChallengesPage() {
  const { data, error, isLoading, reload } = useChallenges()
  const access = useChallengeAccess()
  const { guardar, cambiarEstado, asignarProyecto } = useChallengeMutations(access)
  const [filters, setFilters] = useState(INITIAL_CHALLENGE_FILTERS)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [form, setForm] = useState<{ open: boolean; challenge: Challenge | null }>({ open: false, challenge: null })
  const readOnly = !access.canCreate && !access.canEdit

  const rows = useMemo(() => data ?? [], [data])
  const filtered = useMemo(() => filterChallenges(rows, filters), [rows, filters])
  const niveles = useMemo(
    () => [...new Set(rows.map((row) => row.nivel))].sort((a, b) => a.localeCompare(b, 'es', { numeric: true })),
    [rows]
  )
  const estadoOptions = useMemo(() => distinctOptions(rows.map((row) => row.estado)), [rows])
  const detail = rows.find((row) => row.id === detailId) ?? null

  const { reset: resetGuardar } = guardar
  const openCreate = useCallback(() => {
    resetGuardar()
    setForm({ open: true, challenge: null })
  }, [resetGuardar])
  const openEdit = useCallback(
    (challenge: Challenge) => {
      resetGuardar()
      setForm({ open: true, challenge })
    },
    [resetGuardar]
  )
  const openDetail = useCallback((challenge: Challenge) => setDetailId(challenge.id), [])
  const { reset: resetEstado } = cambiarEstado
  const { reset: resetAsignar } = asignarProyecto
  const closeDetail = useCallback(() => {
    resetEstado()
    resetAsignar()
    setDetailId(null)
  }, [resetEstado, resetAsignar])

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">
        Gestión de Retos
        {readOnly && <ReadOnlyBadge />}
      </h1>

      {!readOnly && guardar.pendingBackend && (
        <PendingIntegrationNotice title="Escritura de retos pendiente de backend">
          Puedes consultar retos y cumplimiento. Crear, editar, cambiar estado y relacionar proyectos requiere las RPC
          sigre_admin_guardar_reto, sigre_admin_cambiar_estado_reto y sigre_admin_asignar_reto_proyecto. No se envía ninguna solicitud.
        </PendingIntegrationNotice>
      )}

      <ChallengesFilters
        value={filters}
        onChange={setFilters}
        niveles={niveles}
        estadoOptions={estadoOptions}
        onCreate={access.canCreate ? openCreate : undefined}
      />

      {isLoading && !data ? (
        <LoadingState message="Cargando retos..." />
      ) : error ? (
        <ErrorState message="No fue posible cargar los retos." detail={error} onRetry={reload} />
      ) : rows.length === 0 ? (
        <EmptyState message="No hay retos registrados o visibles para tu usuario." />
      ) : (
        <ChallengesTable data={filtered} onDetail={openDetail} onEdit={access.canEdit ? openEdit : undefined} />
      )}

      <ChallengeDetailModal
        challenge={detail}
        estadoMutation={access.canEdit ? cambiarEstado : undefined}
        assignMutation={access.canEdit ? asignarProyecto : undefined}
        onClose={closeDetail}
        onChanged={reload}
      />

      <ChallengeFormModal
        open={form.open}
        challenge={form.challenge}
        feedback={guardar}
        onSubmit={guardar.run}
        onClose={() => setForm({ open: false, challenge: null })}
        onReload={reload}
      />
    </div>
  )
}
