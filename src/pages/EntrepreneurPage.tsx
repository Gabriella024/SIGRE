import { useMemo, useState } from "react"
import { EntrepreneursTable } from "@/features/entrepreneurs/components/EntrepreneursTable"
import { EntrepreneursFilters } from "@/features/entrepreneurs/components/EntrepreneursFilters"
import { EntrepreneursForm } from "@/features/entrepreneurs/components/EntrepreneursForm"
import { useEntrepreneurs } from "@/features/entrepreneurs/hooks/useEntrepreneurs"
import {
  INITIAL_ENTREPRENEUR_FILTERS,
  filterEntrepreneurs,
} from "@/features/entrepreneurs/utils/entrepreneurUtils"
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/query-state"
import { Modal } from "@/components/ui/modal"
import { useAccessControl } from "@/features/access-control/hooks/useAccessControl"
import { SCREEN_CODES } from "@/features/access-control/constants/screens"
import { distinctOptions } from "@/lib/format"

export function EntrepreneursPage() {
  const { data, error, isLoading, reload } = useEntrepreneurs()
  const [filters, setFilters] = useState(INITIAL_ENTREPRENEUR_FILTERS)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const { can } = useAccessControl()
  const canCreate = can("emprendedores", "crear", SCREEN_CODES.emprendedores)

  const rows = useMemo(() => data ?? [], [data])
  const filtered = useMemo(() => filterEntrepreneurs(rows, filters), [rows, filters])
  const estadoOptions = useMemo(() => distinctOptions(rows.map((row) => row.estado)), [rows])
  const centroOptions = useMemo(() => distinctOptions(rows.map((row) => row.centro)), [rows])

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-slate-800">Gestión de Emprendedores</h1>

      <EntrepreneursFilters
        value={filters}
        onChange={setFilters}
        estadoOptions={estadoOptions}
        centroOptions={centroOptions}
        onCreate={canCreate ? () => setIsCreateOpen(true) : undefined}
      />

      {isLoading ? (
        <LoadingState message="Cargando emprendedores..." />
      ) : error ? (
        <ErrorState message="No fue posible cargar los emprendedores." detail={error} onRetry={reload} />
      ) : rows.length === 0 ? (
        <EmptyState message="No hay emprendedores registrados o visibles para tu usuario." />
      ) : (
        <EntrepreneursTable data={filtered} />
      )}

      {canCreate && (
        <Modal
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          title="Nuevo emprendedor"
          description="Los campos marcados con * son obligatorios."
        >
          {isCreateOpen && <EntrepreneursForm onCancel={() => setIsCreateOpen(false)} />}
        </Modal>
      )}
    </div>
  )
}
