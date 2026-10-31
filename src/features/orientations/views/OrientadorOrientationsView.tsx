import { useMemo, useState } from "react";
import { Download, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { distinctOptions } from "@/lib/format";

import { OrientationTable } from "../components/OrientationsTable";
import { OrientationsFilters } from "../components/OrientationsFilters";
import { useJornadaMetricas } from "../hooks/useJornadaMetricas";
import { buildOrientadorColumns } from "../jornadaColumns";
import { INITIAL_ORIENTATION_FILTERS, filterOrientations } from "../utils/orientationUtils";
import { QueryContent, type OrientationsQuery } from "./shared";

import type { Orientacion } from "../types/orientations";

interface OrientadorOrientationsViewProps {
  query: OrientationsQuery<Orientacion>;
  userId: string | null;
  onDetail: (row: Orientacion) => void;
  onAttendance?: (row: Orientacion) => void;
  onEnroll?: (row: Orientacion | null) => void;
}

export function OrientadorOrientationsView({
  query,
  userId,
  onDetail,
  onAttendance,
  onEnroll,
}: OrientadorOrientationsViewProps) {
  const [filters, setFilters] = useState(INITIAL_ORIENTATION_FILTERS);

  const assigned = useMemo(
    () => query.data.filter((row) => userId !== null && row.idOrientador === userId),
    [query.data, userId]
  );
  const filtered = useMemo(() => filterOrientations(assigned, filters), [assigned, filters]);
  const metricas = useJornadaMetricas(assigned);
  const estadoOptions = useMemo(() => distinctOptions(assigned.map((row) => row.estado)), [assigned]);
  const modalidadOptions = useMemo(() => distinctOptions(assigned.map((row) => row.modalidad)), [assigned]);
  const columns = useMemo(
    () => buildOrientadorColumns({ onDetail, onAttendance, onEnroll, metricas }),
    [onDetail, onAttendance, onEnroll, metricas]
  );

  return (
    <div className="space-y-4">
      <OrientationsFilters
        value={filters}
        onChange={setFilters}
        estadoOptions={estadoOptions}
        modalidadOptions={modalidadOptions}
      />

      <div className="flex flex-wrap justify-end gap-2">
        {onEnroll && (
          <Button variant="outline" className="gap-2" onClick={() => onEnroll(null)}>
            <UserPlus className="h-4 w-4" />
            Inscribir emprendedor
          </Button>
        )}
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
