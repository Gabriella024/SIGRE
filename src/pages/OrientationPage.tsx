import { useMemo, useState } from "react";
import { ViewToggle, type ViewMode } from "@/components/ui/viewToggle";
import { OrientationTable } from "@/features/orientations/components/OrientationsTable";
import { OrientationsFilters } from "@/features/orientations/components/OrientationsFilters";
import { useOrientations } from "@/features/orientations/hooks/useOrientations";
import {
  INITIAL_ORIENTATION_FILTERS,
  filterOrientations,
} from "@/features/orientations/utils/orientationUtils";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/query-state";
import { PendingIntegrationNotice } from "@/components/ui/pending-integration";
import { distinctOptions } from "@/lib/format";

export function OrientationPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const { data, error, isLoading, reload } = useOrientations();
  const [filters, setFilters] = useState(INITIAL_ORIENTATION_FILTERS);

  const rows = useMemo(() => data ?? [], [data]);
  const filtered = useMemo(() => filterOrientations(rows, filters), [rows, filters]);
  const estadoOptions = useMemo(() => distinctOptions(rows.map((row) => row.estado)), [rows]);
  const modalidadOptions = useMemo(() => distinctOptions(rows.map((row) => row.modalidad)), [rows]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Gestión de Orientaciones
        </h1>
        <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
      </div>

      {viewMode === "list" ? (
        <>
          <OrientationsFilters
            value={filters}
            onChange={setFilters}
            estadoOptions={estadoOptions}
            modalidadOptions={modalidadOptions}
          />

          {isLoading ? (
            <LoadingState message="Cargando orientaciones..." />
          ) : error ? (
            <ErrorState message="No fue posible cargar las orientaciones." detail={error} onRetry={reload} />
          ) : rows.length === 0 ? (
            <EmptyState message="No hay orientaciones registradas o visibles para tu usuario." />
          ) : (
            <OrientationTable data={filtered} />
          )}
        </>
      ) : (
        <PendingIntegrationNotice title="Calendario de orientaciones pendiente">
          El calendario mostrará las orientaciones reales cuando se integren los inscritos, el cupo y el orientador.
          Mientras tanto, consulta las orientaciones en la vista de lista.
        </PendingIntegrationNotice>
      )}
    </div>
  );
}
