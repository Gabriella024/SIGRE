import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DetailField } from "@/components/ui/detail-section";
import { Form, FormControl, FormDescription, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";

import { RequiredLabel } from "../EntrepreneurProfileFields";
import {
  entrepreneurStatusFormSchema,
  type EntrepreneurStatusFormValues,
} from "../../schemas/entrepreneursSchema";

import type {
  EntrepreneurDetail,
  EntrepreneurErrorReason,
  EntrepreneurStatusTarget,
  EntrepreneurUpdateResult,
} from "../../types/entrepreneur";

export interface EntrepreneurStatusSubmission {
  isSubmitting: boolean;
  error: string | null;
  reason: EntrepreneurErrorReason;
  conflict: boolean;
  onSubmit: (target: EntrepreneurStatusTarget, justificacion: string) => Promise<EntrepreneurUpdateResult>;
}

interface EntrepreneurStatusModalProps {
  entrepreneur: EntrepreneurDetail;
  target: EntrepreneurStatusTarget;
  open: boolean;
  submission: EntrepreneurStatusSubmission;
  onClose: () => void;
  onReload: () => void;
}

const COPY = {
  inactivo: {
    title: "Desactivar emprendedor",
    action: "Desactivar",
    consequence:
      "Mientras esté inactivo no podrá asignársele orientador ni asociársele nuevos proyectos. El orientador asignado, los proyectos, inscripciones y asistencias registrados no se modifican.",
    buttonClass: "bg-rose-600 hover:bg-rose-700",
  },
  activo: {
    title: "Activar emprendedor",
    action: "Activar",
    consequence:
      "El emprendedor volverá a estar disponible para asignación de orientador y creación de proyectos.",
    buttonClass: "bg-lime-500 hover:bg-lime-600",
  },
} as const;

function EntrepreneurStatusForm({
  entrepreneur,
  target,
  submission,
  onClose,
  onReload,
}: Omit<EntrepreneurStatusModalProps, "open">) {
  const form = useForm<EntrepreneurStatusFormValues>({
    resolver: zodResolver(entrepreneurStatusFormSchema),
    defaultValues: { justificacion: "" },
    mode: "onChange",
  });
  const copy = COPY[target.estadoNuevo];
  const { isSubmitting, error, reason, conflict, onSubmit } = submission;
  const needsReload = conflict || reason === "registro";
  const offerReload = needsReload || reason === "estado";
  const canSave = form.formState.isValid && !isSubmitting && !needsReload;

  const submit = async (values: EntrepreneurStatusFormValues) => {
    await onSubmit(target, values.justificacion);
  };

  return (
    <Form {...form}>
      <form noValidate onSubmit={form.handleSubmit(submit)} className="space-y-4" aria-busy={isSubmitting}>
        <dl className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
          <DetailField label="Emprendedor">{entrepreneur.nombre}</DetailField>
          <DetailField label="Estado actual">
            <StatusBadge value={target.estadoActual} />
          </DetailField>
          <DetailField label="Estado solicitado">
            <StatusBadge value={target.estadoNuevo} />
          </DetailField>
        </dl>

        <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {copy.title}
          </p>
          <p>{copy.consequence}</p>
        </div>

        <fieldset disabled={isSubmitting || needsReload} className="space-y-4">
          <FormField
            control={form.control}
            name="justificacion"
            render={({ field }) => (
              <FormItem>
                <RequiredLabel required>Justificación</RequiredLabel>
                <FormControl>
                  <Textarea rows={4} placeholder="Describe el motivo del cambio de estado" {...field} />
                </FormControl>
                <FormDescription>Quedará registrada en la auditoría del emprendedor.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </fieldset>

        {error && (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between"
          >
            <p>{error}</p>
            {offerReload && (
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
          <Button type="submit" className={`gap-2 ${copy.buttonClass}`} disabled={!canSave}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? "Guardando..." : copy.action}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export function EntrepreneurStatusModal({
  entrepreneur,
  target,
  open,
  submission,
  onClose,
  onReload,
}: EntrepreneurStatusModalProps) {
  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next && !submission.isSubmitting) onClose();
      }}
      title={COPY[target.estadoNuevo].title}
      description="Los campos marcados con * son obligatorios."
    >
      {open && (
        <EntrepreneurStatusForm
          entrepreneur={entrepreneur}
          target={target}
          submission={submission}
          onClose={onClose}
          onReload={onReload}
        />
      )}
    </Modal>
  );
}
