import { useMemo, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/query-state";
import { Textarea } from "@/components/ui/textarea";
import { formatTimestamp } from "@/lib/format";

import { FeedbackMessage } from "./JornadaCells";
import { ESTADO_ASISTENCIA_OPTIONS, SIN_REGISTRAR_LABEL, type EstadoAsistencia } from "../constants/jornada";
import { useJornadaAttendance } from "../hooks/useJornadaAttendance";
import { attendanceFormSchema, type AttendanceFormValues } from "../schemas/attendanceSchema";
import { getAttendanceBlocker, nowInJornadaTimeZone } from "../utils/orientationUtils";

import type { InscritoAsistencia, Orientacion } from "../types/orientations";

interface AttendancePanelProps {
  jornada: Pick<Orientacion, "id" | "fecha" | "horaInicio">;
  canManage: boolean;
  refreshKey?: number;
}

const BADGE_TONES: Record<EstadoAsistencia, string> = {
  asistio: "bg-emerald-100 text-emerald-700",
  no_asistio: "bg-rose-100 text-rose-800",
};

function AttendanceBadge({ estado }: { estado: EstadoAsistencia | null }) {
  const option = ESTADO_ASISTENCIA_OPTIONS.find((item) => item.value === estado);
  const tone = estado ? BADGE_TONES[estado] : "bg-slate-100 text-slate-600";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}>
      {option?.label ?? SIN_REGISTRAR_LABEL}
    </span>
  );
}

function summarize(rows: InscritoAsistencia[]) {
  const asistio = rows.filter((row) => row.estadoAsistencia === "asistio").length;
  const noAsistio = rows.filter((row) => row.estadoAsistencia === "no_asistio").length;

  return [
    { key: "inscritos", label: "Inscritos", value: rows.length },
    { key: "asistio", label: "Asistieron", value: asistio },
    { key: "no_asistio", label: "No asistieron", value: noAsistio },
    { key: "sin_registrar", label: SIN_REGISTRAR_LABEL, value: rows.length - asistio - noAsistio },
  ];
}

interface AttendanceRowProps {
  inscrito: InscritoAsistencia;
  saving: boolean;
  disabled: boolean;
  onSubmit: (inscrito: InscritoAsistencia, values: AttendanceFormValues) => Promise<boolean>;
}

function AttendanceRow({ inscrito, saving, disabled, onSubmit }: AttendanceRowProps) {
  const initialEstado = inscrito.estadoAsistencia ?? "";
  const initialObservacion = inscrito.observacion ?? "";
  const [estado, setEstado] = useState<EstadoAsistencia | "">(initialEstado);
  const [observacion, setObservacion] = useState(initialObservacion);
  const [validationError, setValidationError] = useState<string | null>(null);

  const fieldId = `asistencia-${inscrito.idInscripcion}`;
  const unchanged = estado === initialEstado && observacion.trim() === initialObservacion.trim();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled) return;

    const parsed = attendanceFormSchema.safeParse({ estado, observacion });
    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? "Datos no válidos.");
      return;
    }

    setValidationError(null);
    await onSubmit(inscrito, parsed.data);
  };

  return (
    <li className="rounded-lg border border-slate-200 p-3">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-slate-900">{inscrito.nombreCompleto}</p>
            {inscrito.confirmadoAt && (
              <p className="text-xs text-slate-500">Confirmada el {formatTimestamp(inscrito.confirmadoAt)}</p>
            )}
          </div>
          <AttendanceBadge estado={inscrito.estadoAsistencia} />
        </div>

        <fieldset className="flex flex-wrap gap-4" disabled={disabled}>
          <legend className="sr-only">Estado de asistencia de {inscrito.nombreCompleto}</legend>
          {ESTADO_ASISTENCIA_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="radio"
                name={`${fieldId}-estado`}
                value={option.value}
                checked={estado === option.value}
                onChange={() => setEstado(option.value)}
              />
              {option.label}
            </label>
          ))}
        </fieldset>

        <div className="space-y-1.5">
          <Label htmlFor={`${fieldId}-observacion`} className="text-xs text-slate-600">
            Observación (opcional)
          </Label>
          <Textarea
            id={`${fieldId}-observacion`}
            value={observacion}
            onChange={(event) => setObservacion(event.target.value)}
            disabled={disabled}
            rows={2}
            className="min-h-14"
          />
        </div>

        {validationError && (
          <p role="alert" className="text-xs text-rose-700">
            {validationError}
          </p>
        )}

        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={disabled || unchanged || estado === ""}>
            {saving && <Loader2 className="animate-spin" />}
            {saving ? "Guardando..." : inscrito.estadoAsistencia ? "Actualizar" : "Guardar"}
          </Button>
        </div>
      </form>
    </li>
  );
}

export function AttendancePanel({ jornada, canManage, refreshKey = 0 }: AttendancePanelProps) {
  const attendance = useJornadaAttendance({ orientacionId: jornada.id, canManage, refreshKey });
  const rows = attendance.data;
  const metrics = useMemo(() => summarize(rows ?? []), [rows]);
  const [blocker, setBlocker] = useState(() => getAttendanceBlocker(jornada, nowInJornadaTimeZone()));

  const registrar = async (inscrito: InscritoAsistencia, values: AttendanceFormValues) => {
    const currentBlocker = getAttendanceBlocker(jornada, nowInJornadaTimeZone());
    setBlocker(currentBlocker);
    if (currentBlocker) return false;
    return attendance.registrar(inscrito, values);
  };

  if (attendance.isLoading) return <LoadingState message="Cargando inscritos..." />;

  if (attendance.error) {
    return (
      <ErrorState
        message="No fue posible cargar los inscritos."
        detail={attendance.error}
        onRetry={attendance.reload}
      />
    );
  }

  if (!rows) return null;

  const { feedback } = attendance;
  const locked = !canManage || blocker !== null || attendance.isSaving || attendance.isRefreshing;

  return (
    <div className="space-y-3">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.key} className="rounded-lg border border-slate-200 px-3 py-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</dt>
            <dd className="text-lg font-bold text-slate-900">{metric.value}</dd>
          </div>
        ))}
      </dl>

      {blocker && <FeedbackMessage type="info" message={blocker} />}

      {feedback && <FeedbackMessage type={feedback.type} message={feedback.message} />}

      {attendance.isRefreshing && (
        <p role="status" className="flex items-center gap-2 text-xs text-slate-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Actualizando listado...
        </p>
      )}

      {rows.length === 0 ? (
        <EmptyState message="No hay emprendedores con inscripción activa en esta jornada." />
      ) : (
        <ul className="space-y-2">
          {rows.map((inscrito) => (
            <AttendanceRow
              key={`${inscrito.idInscripcion}:${inscrito.estadoAsistencia ?? ""}:${inscrito.observacion ?? ""}:${inscrito.confirmadoAt ?? ""}`}
              inscrito={inscrito}
              saving={attendance.savingId === inscrito.emprendedorId}
              disabled={locked}
              onSubmit={registrar}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
