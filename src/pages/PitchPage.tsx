import { useCallback, useMemo, useState } from "react"
import { PitchPreparationTable, PitchTable } from "@/features/pitch/components/PitchTable"
import { PitchFilters } from "@/features/pitch/components/PitchFilters"
import { PitchFormModal } from "@/features/pitch/components/PitchFormModal"
import { PitchDetailModal } from "@/features/pitch/components/PitchDetailModal"
import { usePitchAccess, usePitchMutations, usePitchPreparations, usePitches } from "@/features/pitch/hooks/usePitch"
import { INITIAL_PITCH_FILTERS, filterPitches, filterPreparations } from "@/features/pitch/utils/pitchUtils"
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/query-state"
import { PendingIntegrationNotice, ReadOnlyBadge } from "@/components/ui/pending-integration"
import { distinctOptions } from "@/lib/format"
import type { Pitch, PitchStage } from "@/features/pitch/types/pitch"

export function PitchPage() {
  const access = usePitchAccess()
  const showPreparation = !access.evaluatorScoped
  const [activeTab, setActiveTab] = useState<PitchStage>(showPreparation ? "R5" : "R6")
  const tab: PitchStage = showPreparation ? activeTab : "R6"
  const pitches = usePitches(access.evaluatorScoped)
  const preparations = usePitchPreparations(showPreparation)
  const mutations = usePitchMutations(access)
  const [filters, setFilters] = useState(INITIAL_PITCH_FILTERS)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [form, setForm] = useState<{ open: boolean; pitch: Pitch | null }>({ open: false, pitch: null })
  const readOnly = !access.canCreate && !access.canEdit

  const pitchRows = useMemo(() => pitches.data ?? [], [pitches.data])
  const prepRows = useMemo(() => preparations.data ?? [], [preparations.data])
  const filteredPitches = useMemo(() => filterPitches(pitchRows, filters), [pitchRows, filters])
  const filteredPreps = useMemo(() => filterPreparations(prepRows, filters), [prepRows, filters])
  const estadoOptions = useMemo(
    () => distinctOptions((tab === "R6" ? pitchRows : prepRows).map((row) => row.estado)),
    [tab, pitchRows, prepRows]
  )
  const modalidadOptions = useMemo(() => distinctOptions(pitchRows.map((row) => row.modalidad)), [pitchRows])
  const detail = pitchRows.find((row) => row.id === detailId) ?? null

  const { guardar, cambiarEstado, asignar, retirar } = mutations
  const { reset: resetGuardar } = guardar
  const openForm = useCallback(
    (pitch: Pitch | null) => {
      resetGuardar()
      setForm({ open: true, pitch })
    },
    [resetGuardar]
  )
  const openCreate = useCallback(() => openForm(null), [openForm])
  const openDetail = useCallback((pitch: Pitch) => setDetailId(pitch.id), [])
  const { reset: resetEstado } = cambiarEstado
  const { reset: resetAsignar } = asignar
  const { reset: resetRetirar } = retirar
  const closeDetail = useCallback(() => {
    resetEstado()
    resetAsignar()
    resetRetirar()
    setDetailId(null)
  }, [resetEstado, resetAsignar, resetRetirar])

  const changeTab = useCallback((next: PitchStage) => {
    setActiveTab(next)
    setFilters(INITIAL_PITCH_FILTERS)
  }, [])

  const current = tab === "R6" ? pitches : preparations

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">
        {access.evaluatorScoped ? "Mis pitch asignados" : "Gestión de Preparación y Pitch"}
        {readOnly && <ReadOnlyBadge />}
      </h1>

      {!readOnly && guardar.pendingBackend && (
        <PendingIntegrationNotice title="Gestión de pitch pendiente de backend">
          La consulta es real. Programar/editar pitch, cambiar su estado y asignar o retirar evaluadores requieren las RPC
          sigre_admin_guardar_pitch, sigre_admin_cambiar_estado_pitch, sigre_admin_asignar_evaluador_pitch y
          sigre_admin_retirar_evaluador_pitch. No se envía ninguna solicitud.
        </PendingIntegrationNotice>
      )}

      <PitchFilters
        activeTab={tab}
        onTabChange={changeTab}
        showPreparation={showPreparation}
        value={filters}
        onChange={setFilters}
        estadoOptions={estadoOptions}
        modalidadOptions={modalidadOptions}
        onCreate={access.canCreate ? openCreate : undefined}
      />

      {current.isLoading && !current.data ? (
        <LoadingState message="Cargando registros..." />
      ) : current.error ? (
        <ErrorState message="No fue posible cargar los registros." detail={current.error} onRetry={current.reload} />
      ) : tab === "R6" ? (
        pitchRows.length === 0 ? (
          <EmptyState message={access.evaluatorScoped ? "No tienes pitch asignados." : "No hay pitch registrados o visibles para tu usuario."} />
        ) : (
          <PitchTable data={filteredPitches} onDetail={openDetail} onEdit={access.canEdit ? openForm : undefined} />
        )
      ) : prepRows.length === 0 ? (
        <EmptyState message="No hay preparaciones de pitch registradas o visibles para tu usuario." />
      ) : (
        <PitchPreparationTable data={filteredPreps} />
      )}

      <PitchDetailModal
        pitch={detail}
        management={access.canEdit ? { cambiarEstado, asignar, retirar } : undefined}
        onClose={closeDetail}
        onChanged={pitches.reload}
      />

      <PitchFormModal
        open={form.open}
        pitch={form.pitch}
        mutation={guardar}
        onClose={() => setForm({ open: false, pitch: null })}
        onSaved={pitches.reload}
      />
    </div>
  )
}
