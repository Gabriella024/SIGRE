import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DetailField } from "@/components/ui/detail-section";
import { Form } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";

import { EntrepreneurProfileFields } from "../EntrepreneurProfileFields";
import { LinkedUserSummary } from "../LinkedUserSummary";
import { useCentrosSena } from "../../hooks/useCentrosSena";
import { entrepreneurEditFormSchema, type EntrepreneurEditFormValues } from "../../schemas/entrepreneursSchema";
import { toEntrepreneurEditTarget, toEntrepreneurEditValues } from "../../utils/entrepreneurUtils";

import type {
  EntrepreneurDetail,
  EntrepreneurEditTarget,
  EntrepreneurErrorReason,
  EntrepreneurUpdateResult,
} from "../../types/entrepreneur";

export interface EntrepreneurEditSubmission {
  isSubmitting: boolean;
  error: string | null;
  reason: EntrepreneurErrorReason;
  conflict: boolean;
  onSubmit: (target: EntrepreneurEditTarget, values: EntrepreneurEditFormValues) => Promise<EntrepreneurUpdateResult>;
}

interface EntrepreneurEditModalProps {
  entrepreneur: EntrepreneurDetail;
  open: boolean;
  submission: EntrepreneurEditSubmission;
  onClose: () => void;
  onReload: () => void;
}

function EntrepreneurEditForm({
  entrepreneur,
  submission,
  onClose,
  onReload,
}: Omit<EntrepreneurEditModalProps, "open">) {
  const target = useMemo(() => toEntrepreneurEditTarget(entrepreneur), [entrepreneur]);
  const form = useForm<EntrepreneurEditFormValues>({
    resolver: zodResolver(entrepreneurEditFormSchema),
    defaultValues: toEntrepreneurEditValues(entrepreneur),
    mode: "onChange",
  });
  const centros = useCentrosSena();
  const { isSubmitting, error, reason, conflict, onSubmit } = submission;
  const needsReload = conflict || reason === "registro";

  const submit = async (values: EntrepreneurEditFormValues) => {
    const result = await onSubmit(target, values);
    if (!result.success && result.reason === "centro") centros.reload();
  };

  const { isDirty, isValid } = form.formState;
  const canSave = isDirty && isValid && !isSubmitting && !needsReload;

  return (
    <Form {...form}>
      <form noValidate onSubmit={form.handleSubmit(submit)} className="space-y-4" aria-busy={isSubmitting}>
        <dl className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
          <DetailField label="Usuario vinculado (no editable)">
            <LinkedUserSummary
              linkedId={entrepreneur.usuarioId}
              usuario={entrepreneur.usuario}
              emptyLabel="Sin cuenta vinculada"
            />
          </DetailField>
          <DetailField label="Estado actual">
            <StatusBadge value={entrepreneur.estado} />
          </DetailField>
          <DetailField label="Orientador asignado">
            <LinkedUserSummary
              linkedId={entrepreneur.orientadorId}
              usuario={entrepreneur.orientador}
              emptyLabel="Sin orientador asignado"
            />
          </DetailField>
        </dl>

        <fieldset disabled={isSubmitting || needsReload} className="space-y-4">
          <EntrepreneurProfileFields
            centros={centros}
            nombreDescription="Nombre con el que se identifica al emprendedor en SIGRE."
            centroHint={entrepreneur.centro}
          />
        </fieldset>

        {error && (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between"
          >
            <p>{error}</p>
            {needsReload && (
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={onReload}>
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                Recargar ficha
              </Button>
            )}
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" className="gap-2" disabled={!canSave}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export function EntrepreneurEditModal({ entrepreneur, open, submission, onClose, onReload }: EntrepreneurEditModalProps) {
  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next && !submission.isSubmitting) onClose();
      }}
      title="Editar emprendedor"
      description="Los campos marcados con * son obligatorios."
    >
      {open && (
        <EntrepreneurEditForm
          entrepreneur={entrepreneur}
          submission={submission}
          onClose={onClose}
          onReload={onReload}
        />
      )}
    </Modal>
  );
}
