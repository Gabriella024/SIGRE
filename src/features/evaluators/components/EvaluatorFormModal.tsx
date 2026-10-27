import { useCallback, useMemo, useState, type FormEvent } from "react";

import { FormActions } from "@/components/ui/form-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { MutationAlert } from "@/components/ui/mutation-alert";
import { FieldError, SelectField } from "@/components/ui/select-field";
import { Textarea } from "@/components/ui/textarea";
import { getAllUsers } from "@/features/users/services/usersService";
import { useUserScopedQuery } from "@/hooks/useUserScopedQuery";
import { nullableTrim, toFieldErrors, type FieldErrors } from "@/lib/formErrors";
import { normalizeText } from "@/lib/format";

import type { MutationFeedback } from "@/hooks/useAdminMutation";
import type { MutationResult } from "@/lib/adminOperation";

import { evaluatorFormSchema, type EvaluatorFormValues } from "../schemas/evaluatorsSchema";
import type { Evaluator, GuardarEvaluadorInput } from "../types/evaluators";

interface EvaluatorFormModalProps {
  open: boolean;
  evaluator: Evaluator | null;
  registeredUserIds: ReadonlySet<string>;
  feedback: MutationFeedback;
  onSubmit: (input: GuardarEvaluadorInput) => Promise<MutationResult>;
  onClose: () => void;
  onReload: () => void;
}

function useEligibleEvaluatorUsers(enabled: boolean, registered: ReadonlySet<string>) {
  const fetcher = useCallback(() => (enabled ? getAllUsers() : Promise.resolve([])), [enabled]);
  const query = useUserScopedQuery(fetcher);
  const options = useMemo(
    () =>
      (query.data ?? [])
        .filter(
          (user) =>
            !registered.has(user.id) &&
            normalizeText(user.estado) === "activo" &&
            user.roles.some((role) => normalizeText(role.rol) === "evaluador")
        )
        .map((user) => ({ value: user.id, label: `${user.nombre}${user.numeroDocumento ? ` · ${user.numeroDocumento}` : ""}` })),
    [query.data, registered]
  );
  return { options, isLoading: query.isLoading, error: query.error };
}

function EvaluatorForm({ evaluator, registeredUserIds, feedback, onSubmit, onClose, onReload }: Omit<EvaluatorFormModalProps, "open">) {
  const users = useEligibleEvaluatorUsers(evaluator === null, registeredUserIds);
  const [values, setValues] = useState<EvaluatorFormValues>({
    idUsuario: evaluator?.usuarioId ?? "",
    especialidad: evaluator?.especialidad ?? "",
    entidad: evaluator?.entidad ?? "",
    experiencia: evaluator?.experiencia ?? "",
  });
  const [errors, setErrors] = useState<FieldErrors<keyof EvaluatorFormValues>>({});
  const set = (key: keyof EvaluatorFormValues) => (value: string) => setValues((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = evaluatorFormSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error.issues));
      return;
    }
    setErrors({});
    const result = await onSubmit({
      idEvaluador: evaluator?.id ?? null,
      idUsuario: parsed.data.idUsuario,
      updatedAtEsperado: evaluator?.updatedAt ?? null,
      especialidad: parsed.data.especialidad,
      entidad: nullableTrim(parsed.data.entidad),
      experiencia: nullableTrim(parsed.data.experiencia),
    });
    if (result.success) onClose();
  };

  return (
    <form noValidate onSubmit={(event) => void submit(event)} className="space-y-4">
      <fieldset disabled={feedback.isSubmitting} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="evaluador-usuario">Usuario *</Label>
          {evaluator ? (
            <Input id="evaluador-usuario" value={evaluator.nombre ?? evaluator.correo ?? ""} disabled />
          ) : (
            <SelectField
              id="evaluador-usuario"
              options={users.options}
              placeholder={users.isLoading ? "Cargando usuarios..." : "Usuarios activos con rol evaluador"}
              value={values.idUsuario}
              onChange={(e) => set("idUsuario")(e.target.value)}
            />
          )}
          <FieldError message={errors.idUsuario ?? users.error} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="evaluador-especialidad">Especialidad *</Label>
          <Input id="evaluador-especialidad" value={values.especialidad} onChange={(e) => set("especialidad")(e.target.value)} />
          <FieldError message={errors.especialidad} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="evaluador-entidad">Entidad</Label>
          <Input id="evaluador-entidad" value={values.entidad} onChange={(e) => set("entidad")(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="evaluador-experiencia">Experiencia</Label>
          <Textarea id="evaluador-experiencia" value={values.experiencia} onChange={(e) => set("experiencia")(e.target.value)} />
        </div>
      </fieldset>

      <MutationAlert feedback={feedback} onReload={onReload} />
      <FormActions isSubmitting={feedback.isSubmitting} disabled={Boolean(feedback.pendingBackend)} onCancel={onClose} />
    </form>
  );
}

export function EvaluatorFormModal({ open, evaluator, onClose, ...props }: EvaluatorFormModalProps) {
  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next && !props.feedback.isSubmitting) onClose();
      }}
      title={evaluator ? "Editar evaluador" : "Nuevo evaluador"}
      description="Los campos marcados con * son obligatorios."
    >
      {open && <EvaluatorForm key={evaluator?.id ?? "new"} evaluator={evaluator} onClose={onClose} {...props} />}
    </Modal>
  );
}
