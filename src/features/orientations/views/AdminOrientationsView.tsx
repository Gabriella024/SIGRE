import { useMemo, useState } from "react";

import { PendingIntegrationNotice } from "@/components/ui/pending-integration";
import { ViewToggle, type ViewMode } from "@/components/ui/viewToggle";
import { distinctOptions } from "@/lib/format";

import { OrientationTable } from "../components/OrientationsTable";
import { OrientationsFilters } from "../components/OrientationsFilters";
import { buildAdminColumns } from "../jornadaColumns";
import { INITIAL_ORIENTATION_FILTERS, filterOrientations } from "../utils/orientationUtils";
import { QueryContent, type OrientationsQuery } from "./shared";

import type { Orientacion } from "../types/orientations";

interface AdminOrientationsViewProps {
  query: OrientationsQuery<Orientacion>;
  onCreate?: () => void;
  onEdit?: (row: Orientacion) => void;
  onDetail: (row: Orientacion) => void;
}

export function AdminOrientationsView({ query, onCreate, onEdit, onDetail }: AdminOrientationsViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [filters, setFilters] = useState(INITIAL_ORIENTATION_FILTERS);

  const filtered = useMemo(() => filterOrientations(query.data, filters), [query.data, filters]);
  const estadoOptions = useMemo(() => distinctOptions(query.data.map((row) => row.estado)), [query.data]);
  const modalidadOptions = useMemo(() => distinctOptions(query.data.map((row) => row.modalidad)), [query.data]);
  const columns = useMemo(() => buildAdminColumns({ onDetail, onEdit }), [onDetail, onEdit]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
      </div>

      {viewMode === "list" ? (
        <>
          <OrientationsFilters
            value={filters}
            onChange={setFilters}
            estadoOptions={estadoOptions}
            modalidadOptions={modalidadOptions}
            onCreate={onCreate}
          />
          <QueryContent query={query} emptyMessage="No hay jornadas registradas.">
            <OrientationTable data={filtered} columns={columns} />
          </QueryContent>
        </>
      ) : (
        <PendingIntegrationNotice title="Calendario de jornadas pendiente">
          El calendario mostrará las jornadas reales cuando se integren los inscritos, el cupo y el orientador.
          Mientras tanto, consulta las jornadas en la vista de lista.
        </PendingIntegrationNotice>
      )}
    </div>
  );
}
