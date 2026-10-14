import { useMemo, useState } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { distinctOptions } from "@/lib/format";

import { OrientationTable } from "../components/OrientationsTable";
import { OrientationsFilters } from "../components/OrientationsFilters";
import { buildOrientadorColumns } from "../jornadaColumns";
import { INITIAL_ORIENTATION_FILTERS, filterOrientations } from "../utils/orientationUtils";
import { QueryContent, type OrientationsQuery } from "./shared";

import type { Orientacion } from "../types/orientations";

interface OrientadorOrientationsViewProps {
  query: OrientationsQuery<Orientacion>;
  userId: string | null;
  onDetail: (row: Orientacion) => void;
}

export function OrientadorOrientationsView({ query, userId, onDetail }: OrientadorOrientationsViewProps) {
  const [filters, setFilters] = useState(INITIAL_ORIENTATION_FILTERS);

  const assigned = useMemo(
    () => query.data.filter((row) => userId !== null && row.idOrientador === userId),
    [query.data, userId]
  );
  const filtered = useMemo(() => filterOrientations(assigned, filters), [assigned, filters]);
  const estadoOptions = useMemo(() => distinctOptions(assigned.map((row) => row.estado)), [assigned]);
  const modalidadOptions = useMemo(() => distinctOptions(assigned.map((row) => row.modalidad)), [assigned]);
  const columns = useMemo(() => buildOrientadorColumns({ onDetail }), [onDetail]);

  return (
    <div className="space-y-4">
      <OrientationsFilters
        value={filters}
        onChange={setFilters}
        estadoOptions={estadoOptions}
        modalidadOptions={modalidadOptions}
      />

      <div className="flex justify-end">
        <Button variant="outline" className="gap-2" disabled title="Exportar: pendiente de servicio y RLS">
          <Download className="h-4 w-4" />
          Exportar mis jornadas
        </Button>
      </div>

      <QueryContent query={{ ...query, data: assigned }} emptyMessage="No tienes jornadas asignadas.">
        <OrientationTable data={filtered} columns={columns} />
      </QueryContent>
    </div>
  );
}
