import { useMemo, useState } from "react";
import ProjectsTable from "@/features/projects/components/ProjectsTable";
import { ProjectsFilters } from "@/features/projects/components/ProjectsFilters";
import { useProjects } from "@/features/projects/hooks/useProyects";
import { INITIAL_PROJECT_FILTERS, filterProjects } from "@/features/projects/utils/proyectUtils";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/query-state";
import { distinctOptions } from "@/lib/format";

export function ProjectsPage() {
  const { data, error, isLoading, reload } = useProjects();
  const [filters, setFilters] = useState(INITIAL_PROJECT_FILTERS);

  const rows = useMemo(() => data ?? [], [data]);
  const filtered = useMemo(() => filterProjects(rows, filters), [rows, filters]);
  const estadoOptions = useMemo(() => distinctOptions(rows.map((row) => row.estado)), [rows]);
  const sectorOptions = useMemo(() => distinctOptions(rows.map((row) => row.sector)), [rows]);
  const etapaOptions = useMemo(() => distinctOptions(rows.map((row) => row.etapa)), [rows]);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-slate-800">Gestión de Proyectos</h1>

      <ProjectsFilters
        value={filters}
        onChange={setFilters}
        estadoOptions={estadoOptions}
        sectorOptions={sectorOptions}
        etapaOptions={etapaOptions}
      />

      {isLoading ? (
        <LoadingState message="Cargando proyectos..." />
      ) : error ? (
        <ErrorState message="No fue posible cargar los proyectos." detail={error} onRetry={reload} />
      ) : rows.length === 0 ? (
        <EmptyState message="No hay proyectos registrados o visibles para tu usuario." />
      ) : (
        <ProjectsTable data={filtered} />
      )}
    </div>
  );
}
