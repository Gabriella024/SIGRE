import { useMemo, useState } from "react";

import { PendingIntegrationNotice } from "@/components/ui/pending-integration";
import { distinctOptions } from "@/lib/format";

import { OrientationTable } from "../components/OrientationsTable";
import { OrientationsFilters } from "../components/OrientationsFilters";
import { buildCoordinatorColumns } from "../jornadaColumns";
import { INITIAL_ORIENTATION_FILTERS, countByEstado, filterOrientations } from "../utils/orientationUtils";
import { QueryContent, type OrientationsQuery } from "./shared";

import type { Orientacion } from "../types/orientations";

interface CoordinatorOrientationsViewProps {
  query: OrientationsQuery<Orientacion>;
  onDetail: (row: Orientacion) => void;
}

const ESTADO_METRICS = [
  { key: "programada", label: "Programadas" },
  { key: "finalizada", label: "Finalizadas" },
  { key: "cancelada", label: "Canceladas" },
];

export function CoordinatorOrientationsView({ query, onDetail }: CoordinatorOrientationsViewProps) {
  const [filters, setFilters] = useState(INITIAL_ORIENTATION_FILTERS);

  const filtered = useMemo(() => filterOrientations(query.data, filters), [query.data, filters]);
  const estadoOptions = useMemo(() => distinctOptions(query.data.map((row) => row.estado)), [query.data]);
  const modalidadOptions = useMemo(() => distinctOptions(query.data.map((row) => row.modalidad)), [query.data]);
  const columns = useMemo(() => buildCoordinatorColumns({ onDetail }), [onDetail]);

  const metrics = useMemo(() => {
    const counts = countByEstado(filtered);
    return [
      { key: "total", label: "Jornadas", value: filtered.length },
      ...ESTADO_METRICS.map((metric) => ({ ...metric, value: counts.get(metric.key) ?? 0 })),
    ];
  }, [filtered]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.key} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{query.isLoading ? "—" : metric.value}</p>
          </div>
        ))}
      </div>

      <PendingIntegrationNotice title="Supervisión institucional pendiente">
        Los filtros por centro, orientador y municipio, y las métricas de participación (inscritos y
        asistencia), se habilitarán cuando existan esas columnas y relaciones.
      </PendingIntegrationNotice>

      <OrientationsFilters
        value={filters}
        onChange={setFilters}
        estadoOptions={estadoOptions}
        modalidadOptions={modalidadOptions}
      />

      <QueryContent query={query} emptyMessage="No hay jornadas visibles dentro de tu alcance.">
        <OrientationTable data={filtered} columns={columns} />
      </QueryContent>
    </div>
  );
}
