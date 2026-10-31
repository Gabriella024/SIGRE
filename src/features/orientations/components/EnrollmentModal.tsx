import { useMemo, useState, type FormEvent } from "react";
import { Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/query-state";
import { useEntrepreneurs } from "@/features/entrepreneurs/hooks/useEntrepreneurs";
import { formatDateOnly, formatTime, matchesSearch } from "@/lib/format";

import { FeedbackMessage } from "./JornadaCells";
import { useJornadaEnrollment } from "../hooks/useJornadaEnrollment";
import { enrollmentFormSchema } from "../schemas/enrollmentSchema";
import { getEnrollmentBlocker, nowInJornadaTimeZone } from "../utils/orientationUtils";

import type { Orientacion } from "../types/orientations";

const MAX_RESULTS = 50;

const selectClass =
  "h-8 w-full min-w-0 rounded-2xl border border-transparent bg-input/50 px-2.5 text-base outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

interface EnrollmentModalProps {
  open: boolean;
  initialJornadaId: string | null;
  jornadas: Orientacion[];
  onEnrolled: (orientacionId: string) => void;
  onClose: () => void;
}

function jornadaLabel(jornada: Orientacion): string {
  return `${jornada.tema} · ${formatDateOnly(jornada.fecha)} · ${formatTime(jornada.horaInicio)}`;
}

type EnrollmentFormProps = Omit<EnrollmentModalProps, "open">;

function EnrollmentForm({ initialJornadaId, jornadas, onEnrolled, onClose }: EnrollmentFormProps) {
  const entrepreneurs = useEntrepreneurs();
  const enrollment = useJornadaEnrollment(onEnrolled);
  const [openedAt] = useState(nowInJornadaTimeZone);
  const [orientacionId, setOrientacionId] = useState(initialJornadaId ?? "");
  const [emprendedorId, setEmprendedorId] = useState("");
  const [search, setSearch] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const options = useMemo(() => {
    const today = openedAt.slice(0, 10);
    return jornadas
      .filter((row) => row.fecha >= today || row.id === initialJornadaId)
      .sort((a, b) => a.fechaHora.localeCompare(b.fechaHora));
  }, [jornadas, openedAt, initialJornadaId]);

  const jornada = options.find((row) => row.id === orientacionId) ?? null;
  const blocker = jornada ? getEnrollmentBlocker(jornada, openedAt) : null;

  const matches = useMemo(
    () => (entrepreneurs.data ?? []).filter((row) => matchesSearch(search, row.nombre, row.centro, row.programa)),
    [entrepreneurs.data, search]
  );
  const selected = entrepreneurs.data?.find((row) => row.id === emprendedorId) ?? null;

  const resetMessages = () => {
    setValidationError(null);
    enrollment.clearFeedback();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (enrollment.isSubmitting) return;

    const parsed = enrollmentFormSchema.safeParse({ orientacionId, emprendedorId });
    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? "Datos no válidos.");
      return;
    }
    if (!jornada || !selected) {
      setValidationError("La jornada o el emprendedor seleccionado ya no está disponible.");
      return;
    }

    const currentBlocker = getEnrollmentBlocker(jornada, nowInJornadaTimeZone());
    if (currentBlocker) {
      setValidationError(currentBlocker);
      return;
    }

    setValidationError(null);
    const ok = await enrollment.inscribir({ modo: "manual", ...parsed.data }, selected.nombre);
    if (ok) setEmprendedorId("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="inscripcion-jornada">Jornada</Label>
        <select
          id="inscripcion-jornada"
          className={selectClass}
          value={orientacionId}
          onChange={(event) => {
            setOrientacionId(event.target.value);
            resetMessages();
          }}
          disabled={enrollment.isSubmitting}
        >
          <option value="">Selecciona una jornada</option>
          {options.map((row) => (
            <option key={row.id} value={row.id}>
              {jornadaLabel(row)}
            </option>
          ))}
        </select>
        {options.length === 0 && (
          <p className="text-xs text-slate-500">No tienes jornadas vigentes disponibles para inscribir.</p>
        )}
        {jornada && (
          <p className="text-xs text-slate-500">
            Cupo total: {jornada.cupo ?? "sin definir"}. Los cupos disponibles los valida el sistema al inscribir.
          </p>
        )}
        {blocker && (
          <p role="alert" className="text-xs text-amber-700">
            {blocker}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="inscripcion-busqueda">Emprendedor</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            id="inscripcion-busqueda"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre, centro o programa..."
            className="pl-8"
            disabled={enrollment.isSubmitting}
          />
        </div>

        {entrepreneurs.isLoading ? (
          <LoadingState message="Cargando emprendedores..." />
        ) : entrepreneurs.error ? (
          <ErrorState
            message="No fue posible cargar los emprendedores."
            detail={entrepreneurs.error}
            onRetry={entrepreneurs.reload}
          />
        ) : matches.length === 0 ? (
          <EmptyState message="No se encontraron emprendedores." />
        ) : (
          <fieldset disabled={enrollment.isSubmitting} className="space-y-1">
            <legend className="sr-only">Selecciona un emprendedor</legend>
            <ul className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-1">
              {matches.slice(0, MAX_RESULTS).map((row) => (
                <li key={row.id}>
                  <label
                    className={`flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50 ${
                      row.id === emprendedorId ? "bg-lime-50" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="inscripcion-emprendedor"
                      value={row.id}
                      checked={row.id === emprendedorId}
                      onChange={() => {
                        setEmprendedorId(row.id);
                        resetMessages();
                      }}
                      className="mt-1"
                    />
                    <span>
                      <span className="block font-medium text-slate-900">{row.nombre}</span>
                      <span className="block text-xs text-slate-500">
                        {[row.centro, row.programa, row.estado].filter(Boolean).join(" · ") || "Sin datos adicionales"}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            {matches.length > MAX_RESULTS && (
              <p className="text-xs text-slate-500">
                Se muestran {MAX_RESULTS} de {matches.length} resultados. Refina la búsqueda.
              </p>
            )}
          </fieldset>
        )}
      </div>

      {selected && jornada && (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          Se inscribirá a <span className="font-semibold">{selected.nombre}</span> en{" "}
          <span className="font-semibold">{jornadaLabel(jornada)}</span>.
        </p>
      )}

      {validationError && (
        <p role="alert" className="text-sm text-rose-700">
          {validationError}
        </p>
      )}
      {enrollment.feedback && <FeedbackMessage type={enrollment.feedback.type} message={enrollment.feedback.message} />}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={enrollment.isSubmitting}>
          Cerrar
        </Button>
        <Button
          type="submit"
          className="bg-lime-500 hover:bg-lime-600"
          disabled={enrollment.isSubmitting || !jornada || !selected || blocker !== null}
        >
          {enrollment.isSubmitting && <Loader2 className="animate-spin" />}
          {enrollment.isSubmitting ? "Inscribiendo..." : "Confirmar inscripción"}
        </Button>
      </div>
    </form>
  );
}

export function EnrollmentModal({ open, onClose, ...props }: EnrollmentModalProps) {
  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title="Inscribir emprendedor"
      description="Selecciona la jornada y el emprendedor que deseas inscribir."
    >
      {open && <EnrollmentForm onClose={onClose} {...props} />}
    </Modal>
  );
}
