import { useMemo, useState } from "react"
import { EntrepreneursTable } from "@/features/entrepreneurs/components/EntrepreneursTable"
import { EntrepreneursCards } from "@/features/entrepreneurs/components/EntrepreneursCards"
import { EntrepreneursFilters } from "@/features/entrepreneurs/components/EntrepreneursFilters"
import { EntrepreneursForm } from "@/features/entrepreneurs/components/EntrepreneursForm"
import { EntrepreneurMetrics } from "@/features/entrepreneurs/components/EntrepreneurMetrics"
import { EntrepreneursViewToggle } from "@/features/entrepreneurs/components/EntrepreneursViewToggle"
import { OwnEntrepreneurRedirect } from "@/features/entrepreneurs/components/OwnEntrepreneurRedirect"
import { useEntrepreneurAccess, type EntrepreneurAccess } from "@/features/entrepreneurs/hooks/useEntrepreneurAccess"
import { useEntrepreneurs } from "@/features/entrepreneurs/hooks/useEntrepreneurs"
import { useEntrepreneurList } from "@/features/entrepreneurs/hooks/useEntrepreneurList"
import { useEntrepreneurListState } from "@/features/entrepreneurs/hooks/useEntrepreneurListState"
import { useEntrepreneurViewPreference } from "@/features/entrepreneurs/hooks/useEntrepreneurViewPreference"
import { useEntrepreneurExport } from "@/features/entrepreneurs/hooks/useEntrepreneurExport"
import { useEntrepreneurCreate } from "@/features/entrepreneurs/hooks/useEntrepreneurCreate"
import type { EntrepreneurExportOutcome } from "@/features/entrepreneurs/utils/entrepreneurExport"
import type { EntrepreneurFormValues } from "@/features/entrepreneurs/schemas/entrepreneursSchema"
import {
  INITIAL_ENTREPRENEUR_FILTERS,
  computeEntrepreneurMetrics,
  hasActiveEntrepreneurFilters,
  normalizeSpaces,
  stepPage,
} from "@/features/entrepreneurs/utils/entrepreneurUtils"
import type { EntrepreneurFilters, EntrepreneurScope, EntrepreneurSort } from "@/features/entrepreneurs/types/entrepreneur"
import { Button } from "@/components/ui/button"
import { FeedbackMessage } from "@/components/ui/feedback-message"
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/query-state"
import { Modal } from "@/components/ui/modal"
import { PaginationBar } from "@/components/ui/pagination-bar"
import { distinctOptions } from "@/lib/format"

function ExportFeedback({ outcome }: { outcome: EntrepreneurExportOutcome }) {
  switch (outcome.status) {
    case "success":
      return (
        <FeedbackMessage
          type="success"
          message={`Se exportaron ${outcome.count} ${outcome.count === 1 ? "emprendedor" : "emprendedores"} a Excel.`}
        />
      )
    case "empty":
      return (
        <FeedbackMessage
          type="info"
          message="No hay emprendedores que coincidan con la búsqueda y los filtros actuales. No se generó ningún archivo."
        />
      )
    case "denied":
      return (
        <FeedbackMessage
          type="error"
          message="No tienes autorización para exportar emprendedores. No se generó ningún archivo."
        />
      )
    case "error":
      return <FeedbackMessage type="error" message={`${outcome.message} No se generó ningún archivo.`} />
  }
}

export function EntrepreneursPage() {
  const access = useEntrepreneurAccess()

  if (!access.scope) return <LoadingState message="Verificando tu sesión..." />
  if (access.scope.kind === "own") {
    return (
      <div className="space-y-4 p-4 sm:p-6">
        <h1 className="text-2xl font-bold text-slate-800">{access.label}</h1>
        <OwnEntrepreneurRedirect scope={access.scope} />
      </div>
    )
  }

  return <EntrepreneursListView access={access} scope={access.scope} />
}

function EntrepreneursListView({ access, scope }: { access: EntrepreneurAccess; scope: EntrepreneurScope }) {
  const isOrientadorView = access.view === "orientador"
  const { data, error, isLoading, reload } = useEntrepreneurs(scope)
  const [{ filters, sort, page }, setListState] = useEntrepreneurListState()
  const [view, setView] = useEntrepreneurViewPreference()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const creator = useEntrepreneurCreate()
  const { canCreate, crear, reset: resetCreator, isSubmitting: isCreating } = creator
  const exporter = useEntrepreneurExport(scope)
  const { exportar, reset: resetExport, isExporting } = exporter

  const isReady = !isLoading && !error && data !== null
  const rows = useMemo(() => (isReady ? data : []), [isReady, data])
  const metrics = useMemo(() => (isReady ? computeEntrepreneurMetrics(rows) : null), [isReady, rows])
  const list = useEntrepreneurList(rows, { filters, sort, page })

  const estadoOptions = useMemo(() => distinctOptions(rows.map((row) => row.estado)), [rows])
  const centroOptions = useMemo(() => distinctOptions(rows.map((row) => row.centro)), [rows])
  const nivelOptions = useMemo(() => distinctOptions(rows.map((row) => row.nivelFormacion)), [rows])
  const tipoOptions = useMemo(() => distinctOptions(rows.map((row) => row.tipo)), [rows])

  const clearExportOutcome = () => {
    if (!isExporting) resetExport()
  }

  const updateFilters = (next: EntrepreneurFilters) => {
    setListState((current) => ({ ...current, filters: next, page: 1 }))
    clearExportOutcome()
  }

  const updateSort = (next: EntrepreneurSort) => {
    setListState((current) => ({ ...current, sort: next, page: 1 }))
    clearExportOutcome()
  }

  const startExport = () => {
    setNotice(null)
    void exportar(filters, sort)
  }

  const openCreate = () => {
    resetCreator()
    setNotice(null)
    setIsCreateOpen(true)
  }

  const changeCreateOpen = (open: boolean) => {
    if (open) {
      openCreate()
      return
    }
    if (isCreating) return
    resetCreator()
    setIsCreateOpen(false)
  }

  const submitCreate = async (values: EntrepreneurFormValues) => {
    const result = await crear(values)
    if (!result.success) return result
    setIsCreateOpen(false)
    resetCreator()
    reload()
    const nombre = normalizeSpaces(values.nombre_completo)
    setNotice(
      hasActiveEntrepreneurFilters(filters)
        ? `El emprendedor "${nombre}" se registró correctamente. Es posible que no aparezca en el listado si no coincide con la búsqueda o los filtros aplicados.`
        : `El emprendedor "${nombre}" se registró correctamente.`
    )
    return result
  }

  const clearAllFilters = () => updateFilters(INITIAL_ENTREPRENEUR_FILTERS)

  const changePage = (target: number) => {
    const delta = target - list.page
    const { totalPages } = list
    setListState((current) => ({ ...current, page: stepPage(current.page, delta, totalPages) }))
  }

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <h1 className="text-2xl font-bold text-slate-800">
        {isOrientadorView ? access.label : "Gestión de Emprendedores"}
      </h1>

      <EntrepreneurMetrics metrics={metrics} />

      <EntrepreneursFilters
        value={filters}
        onChange={updateFilters}
        estadoOptions={estadoOptions}
        centroOptions={centroOptions}
        nivelOptions={nivelOptions}
        tipoOptions={tipoOptions}
        showOrientadorFilter={!isOrientadorView}
        viewToggle={<EntrepreneursViewToggle value={view} onChange={setView} />}
        isExporting={isExporting}
        onExport={exporter.canExport ? startExport : undefined}
        onCreate={canCreate ? openCreate : undefined}
      />

      {notice && <FeedbackMessage type="success" message={notice} />}
      {exporter.outcome && <ExportFeedback outcome={exporter.outcome} />}

      {isLoading ? (
        <LoadingState message="Cargando emprendedores..." />
      ) : error ? (
        <ErrorState message="No fue posible cargar los emprendedores." detail={error} onRetry={reload} />
      ) : rows.length === 0 ? (
        <EmptyState
          message={
            isOrientadorView
              ? "No tienes emprendedores asignados o no son visibles para tu usuario."
              : "No hay emprendedores registrados o visibles para tu usuario."
          }
        />
      ) : list.total === 0 ? (
        <div className="space-y-3">
          <EmptyState message="Ningún emprendedor coincide con la búsqueda o los filtros aplicados." />
          {hasActiveEntrepreneurFilters(filters) && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={clearAllFilters}>
                Limpiar búsqueda y filtros
              </Button>
            </div>
          )}
        </div>
      ) : (
        <>
          {view === "cards" ? (
            <EntrepreneursCards rows={list.rows} />
          ) : (
            <EntrepreneursTable rows={list.rows} sort={sort} onSortChange={updateSort} />
          )}
          <PaginationBar
            page={list.page}
            totalPages={list.totalPages}
            from={list.from}
            to={list.to}
            total={list.total}
            onPageChange={changePage}
          />
        </>
      )}

      {canCreate && (
        <Modal
          open={isCreateOpen}
          onOpenChange={changeCreateOpen}
          title="Nuevo emprendedor"
          description="Los campos marcados con * son obligatorios."
        >
          {isCreateOpen && (
            <EntrepreneursForm
              isSubmitting={isCreating}
              submitError={creator.error}
              onSubmit={submitCreate}
              onCancel={() => changeCreateOpen(false)}
            />
          )}
        </Modal>
      )}
    </div>
  )
}
