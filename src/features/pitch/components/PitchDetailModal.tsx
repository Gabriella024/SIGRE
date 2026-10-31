import { useCallback, useMemo, useState, type FormEvent } from "react";
import { UserMinus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DetailField } from "@/components/ui/detail-section";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { MutationAlert } from "@/components/ui/mutation-alert";
import { NullableText } from "@/components/ui/nullable-text";
import { PendingIntegrationNotice } from "@/components/ui/pending-integration";
import { FieldError, SelectField } from "@/components/ui/select-field";
import { StatusBadge } from "@/components/ui/status-badge";
import { getEvaluators } from "@/features/evaluators/service/evaluatorsService";
import {
  MAX_EVALUADORES_POR_PITCH,
  MIN_EVALUADORES_POR_PITCH,
  isActiveEvaluator,
} from "@/features/evaluators/utils/evaluatorUtils";
import { useUserScopedQuery } from "@/hooks/useUserScopedQuery";
import { formatStatusLabel } from "@/lib/format";

import type { MutationHandle } from "@/hooks/useAdminMutation";

import { PITCH_ESTADOS } from "../schemas/pitchSchema";
import { canAssignMoreEvaluators, canRemoveEvaluators, formatDateTime, pitchEstadoBlockReason, pitchEstadoLabel } from "../utils/pitchUtils";
import type {
  AsignarEvaluadorPitchInput,
  CambiarEstadoPitchInput,
  Pitch,
  RetirarEvaluadorPitchInput,
} from "../types/pitch";

export interface PitchManagement {
  cambiarEstado: MutationHandle<CambiarEstadoPitchInput>;
  asignar: MutationHandle<AsignarEvaluadorPitchInput>;
  retirar: MutationHandle<RetirarEvaluadorPitchInput>;
}

interface PitchDetailModalProps {
  pitch: Pitch | null;
  management?: PitchManagement;
  onClose: () => void;
  onChanged: () => void;
}

function EstadoForm({ pitch, mutation, onDone }: { pitch: Pitch; mutation: MutationHandle<CambiarEstadoPitchInput>; onDone: () => void }) {
  const [estado, setEstado] = useState(pitch.estado ?? "");
  const blockReason = pitchEstadoBlockReason(pitch, estado);
  const unchanged = estado === (pitch.estado ?? "");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (unchanged || blockReason || !pitch.updatedAt) return;
    const result = await mutation.run({ idPitch: pitch.id, estado, updatedAtEsperado: pitch.updatedAt });
    if (result.success) onDone();
  };

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-2">
      <Label htmlFor="pitch-cambiar-estado">Cambiar estado</Label>
      <div className="flex gap-2">
        <SelectField id="pitch-cambiar-estado" options={PITCH_ESTADOS} value={estado} onChange={(e) => setEstado(e.target.value)} />
        <Button
          type="submit"
          variant="outline"
          disabled={unchanged || Boolean(blockReason) || mutation.isSubmitting || Boolean(mutation.pendingBackend)}
        >
          Aplicar
        </Button>
      </div>
      <FieldError message={blockReason} />
      <MutationAlert feedback={mutation} onReload={onDone} />
    </form>
  );
}

function AssignEvaluatorForm({ pitch, mutation, onDone }: { pitch: Pitch; mutation: MutationHandle<AsignarEvaluadorPitchInput>; onDone: () => void }) {
  const evaluators = useUserScopedQuery(getEvaluators);
  const [idEvaluador, setIdEvaluador] = useState("");
  const full = !canAssignMoreEvaluators(pitch);
  const options = useMemo(() => {
    const assigned = new Set(pitch.evaluadores.map((item) => item.evaluadorId));
    return (evaluators.data ?? [])
      .filter((item) => isActiveEvaluator(item) && !assigned.has(item.id))
      .map((item) => ({
        value: item.id,
        label: `${item.nombre ?? "Sin nombre"}${item.especialidad ? ` · ${item.especialidad}` : ""} (${item.asignaciones} asignaciones)`,
      }));
  }, [evaluators.data, pitch.evaluadores]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (full || !idEvaluador) return;
    const result = await mutation.run({ idPitch: pitch.id, idEvaluador });
    if (!result.success) return;
    setIdEvaluador("");
    onDone();
  };

  if (full) {
    return <p className="text-xs text-slate-500">El pitch ya tiene el máximo de {MAX_EVALUADORES_POR_PITCH} evaluadores.</p>;
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-2">
      <Label htmlFor="pitch-asignar-evaluador">Asignar evaluador</Label>
      <div className="flex gap-2">
        <SelectField
          id="pitch-asignar-evaluador"
          options={options}
          placeholder={evaluators.isLoading ? "Cargando evaluadores..." : "Evaluadores activos disponibles"}
          value={idEvaluador}
          onChange={(e) => setIdEvaluador(e.target.value)}
        />
        <Button type="submit" variant="outline" disabled={!idEvaluador || mutation.isSubmitting || Boolean(mutation.pendingBackend)}>
          Asignar
        </Button>
      </div>
      <FieldError message={evaluators.error} />
      <MutationAlert feedback={mutation} onReload={onDone} />
    </form>
  );
}

function PitchDetailBody({ pitch, management, onChanged }: { pitch: Pitch; management?: PitchManagement; onChanged: () => void }) {
  const retirar = canRemoveEvaluators(pitch) ? management?.retirar : undefined;
  const remove = useCallback(
    async (idAsignacion: string, updatedAt: string | null) => {
      if (!retirar || !updatedAt) return;
      const result = await retirar.run({ idAsignacion, updatedAtEsperado: updatedAt });
      if (result.success) onChanged();
    },
    [retirar, onChanged]
  );

  return (
    <div className="space-y-5">
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DetailField label="Proyecto">
          <NullableText value={pitch.proyecto} />
        </DetailField>
        <DetailField label="Emprendedor">
          <NullableText value={pitch.emprendedor} />
        </DetailField>
        <DetailField label="Fecha y hora">
          <NullableText value={formatDateTime(pitch.fechaHora)} />
        </DetailField>
        <DetailField label="Modalidad">
          <NullableText value={pitch.modalidad ? formatStatusLabel(pitch.modalidad) : null} />
        </DetailField>
        <DetailField label="Lugar y link" wide>
          <NullableText value={pitch.lugarLink} className="break-all" />
        </DetailField>
        <DetailField label="Estado">
          <StatusBadge value={pitch.estado} label={pitchEstadoLabel(pitch.estado)} />
        </DetailField>
        <DetailField label="Observación">
          <NullableText value={pitch.observacion} />
        </DetailField>
      </dl>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-900">
          Evaluadores asignados ({pitch.totalEvaluadores}/{MAX_EVALUADORES_POR_PITCH})
        </h3>
        {pitch.totalEvaluadores < MIN_EVALUADORES_POR_PITCH && (
          <PendingIntegrationNotice title="Evaluadores insuficientes">
            Se requieren mínimo {MIN_EVALUADORES_POR_PITCH} evaluadores para confirmar el pitch o iniciar la evaluación.
          </PendingIntegrationNotice>
        )}
        {pitch.evaluadores.length > 0 && (
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            {pitch.evaluadores.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-2 p-3 text-sm">
                <div>
                  <p className="font-medium text-slate-900">{item.nombre ?? "Evaluador"}</p>
                  <p className="text-xs text-slate-500">{item.especialidad ?? "Sin especialidad"}</p>
                </div>
                {retirar && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-rose-600"
                    disabled={retirar.isSubmitting || Boolean(retirar.pendingBackend) || !item.updatedAt}
                    onClick={() => void remove(item.id, item.updatedAt)}
                  >
                    <UserMinus className="h-4 w-4" />
                    Retirar
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
        {retirar && <MutationAlert feedback={retirar} onReload={onChanged} />}
      </section>

      {management && (
        <>
          <AssignEvaluatorForm pitch={pitch} mutation={management.asignar} onDone={onChanged} />
          <EstadoForm pitch={pitch} mutation={management.cambiarEstado} onDone={onChanged} />
        </>
      )}
    </div>
  );
}

export function PitchDetailModal({ pitch, onClose, ...props }: PitchDetailModalProps) {
  return (
    <Modal
      open={pitch !== null}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={pitch?.proyecto ? `Pitch · ${pitch.proyecto}` : "Pitch"}
    >
      {pitch && <PitchDetailBody key={pitch.id} pitch={pitch} {...props} />}
    </Modal>
  );
}
