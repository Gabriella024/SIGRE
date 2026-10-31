import { useState, type FormEvent } from "react";

import { FormActions } from "@/components/ui/form-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { MutationAlert } from "@/components/ui/mutation-alert";
import { FieldError, SelectField } from "@/components/ui/select-field";
import { Textarea } from "@/components/ui/textarea";
import { nullableTrim, toFieldErrors, type FieldErrors } from "@/lib/formErrors";

import type { MutationFeedback } from "@/hooks/useAdminMutation";
import type { MutationResult } from "@/lib/adminOperation";

import { RETO_ESTADOS, challengeFormSchema, type ChallengeFormValues } from "../schemas/challengesSchema";
import type { Challenge, GuardarRetoInput } from "../types/Challenge";

interface ChallengeFormModalProps {
  open: boolean;
  challenge: Challenge | null;
  feedback: MutationFeedback;
  onSubmit: (input: GuardarRetoInput) => Promise<MutationResult>;
  onClose: () => void;
  onReload: () => void;
}

function toValues(challenge: Challenge | null): ChallengeFormValues {
  return {
    titulo: challenge?.titulo ?? "",
    descripcion: challenge?.descripcion ?? "",
    orden: challenge?.orden?.toString() ?? "",
    estado: challenge?.estado ?? "programado",
  };
}

function ChallengeForm({ challenge, feedback, onSubmit, onClose, onReload }: Omit<ChallengeFormModalProps, "open">) {
  const [values, setValues] = useState<ChallengeFormValues>(() => toValues(challenge));
  const [errors, setErrors] = useState<FieldErrors<keyof ChallengeFormValues>>({});
  const set = (key: keyof ChallengeFormValues) => (value: string) => setValues((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = challengeFormSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error.issues));
      return;
    }
    setErrors({});
    const result = await onSubmit({
      idReto: challenge?.id ?? null,
      updatedAtEsperado: challenge?.updatedAt ?? null,
      titulo: parsed.data.titulo,
      descripcion: nullableTrim(parsed.data.descripcion),
      orden: Number(parsed.data.orden),
      estado: parsed.data.estado,
    });
    if (result.success) {
      onReload();
      onClose();
    }
  };

  return (
    <form noValidate onSubmit={(event) => void submit(event)} className="space-y-4">
      <fieldset disabled={feedback.isSubmitting} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="reto-titulo">Título *</Label>
          <Input id="reto-titulo" value={values.titulo} onChange={(e) => set("titulo")(e.target.value)} />
          <FieldError message={errors.titulo} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="reto-orden">Nivel (R#) *</Label>
            <Input id="reto-orden" inputMode="numeric" value={values.orden} onChange={(e) => set("orden")(e.target.value)} />
            <FieldError message={errors.orden} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reto-estado">Estado *</Label>
            <SelectField id="reto-estado" options={RETO_ESTADOS} value={values.estado} onChange={(e) => set("estado")(e.target.value)} />
            <FieldError message={errors.estado} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reto-descripcion">Descripción</Label>
          <Textarea id="reto-descripcion" value={values.descripcion} onChange={(e) => set("descripcion")(e.target.value)} />
        </div>
      </fieldset>

      <MutationAlert feedback={feedback} onReload={onReload} />
      <FormActions isSubmitting={feedback.isSubmitting} disabled={Boolean(feedback.pendingBackend)} onCancel={onClose} />
    </form>
  );
}

export function ChallengeFormModal({ open, challenge, onClose, ...props }: ChallengeFormModalProps) {
  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next && !props.feedback.isSubmitting) onClose();
      }}
      title={challenge ? "Editar reto" : "Nuevo reto"}
      description="Los campos marcados con * son obligatorios."
    >
      {open && <ChallengeForm key={challenge?.id ?? "new"} challenge={challenge} onClose={onClose} {...props} />}
    </Modal>
  );
}
