import { useMemo, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { DetailField } from "@/components/ui/detail-section";
import { FormActions } from "@/components/ui/form-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { MutationAlert } from "@/components/ui/mutation-alert";
import { NullableText } from "@/components/ui/nullable-text";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/query-state";
import { FieldError, SelectField } from "@/components/ui/select-field";
import { StatusBadge } from "@/components/ui/status-badge";
import { useProjects } from "@/features/projects/hooks/useProyects";
import { formatDateOnly, localDateKey } from "@/lib/format";
import { nullableTrim } from "@/lib/formErrors";

import type { MutationHandle } from "@/hooks/useAdminMutation";

import { useChallengeCompliance } from "../hooks/useChallenges";
import { RETO_ESTADOS, assignChallengeFormSchema } from "../schemas/challengesSchema";
import { isEvidenceUrl } from "../utils/challengeUtils";
import type {
  AsignarRetoProyectoInput,
  CambiarEstadoRetoInput,
  Challenge,
  ChallengeCompliance,
  RegistrarAvanceRetoInput,
  ResultadoRevisionReto,
  RevisarRetoInput,
} from "../types/Challenge";

interface ChallengeDetailModalProps {
  challenge: Challenge | null;
  estadoMutation?: MutationHandle<CambiarEstadoRetoInput>;
  assignMutation?: MutationHandle<AsignarRetoProyectoInput>;
  avanceMutation?: MutationHandle<RegistrarAvanceRetoInput>;
  revisarMutation?: MutationHandle<RevisarRetoInput>;
  onClose: () => void;
  onChanged: () => void;
}

const REVISION_OPTIONS = [
  { value: "aprobado", label: "Aprobar" },
  { value: "requiere_ajustes", label: "Solicitar ajustes" },
  { value: "no_aprobado", label: "No aprobar" },
] as const;

function ComplianceActions({
  row,
  avance,
  revisar,
  onDone,
}: {
  row: ChallengeCompliance;
  avance?: MutationHandle<RegistrarAvanceRetoInput>;
  revisar?: MutationHandle<RevisarRetoInput>;
  onDone: () => void;
}) {
  const [evidencia, setEvidencia] = useState("");
  const [observacion, setObservacion] = useState("");
  const [resultado, setResultado] = useState<ResultadoRevisionReto>("aprobado");
  const puedeEntregar = avance && (row.estado === "asignado" || row.estado === "requiere_ajustes" || row.estado === null);
  const puedeRevisar = revisar && row.estado === "entregado";
  if (!puedeEntregar && !puedeRevisar) return null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const result = puedeRevisar && revisar
      ? await revisar.run({ idCumplimiento: row.id, resultado, observacion: nullableTrim(observacion) })
      : avance
        ? await avance.run({ idCumplimiento: row.id, evidencia: nullableTrim(evidencia), observacion: nullableTrim(observacion) })
        : null;
    if (result?.success) {
      setEvidencia("");
      setObservacion("");
      onDone();
    }
  };
  const mutation = puedeRevisar ? revisar : avance;

  return (
    <form onSubmit={(event) => void submit(event)} className="mt-2 space-y-2 rounded-md bg-slate-50 p-2">
      <fieldset disabled={mutation?.isSubmitting} className="grid gap-2 sm:grid-cols-2">
        {puedeRevisar ? (
          <SelectField
            aria-label="Resultado de la sustentación"
            options={REVISION_OPTIONS}
            value={resultado}
            onChange={(e) => setResultado(e.target.value as ResultadoRevisionReto)}
          />
        ) : (
          <Input aria-label="Enlace de la evidencia" placeholder="Enlace de la evidencia (https://...)" value={evidencia} onChange={(e) => setEvidencia(e.target.value)} />
        )}
        <Input
          aria-label={puedeRevisar ? "Observaciones de la revisión" : "Descripción del avance"}
          placeholder={puedeRevisar ? "Observaciones (obligatorias para ajustes)" : "Descripción del avance o ajuste"}
          value={observacion}
          onChange={(e) => setObservacion(e.target.value)}
        />
      </fieldset>
      {mutation && <MutationAlert feedback={mutation} />}
      <Button type="submit" size="sm" variant="outline" disabled={mutation?.isSubmitting || Boolean(mutation?.pendingBackend)}>
        {puedeRevisar ? "Registrar revisión" : row.estado === "requiere_ajustes" ? "Entregar ajustes" : "Registrar avance"}
      </Button>
    </form>
  );
}

function ComplianceList({
  rows,
  avance,
  revisar,
  onDone,
}: {
  rows: ChallengeCompliance[];
  avance?: MutationHandle<RegistrarAvanceRetoInput>;
  revisar?: MutationHandle<RevisarRetoInput>;
  onDone: () => void;
}) {
  return (
    <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
      {rows.map((row) => (
        <li key={row.id} className="space-y-1 p-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-slate-900">{row.proyecto ?? "Proyecto no disponible"}</span>
            <StatusBadge value={row.estado} emptyLabel="Sin cumplimiento" />
          </div>
          <p className="text-slate-500">
            {row.emprendedor ?? "Emprendedor no disponible"} · Entrega:{" "}
            {row.fechaEntrega ? formatDateOnly(row.fechaEntrega.slice(0, 10)) : "sin fecha"}
          </p>
          <p className="text-slate-600">
            Evidencia:{" "}
            {!row.evidencia ? (
              "sin archivo registrado"
            ) : isEvidenceUrl(row.evidencia) ? (
              <a href={row.evidencia} target="_blank" rel="noopener noreferrer" className="font-medium text-lime-700 underline">
                Ver archivo
              </a>
            ) : (
              <span className="break-all">{row.evidencia}</span>
            )}
          </p>
          {row.observacion && <p className="text-slate-600">Observación: {row.observacion}</p>}
          {row.sustentaciones.map((s) => (
            <p key={s.id} className="text-xs text-slate-500">
              Sustentación {s.fecha ? formatDateOnly(localDateKey(s.fecha)) : ""}: {s.resultado ?? "sin resultado"}
              {s.orientador && ` · ${s.orientador}`}
              {s.observacion && ` · ${s.observacion}`}
            </p>
          ))}
          <ComplianceActions row={row} avance={avance} revisar={revisar} onDone={onDone} />
        </li>
      ))}
    </ul>
  );
}

function EstadoForm({ challenge, mutation, onDone }: { challenge: Challenge; mutation: MutationHandle<CambiarEstadoRetoInput>; onDone: () => void }) {
  const [estado, setEstado] = useState(challenge.estado ?? "");
  const unchanged = estado === (challenge.estado ?? "");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (unchanged || !challenge.updatedAt) return;
    const result = await mutation.run({ idReto: challenge.id, estado, updatedAtEsperado: challenge.updatedAt });
    if (result.success) onDone();
  };

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-2">
      <Label htmlFor="reto-cambiar-estado">Cambiar estado</Label>
      <div className="flex gap-2">
        <SelectField id="reto-cambiar-estado" options={RETO_ESTADOS} value={estado} onChange={(e) => setEstado(e.target.value)} />
        <Button type="submit" variant="outline" disabled={unchanged || mutation.isSubmitting || Boolean(mutation.pendingBackend)}>
          Aplicar
        </Button>
      </div>
      <MutationAlert feedback={mutation} />
    </form>
  );
}

function AssignProjectForm({
  challenge,
  assigned,
  mutation,
  onDone,
}: {
  challenge: Challenge;
  assigned: Set<string>;
  mutation: MutationHandle<AsignarRetoProyectoInput>;
  onDone: () => void;
}) {
  const projects = useProjects();
  const [idProyecto, setIdProyecto] = useState("");
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [error, setError] = useState<string | null>(null);
  const options = useMemo(
    () => (projects.data ?? []).filter((p) => !assigned.has(p.id)).map((p) => ({ value: p.id, label: p.titulo })),
    [projects.data, assigned]
  );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = assignChallengeFormSchema.safeParse({ idProyecto, fechaEntrega });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Datos no válidos.");
      return;
    }
    setError(null);
    const result = await mutation.run({
      idReto: challenge.id,
      idProyecto: parsed.data.idProyecto,
      fechaEntrega: nullableTrim(parsed.data.fechaEntrega),
    });
    if (result.success) {
      setIdProyecto("");
      setFechaEntrega("");
      onDone();
    }
  };

  return (
    <form noValidate onSubmit={(event) => void submit(event)} className="space-y-3 rounded-lg border border-slate-200 p-3">
      <p className="text-sm font-semibold text-slate-800">Relacionar con proyecto</p>
      <fieldset disabled={mutation.isSubmitting} className="grid gap-3 sm:grid-cols-2">
        <SelectField
          aria-label="Proyecto"
          options={options}
          placeholder={projects.isLoading ? "Cargando proyectos..." : "Selecciona un proyecto"}
          value={idProyecto}
          onChange={(e) => setIdProyecto(e.target.value)}
        />
        <Input type="date" aria-label="Fecha de entrega" value={fechaEntrega} onChange={(e) => setFechaEntrega(e.target.value)} />
      </fieldset>
      <FieldError message={error ?? projects.error} />
      <MutationAlert feedback={mutation} />
      <FormActions
        isSubmitting={mutation.isSubmitting}
        disabled={Boolean(mutation.pendingBackend)}
        submitLabel="Asignar"
        onCancel={() => {
          setIdProyecto("");
          setFechaEntrega("");
          mutation.reset();
        }}
      />
    </form>
  );
}

function ChallengeDetailBody({ challenge, estadoMutation, assignMutation, avanceMutation, revisarMutation, onChanged }: Omit<ChallengeDetailModalProps, "onClose"> & { challenge: Challenge }) {
  const compliance = useChallengeCompliance(challenge.id);
  const rows = useMemo(() => compliance.data ?? [], [compliance.data]);
  const assigned = useMemo(() => new Set(rows.flatMap((row) => (row.proyectoId ? [row.proyectoId] : []))), [rows]);

  return (
    <div className="space-y-5">
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DetailField label="Nivel">{challenge.nivel}</DetailField>
        <DetailField label="Estado">
          <StatusBadge value={challenge.estado} />
        </DetailField>
        <DetailField label="Descripción" wide>
          <NullableText value={challenge.descripcion} />
        </DetailField>
      </dl>

      {estadoMutation && <EstadoForm challenge={challenge} mutation={estadoMutation} onDone={onChanged} />}

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-900">Proyectos y cumplimiento</h3>
        {compliance.isLoading && !compliance.data ? (
          <LoadingState message="Cargando cumplimiento..." />
        ) : compliance.error ? (
          <ErrorState message="No fue posible cargar el cumplimiento." detail={compliance.error} onRetry={compliance.reload} />
        ) : rows.length === 0 ? (
          <EmptyState message="Este reto no tiene proyectos relacionados visibles para tu usuario." />
        ) : (
          <ComplianceList
            rows={rows}
            avance={avanceMutation}
            revisar={revisarMutation}
            onDone={() => {
              compliance.reload();
              onChanged();
            }}
          />
        )}
      </section>

      {assignMutation && (
        <AssignProjectForm
          challenge={challenge}
          assigned={assigned}
          mutation={assignMutation}
          onDone={() => {
            compliance.reload();
            onChanged();
          }}
        />
      )}
    </div>
  );
}

export function ChallengeDetailModal({ challenge, onClose, ...props }: ChallengeDetailModalProps) {
  return (
    <Modal
      open={challenge !== null}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={challenge ? `${challenge.nivel} · ${challenge.titulo}` : "Reto"}
    >
      {challenge && <ChallengeDetailBody key={challenge.id} challenge={challenge} {...props} />}
    </Modal>
  );
}
