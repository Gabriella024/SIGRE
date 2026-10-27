import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DetailField } from "@/components/ui/detail-section";
import { Form, FormControl, FormDescription, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { MutationAlert } from "@/components/ui/mutation-alert";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import { RequiredLabel } from "@/features/entrepreneurs/components/EntrepreneurProfileFields";

import { userStatusFormSchema, type UserStatusFormValues } from "../schemas/userSchema";
import { MISSING_VERSION_MESSAGE } from "../utils/userUtils";

import type { MutationFeedback } from "@/hooks/useAdminMutation";
import type { MutationResult } from "@/lib/adminOperation";
import type { User, UserStatusTarget } from "../types/users";

interface UserStatusModalProps {
  user: User | null;
  target: UserStatusTarget | null;
  feedback: MutationFeedback;
  onSubmit: (target: UserStatusTarget, justificacion: string) => Promise<MutationResult>;
  onClose: () => void;
  onReload: () => void;
}

const COPY = {
  inactivo: {
    title: "Desactivar usuario",
    action: "Desactivar",
    consequence: "El usuario no podrá ingresar a SIGRE mientras esté inactivo. Sus registros asociados no se modifican.",
    buttonClass: "bg-rose-600 hover:bg-rose-700",
  },
  activo: {
    title: "Activar usuario",
    action: "Activar",
    consequence: "El usuario podrá volver a ingresar a SIGRE con los roles que tenga asignados.",
    buttonClass: "bg-lime-500 hover:bg-lime-600",
  },
} as const;

function UserStatusForm({
  user,
  target,
  feedback,
  onSubmit,
  onClose,
  onReload,
}: Omit<UserStatusModalProps, "user" | "target"> & { user: User; target: UserStatusTarget }) {
  const form = useForm<UserStatusFormValues>({
    resolver: zodResolver(userStatusFormSchema),
    defaultValues: { justificacion: "" },
    mode: "onChange",
  });
  const copy = COPY[target.estadoNuevo];
  const blocked = feedback.isSubmitting || feedback.conflict;

  const submit = async (values: UserStatusFormValues) => {
    const result = await onSubmit(target, values.justificacion);
    if (result.success) onClose();
  };

  return (
    <Form {...form}>
      <form noValidate onSubmit={form.handleSubmit(submit)} className="space-y-4" aria-busy={feedback.isSubmitting}>
        <dl className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
          <DetailField label="Usuario">{user.nombre}</DetailField>
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

        <fieldset disabled={blocked}>
          <FormField
            control={form.control}
            name="justificacion"
            render={({ field }) => (
              <FormItem>
                <RequiredLabel required>Justificación</RequiredLabel>
                <FormControl>
                  <Textarea rows={4} placeholder="Describe el motivo del cambio de estado" {...field} />
                </FormControl>
                <FormDescription>Quedará registrada en la auditoría del usuario.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </fieldset>

        <MutationAlert feedback={feedback} onReload={onReload} />

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={feedback.isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            className={`gap-2 ${copy.buttonClass}`}
            disabled={blocked || feedback.pendingBackend !== null || !form.formState.isValid}
          >
            {feedback.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {feedback.isSubmitting ? "Guardando..." : copy.action}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export function UserStatusModal({ user, target, ...props }: UserStatusModalProps) {
  return (
    <Modal
      open={user !== null}
      onOpenChange={(next) => {
        if (!next && !props.feedback.isSubmitting) props.onClose();
      }}
      title={target ? COPY[target.estadoNuevo].title : "Cambiar estado"}
      description="Los campos marcados con * son obligatorios."
    >
      {user && target && <UserStatusForm key={user.id} user={user} target={target} {...props} />}
      {user && !target && (
        <div className="space-y-4">
          <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {MISSING_VERSION_MESSAGE}
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <Button type="button" variant="outline" onClick={props.onClose}>
              Cerrar
            </Button>
            <Button type="button" onClick={props.onReload}>
              Recargar listado
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
