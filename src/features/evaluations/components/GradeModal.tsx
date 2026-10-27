import { useState, type FormEvent } from "react";

import { FormActions } from "@/components/ui/form-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { MutationAlert } from "@/components/ui/mutation-alert";
import { FieldError, SelectField } from "@/components/ui/select-field";
import { Textarea } from "@/components/ui/textarea";
import { nullableTrim, toFieldErrors, type FieldErrors } from "@/lib/formErrors";

import type { MutationHandle } from "@/hooks/useAdminMutation";

import { RESULTADOS_CALIFICACION, calificacionFormSchema, type CalificacionFormValues } from "../schemas/evaluationsSchema";
import type { Evaluacion, RegistrarCalificacionInput } from "../types/evaluacion";

interface GradeModalProps {
  evaluacion: Evaluacion | null;
  mutation: MutationHandle<RegistrarCalificacionInput>;
  onClose: () => void;
  onSaved: () => void;
}

function GradeForm({ evaluacion, mutation, onClose, onSaved }: GradeModalProps & { evaluacion: Evaluacion }) {
  const [values, setValues] = useState<CalificacionFormValues>({ puntaje: "", resultado: "aprobado", observacion: "" });
  const [errors, setErrors] = useState<FieldErrors<keyof CalificacionFormValues>>({});
  const set = (key: keyof CalificacionFormValues) => (value: string) => setValues((current) => ({ ...current, [key]: value }));
  const alreadyGraded = evaluacion.calificacion !== null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (alreadyGraded) return;
    const parsed = calificacionFormSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error.issues));
      return;
    }
    setErrors({});
    const result = await mutation.run({
      idAsignacion: evaluacion.id,
      puntaje: Number(parsed.data.puntaje),
      resultado: parsed.data.resultado,
      observacion: nullableTrim(parsed.data.observacion),
    });
    if (!result.success) return;
    onSaved();
    onClose();
  };

  return (
    <form noValidate onSubmit={(event) => void submit(event)} className="space-y-4">
      {alreadyGraded && <FieldError message="Ya registraste una calificación para este pitch." />}
      <fieldset disabled={mutation.isSubmitting || alreadyGraded} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="calificacion-puntaje">Puntaje (0–100) *</Label>
            <Input id="calificacion-puntaje" inputMode="decimal" value={values.puntaje} onChange={(e) => set("puntaje")(e.target.value)} />
            <FieldError message={errors.puntaje} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="calificacion-resultado">Resultado *</Label>
            <SelectField id="calificacion-resultado" options={RESULTADOS_CALIFICACION} value={values.resultado} onChange={(e) => set("resultado")(e.target.value)} />
            <FieldError message={errors.resultado} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="calificacion-observacion">Observaciones</Label>
          <Textarea id="calificacion-observacion" value={values.observacion} onChange={(e) => set("observacion")(e.target.value)} />
        </div>
      </fieldset>

      <MutationAlert feedback={mutation} onReload={onSaved} />
      <FormActions
        isSubmitting={mutation.isSubmitting}
        disabled={alreadyGraded || Boolean(mutation.pendingBackend)}
        submitLabel="Registrar calificación"
        onCancel={onClose}
      />
    </form>
  );
}

export function GradeModal({ evaluacion, ...props }: GradeModalProps) {
  return (
    <Modal
      open={evaluacion !== null}
      onOpenChange={(next) => {
        if (!next && !props.mutation.isSubmitting) props.onClose();
      }}
      title={evaluacion?.proyecto ? `Calificar · ${evaluacion.proyecto}` : "Calificar pitch"}
      description="La calificación se registra una sola vez por asignación."
    >
      {evaluacion && <GradeForm key={evaluacion.id} evaluacion={evaluacion} {...props} />}
    </Modal>
  );
}
