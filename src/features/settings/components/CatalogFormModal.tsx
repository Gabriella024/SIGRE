import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { MutationAlert } from "@/components/ui/mutation-alert";
import { PendingIntegrationNotice } from "@/components/ui/pending-integration";

import type { MutationFeedback } from "@/hooks/useAdminMutation";
import type { MutationResult } from "@/lib/adminOperation";

export interface CatalogField<K extends string> {
  name: K;
  label: string;
  placeholder?: string;
}

interface CatalogFormModalProps<K extends string> {
  open: boolean;
  title: string;
  fields: readonly CatalogField<K>[];
  initialValues: Record<K, string>;
  schema: z.ZodType<Record<K, string>>;
  feedback: MutationFeedback;
  blockedReason?: string | null;
  onSubmit: (values: Record<K, string>) => Promise<MutationResult<unknown>>;
  onClose: () => void;
  onReload: () => void;
}

function CatalogForm<K extends string>({
  fields,
  initialValues,
  schema,
  feedback,
  blockedReason,
  onSubmit,
  onClose,
  onReload,
}: Omit<CatalogFormModalProps<K>, "open" | "title">) {
  const blocked = Boolean(blockedReason || feedback.pendingBackend);
  const [values, setValues] = useState<Record<K, string>>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<K, string>>>({});

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (blocked) return;
    const parsed = schema.safeParse(values);

    if (!parsed.success) {
      const next: Partial<Record<K, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as K;
        next[key] ??= issue.message;
      }
      setErrors(next);
      return;
    }

    setErrors({});
    const result = await onSubmit(parsed.data);
    if (result.success) onClose();
  };

  return (
    <form noValidate onSubmit={(event) => void submit(event)} className="space-y-4" aria-busy={feedback.isSubmitting}>
      <fieldset disabled={feedback.isSubmitting} className="space-y-4">
        {fields.map((field) => (
          <div key={field.name} className="space-y-1.5">
            <Label htmlFor={`catalog-${field.name}`}>{field.label} *</Label>
            <Input
              id={`catalog-${field.name}`}
              value={values[field.name]}
              placeholder={field.placeholder}
              aria-invalid={Boolean(errors[field.name])}
              onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
            />
            {errors[field.name] && <p className="text-xs text-rose-600">{errors[field.name]}</p>}
          </div>
        ))}
      </fieldset>

      {blockedReason && <PendingIntegrationNotice title="Operación bloqueada">{blockedReason}</PendingIntegrationNotice>}
      <MutationAlert feedback={feedback} onReload={onReload} />

      <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onClose} disabled={feedback.isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" className="gap-2 bg-[#39a900] hover:bg-[#2f8f00]" disabled={feedback.isSubmitting || blocked}>
          {feedback.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {feedback.isSubmitting ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </form>
  );
}

export function CatalogFormModal<K extends string>({ open, title, onClose, ...props }: CatalogFormModalProps<K>) {
  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next && !props.feedback.isSubmitting) onClose();
      }}
      title={title}
      description="Los campos marcados con * son obligatorios."
    >
      {open && <CatalogForm {...props} onClose={onClose} />}
    </Modal>
  );
}
