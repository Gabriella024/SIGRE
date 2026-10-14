import { useMemo } from "react";
import { Mail } from "lucide-react";

import { PendingIntegrationNotice } from "@/components/ui/pending-integration";

import { OrientationTable } from "../components/OrientationsTable";
import { REPROGRAMACION_EMAIL } from "../constants/jornada";
import { buildAvailableColumns } from "../jornadaColumns";
import { filterAvailableJornadas, todayKey } from "../utils/orientationUtils";
import { QueryContent, type OrientationsQuery } from "./shared";

import type { Orientacion } from "../types/orientations";

export function EmprendedorOrientationsView({ query }: { query: OrientationsQuery<Orientacion> }) {
  const available = useMemo(() => filterAvailableJornadas(query.data, todayKey()), [query.data]);
  const columns = useMemo(() => buildAvailableColumns(), []);

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-800">Mis Orientaciones</h2>
        <PendingIntegrationNotice title="Inscripciones pendientes">
          Aquí verás las jornadas en las que estás inscrito y tu estado personal (Inscrito, Asistió o No
          asistió) cuando se habilite el registro de inscripciones.
        </PendingIntegrationNotice>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-800">Jornadas disponibles</h2>
        <QueryContent
          query={{ ...query, data: available }}
          emptyMessage="No hay jornadas programadas disponibles en este momento."
        >
          <OrientationTable data={available} columns={columns} />
        </QueryContent>
      </section>

      <div className="flex items-start gap-3 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
        <Mail className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
        <p>
          Si necesitas reprogramar tu asistencia a una jornada, escribe a{" "}
          <a href={`mailto:${REPROGRAMACION_EMAIL}`} className="font-semibold underline">
            {REPROGRAMACION_EMAIL}
          </a>{" "}
          indicando tu nombre, documento y la jornada.
        </p>
      </div>
    </div>
  );
}
