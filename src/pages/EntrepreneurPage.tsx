import { useMemo, useState } from "react"
import { EntrepreneursTable } from "@/features/entrepreneurs/components/EntrepreneursTable"
import { EntrepreneursFilters } from "@/features/entrepreneurs/components/EntrepreneursFilters"
import { useEntrepreneurs } from "@/features/entrepreneurs/hooks/useEntrepreneurs"
import {
  INITIAL_ENTREPRENEUR_FILTERS,
  filterEntrepreneurs,
} from "@/features/entrepreneurs/utils/entrepreneurUtils"
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/query-state"
import { distinctOptions } from "@/lib/format"

export function EntrepreneursPage() {
  const { data, error, isLoading, reload } = useEntrepreneurs()
  const [filters, setFilters] = useState(INITIAL_ENTREPRENEUR_FILTERS)

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
    </div>
  )
}
