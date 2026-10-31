import { useCallback, useMemo, useState } from "react";
import { Loader2, Mail, UserPlus } from "lucide-react";

import { FeedbackMessage } from "@/components/ui/feedback-message";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/query-state";
import { OrientationHistoryItem } from "@/features/entrepreneurs/components/detail/EntrepreneurOrientationsSection";
import { useEntrepreneurs } from "@/features/entrepreneurs/hooks/useEntrepreneurs";
import { isActiveEntrepreneur } from "@/features/entrepreneurs/utils/entrepreneurUtils";

import { OrientationTable } from "../components/OrientationsTable";
import { REPROGRAMACION_EMAIL } from "../constants/jornada";
import { useEntrepreneurOrientationHistory } from "../hooks/useEntrepreneurOrientationHistory";
import { useJornadaEnrollment } from "../hooks/useJornadaEnrollment";
import { buildAvailableColumns } from "../jornadaColumns";
import { inscripcionesPorJornada } from "../utils/enrollmentStatus";
import {
  filterAvailableJornadas,
  getEnrollmentBlocker,
  nowInJornadaTimeZone,
  todayKey,
} from "../utils/orientationUtils";
import { QueryContent, type OrientationsQuery } from "./shared";

import type { Entrepreneur } from "@/features/entrepreneurs/types/entrepreneur";
import type { Orientacion } from "../types/orientations";

interface EmprendedorOrientationsViewProps {
  query: OrientationsQuery<Orientacion>;
  userId: string;
  onEnrolled: () => void;
}

const enrollButton =
  "inline-flex items-center gap-1.5 rounded-lg border border-lime-600 px-2.5 py-1 text-xs font-medium text-lime-700 hover:bg-lime-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-500 disabled:opacity-60";

function OwnOrientations({
  entrepreneur,
  query,
  onEnrolled,
}: {
  entrepreneur: Entrepreneur;
  query: OrientationsQuery<Orientacion>;
  onEnrolled: () => void;
}) {
  const history = useEntrepreneurOrientationHistory(entrepreneur.id);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const reloadHistory = history.reload;
  const handleEnrolled = useCallback(() => {
    reloadHistory();
    onEnrolled();
  }, [reloadHistory, onEnrolled]);
  const enrollment = useJornadaEnrollment(handleEnrolled);
  const active = isActiveEntrepreneur(entrepreneur);

  const inscripciones = useMemo(() => inscripcionesPorJornada(history.data ?? []), [history.data]);

  const available = useMemo(() => filterAvailableJornadas(query.data, todayKey()), [query.data]);
  const { inscribir, isSubmitting } = enrollment;
  const historyReady = history.data !== null;

  const enroll = useCallback(
    async (jornada: Orientacion) => {
      if (getEnrollmentBlocker(jornada, nowInJornadaTimeZone())) return;
      setPendingId(jornada.id);
      await inscribir({ modo: "autoinscripcion", orientacionId: jornada.id }, entrepreneur.nombre);
      setPendingId(null);
    },
    [inscribir, entrepreneur.nombre]
  );

  const columns = useMemo(
    () =>
      buildAvailableColumns({
        enrollCell: (row) => {
          const estado = inscripciones.get(row.id);
          if (estado === "cancelado") {
            return (
              <span
                className="text-xs font-medium text-slate-500"
                title="Tu inscripción en esta jornada fue cancelada. Si necesitas reinscribirte, contacta al administrador."
              >
                Inscripción cancelada
              </span>
            );
          }
          const enrolled = estado === "inscrito";
          const reason = !active
            ? "Tu registro de emprendedor no está activo."
            : !historyReady
              ? "Verificando tus inscripciones..."
              : enrolled
                ? "Ya estás inscrito en esta jornada."
                : getEnrollmentBlocker(row, nowInJornadaTimeZone());

          return (
            <button
              type="button"
              className={enrollButton}
              disabled={reason !== null || isSubmitting}
              title={reason ?? "Inscribirme en esta jornada"}
              onClick={() => void enroll(row)}
            >
              {pendingId === row.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
              {enrolled ? "Inscrito" : "Inscribirme"}
            </button>
          );
        },
      }),
    [inscripciones, active, historyReady, isSubmitting, pendingId, enroll]
  );

  return (
    <>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-800">Mis orientaciones</h2>
        {history.isLoading ? (
          <LoadingState message="Cargando tus inscripciones..." />
        ) : history.error ? (
          <ErrorState message="No fue posible cargar tus orientaciones." detail={history.error} onRetry={history.reload} />
        ) : !history.data || history.data.length === 0 ? (
          <EmptyState message="Aún no tienes inscripciones ni asistencias registradas." />
        ) : (
          <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white p-4">
            {history.data.map((item) => (
              <OrientationHistoryItem key={item.orientacionId} item={item} />
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-800">Jornadas disponibles</h2>
        {!active && (
          <FeedbackMessage
            type="info"
            message="Tu registro de emprendedor no está activo, por lo que no puedes inscribirte. Contacta al administrador."
          />
        )}
        {enrollment.feedback && <FeedbackMessage type={enrollment.feedback.type} message={enrollment.feedback.message} />}
        <QueryContent
          query={{ ...query, data: available }}
          emptyMessage="No hay jornadas programadas disponibles en este momento."
        >
          <OrientationTable data={available} columns={columns} />
        </QueryContent>
        <p className="text-xs text-slate-500">
          El cupo disponible y las demás condiciones de inscripción las valida el sistema al confirmar.
        </p>
      </section>
    </>
  );
}

export function EmprendedorOrientationsView({ query, userId, onEnrolled }: EmprendedorOrientationsViewProps) {
  const scope = useMemo(() => ({ kind: "own" as const, usuarioId: userId }), [userId]);
  const own = useEntrepreneurs(scope);

  return (
    <div className="space-y-6">
      {own.isLoading ? (
        <LoadingState message="Buscando tu registro de emprendedor..." />
      ) : own.error ? (
        <ErrorState message="No fue posible cargar tu registro de emprendedor." detail={own.error} onRetry={own.reload} />
      ) : !own.data || own.data.length === 0 ? (
        <EmptyState message="Tu cuenta no tiene un registro de emprendedor visible, por lo que no puedes inscribirte. Contacta al administrador." />
      ) : own.data.length > 1 ? (
        <EmptyState message="Tu cuenta tiene más de un registro de emprendedor asociado. Contacta al administrador." />
      ) : (
        <OwnOrientations entrepreneur={own.data[0]} query={query} onEnrolled={onEnrolled} />
      )}

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
