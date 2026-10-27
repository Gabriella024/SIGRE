import { useMemo, useState, type FormEvent } from "react";

import { FormActions } from "@/components/ui/form-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { MutationAlert } from "@/components/ui/mutation-alert";
import { FieldError, SelectField } from "@/components/ui/select-field";
import { Textarea } from "@/components/ui/textarea";
import { useProjects } from "@/features/projects/hooks/useProyects";
import { nullableTrim, toFieldErrors, type FieldErrors } from "@/lib/formErrors";
import { normalizeText } from "@/lib/format";

import type { MutationHandle } from "@/hooks/useAdminMutation";

import { PITCH_MODALIDADES, pitchFormSchema, type PitchFormValues } from "../schemas/pitchSchema";
import { toDateTimeLocal } from "../utils/pitchUtils";
import type { GuardarPitchInput, Pitch } from "../types/pitch";

interface PitchFormModalProps {
  open: boolean;
  pitch: Pitch | null;
  mutation: MutationHandle<GuardarPitchInput>;
  onClose: () => void;
  onSaved: () => void;
}

function PitchForm({ pitch, mutation, onClose, onSaved }: Omit<PitchFormModalProps, "open">) {
  const projects = useProjects();
  const [values, setValues] = useState<PitchFormValues>({
    idProyecto: pitch?.proyectoId ?? "",
    fechaHora: toDateTimeLocal(pitch?.fechaHora ?? null),
    modalidad: normalizeText(pitch?.modalidad) === "virtual" ? "virtual" : "presencial",
    lugarLink: pitch?.lugarLink ?? "",
    observacion: pitch?.observacion ?? "",
  });
  const [errors, setErrors] = useState<FieldErrors<keyof PitchFormValues>>({});
  const set = (key: keyof PitchFormValues) => (value: string) => setValues((current) => ({ ...current, [key]: value }));
  const projectOptions = useMemo(
    () => (projects.data ?? []).map((project) => ({ value: project.id, label: project.titulo })),
    [projects.data]
  );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = pitchFormSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error.issues));
      return;
    }
    setErrors({});
    const result = await mutation.run({
      idPitch: pitch?.id ?? null,
      updatedAtEsperado: pitch?.updatedAt ?? null,
      idProyecto: parsed.data.idProyecto,
      fechaHora: new Date(parsed.data.fechaHora).toISOString(),
      modalidad: parsed.data.modalidad,
      lugarLink: nullableTrim(parsed.data.lugarLink),
      estado: pitch?.estado ?? "programado",
      observacion: nullableTrim(parsed.data.observacion),
    });
    if (!result.success) return;
    onSaved();
    onClose();
  };

  return (
    <form noValidate onSubmit={(event) => void submit(event)} className="space-y-4">
      <fieldset disabled={mutation.isSubmitting} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="pitch-proyecto">Proyecto *</Label>
          <SelectField
            id="pitch-proyecto"
            options={projectOptions}
            placeholder={projects.isLoading ? "Cargando proyectos..." : "Selecciona un proyecto"}
            value={values.idProyecto}
            disabled={pitch !== null}
            onChange={(e) => set("idProyecto")(e.target.value)}
          />
          <FieldError message={errors.idProyecto ?? projects.error} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="pitch-fecha">Fecha y hora *</Label>
            <Input id="pitch-fecha" type="datetime-local" value={values.fechaHora} onChange={(e) => set("fechaHora")(e.target.value)} />
            <FieldError message={errors.fechaHora} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pitch-modalidad">Modalidad *</Label>
            <SelectField id="pitch-modalidad" options={PITCH_MODALIDADES} value={values.modalidad} onChange={(e) => set("modalidad")(e.target.value)} />
            <FieldError message={errors.modalidad} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pitch-lugar">{values.modalidad === "virtual" ? "Enlace de la reunión" : "Lugar"}</Label>
          <Input id="pitch-lugar" value={values.lugarLink} onChange={(e) => set("lugarLink")(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pitch-observacion">Observación</Label>
          <Textarea id="pitch-observacion" value={values.observacion} onChange={(e) => set("observacion")(e.target.value)} />
        </div>
      </fieldset>

      <MutationAlert feedback={mutation} onReload={onSaved} />
      <FormActions isSubmitting={mutation.isSubmitting} disabled={Boolean(mutation.pendingBackend)} onCancel={onClose} />
    </form>
  );
}

export function PitchFormModal({ open, pitch, onClose, ...props }: PitchFormModalProps) {
  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next && !props.mutation.isSubmitting) onClose();
      }}
      title={pitch ? "Editar pitch" : "Programar pitch"}
      description="Los campos marcados con * son obligatorios."
    >
      {open && <PitchForm key={pitch?.id ?? "new"} pitch={pitch} onClose={onClose} {...props} />}
    </Modal>
  );
}
