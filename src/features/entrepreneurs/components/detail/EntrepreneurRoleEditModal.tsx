import type { ReactNode } from "react";
import { useForm, type UseFormReturn, type FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DetailField } from "@/components/ui/detail-section";
import { Form } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { NullableText } from "@/components/ui/nullable-text";
import { PendingIntegrationNotice } from "@/components/ui/pending-integration";
import { StatusBadge } from "@/components/ui/status-badge";

import { EntrepreneurTextField } from "../EntrepreneurProfileFields";
import { LinkedUserSummary } from "../LinkedUserSummary";
import {
  orientadorEntrepreneurEditFormSchema,
  ownEntrepreneurEditFormSchema,
  type OrientadorEntrepreneurEditFormValues,
  type OwnEntrepreneurEditFormValues,
} from "../../schemas/entrepreneursSchema";
import { ROLE_EDIT_UNAVAILABLE_MESSAGE } from "../../services/entrepreneurRoleEditService";
import {
  PROFILE_TEXT_FIELDS,
  toOrientadorEntrepreneurEditValues,
  toOwnEntrepreneurEditValues,
} from "../../utils/entrepreneurUtils";

import type { RoleEditSubmission } from "../../hooks/useEntrepreneurRoleEdit";
import type { EntrepreneurDetail, EntrepreneurEditorRole, EntrepreneurUpdateResult } from "../../types/entrepreneur";

export interface EntrepreneurRoleEditState {
  saveAvailable: boolean;
  isSubmitting: boolean;
  error: string | null;
  conflict: boolean;
  onSubmit: (submission: RoleEditSubmission) => Promise<EntrepreneurUpdateResult>;
}

interface EntrepreneurRoleEditModalProps {
  entrepreneur: EntrepreneurDetail;
  role: EntrepreneurEditorRole;
  open: boolean;
  state: EntrepreneurRoleEditState;
  onClose: () => void;
  onReload: () => void;
}

type FormProps = Omit<EntrepreneurRoleEditModalProps, "open" | "role">;

const TELEFONO_FIELD = {
  label: "Teléfono de contacto",
  placeholder: "Ej. 300 123 4567",
  type: "tel",
  autoComplete: "tel",
} as const;

function documentoLabel(entrepreneur: EntrepreneurDetail): string | null {
  const usuario = entrepreneur.usuario;
  if (!usuario?.numeroDocumento) return null;
  return usuario.tipoDocumento ? `${usuario.tipoDocumento} ${usuario.numeroDocumento}` : usuario.numeroDocumento;
}

function ReadOnlySummary({ entrepreneur, children }: { entrepreneur: EntrepreneurDetail; children?: ReactNode }) {
  return (
    <dl className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
      {children}
      <DetailField label="Usuario y correo (no editable)">
        <LinkedUserSummary linkedId={entrepreneur.usuarioId} usuario={entrepreneur.usuario} emptyLabel="Sin cuenta vinculada" />
      </DetailField>
      <DetailField label="Documento de identidad (no editable)">
        <NullableText value={documentoLabel(entrepreneur)} />
      </DetailField>
      <DetailField label="Centro SENA (no editable)">
        <NullableText value={entrepreneur.centro} />
      </DetailField>
      <DetailField label="Orientador (no editable)">
        <LinkedUserSummary
          linkedId={entrepreneur.orientadorId}
          usuario={entrepreneur.orientador}
          emptyLabel="Sin orientador asignado"
          showEmail={false}
        />
      </DetailField>
      <DetailField label="Estado (no editable)">
        <StatusBadge value={entrepreneur.estado} />
      </DetailField>
    </dl>
  );
}

function RoleEditFooter<T extends FieldValues>({
  form,
  state,
  onClose,
  onReload,
}: {
  form: UseFormReturn<T>;
  state: EntrepreneurRoleEditState;
  onClose: () => void;
  onReload: () => void;
}) {
  const { saveAvailable, isSubmitting, error, conflict } = state;
  const { isDirty, isValid } = form.formState;
  const canSave = saveAvailable && isDirty && isValid && !isSubmitting && !conflict;

  return (
    <>
      {!saveAvailable && (
        <PendingIntegrationNotice title="Guardado no disponible todavía">
          {ROLE_EDIT_UNAVAILABLE_MESSAGE}
        </PendingIntegrationNotice>
      )}

      {error && error !== ROLE_EDIT_UNAVAILABLE_MESSAGE && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>{error}</p>
          {conflict && (
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={onReload}>
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Recargar ficha
            </Button>
          )}
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          {saveAvailable ? "Cancelar" : "Cerrar"}
        </Button>
        <span title={saveAvailable ? undefined : "Pendiente de la función segura en la base de datos"}>
          <Button type="submit" className="w-full gap-2" disabled={!canSave}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? "Guardando..." : "Guardar cambios"}
          </Button>
        </span>
      </div>
    </>
  );
}

function OrientadorEditForm({ entrepreneur, state, onClose, onReload }: FormProps) {
  const form = useForm<OrientadorEntrepreneurEditFormValues>({
    resolver: zodResolver(orientadorEntrepreneurEditFormSchema),
    defaultValues: toOrientadorEntrepreneurEditValues(entrepreneur),
    mode: "onChange",
  });

  const submit = async (values: OrientadorEntrepreneurEditFormValues) => {
    if (!state.saveAvailable) return;
    await state.onSubmit({ role: "orientador", values });
  };

  return (
    <Form {...form}>
      <form noValidate onSubmit={form.handleSubmit(submit)} className="space-y-4" aria-busy={state.isSubmitting}>
        <ReadOnlySummary entrepreneur={entrepreneur}>
          <DetailField label="Nombre completo (no editable)">{entrepreneur.nombre}</DetailField>
        </ReadOnlySummary>
        <fieldset disabled={state.isSubmitting || state.conflict} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <EntrepreneurTextField control={form.control} name="numero_telefono" {...TELEFONO_FIELD} />
          <EntrepreneurTextField control={form.control} name="programa_formacion" {...PROFILE_TEXT_FIELDS.programa_formacion} />
          <EntrepreneurTextField control={form.control} name="nivel_formacion" {...PROFILE_TEXT_FIELDS.nivel_formacion} />
          <EntrepreneurTextField control={form.control} name="tipo_emprendedor" {...PROFILE_TEXT_FIELDS.tipo_emprendedor} />
          <EntrepreneurTextField control={form.control} name="segmentacion" {...PROFILE_TEXT_FIELDS.segmentacion} />
        </fieldset>
        <RoleEditFooter form={form} state={state} onClose={onClose} onReload={onReload} />
      </form>
    </Form>
  );
}

function OwnEditForm({ entrepreneur, state, onClose, onReload }: FormProps) {
  const form = useForm<OwnEntrepreneurEditFormValues>({
    resolver: zodResolver(ownEntrepreneurEditFormSchema),
    defaultValues: toOwnEntrepreneurEditValues(entrepreneur),
    mode: "onChange",
  });

  const submit = async (values: OwnEntrepreneurEditFormValues) => {
    if (!state.saveAvailable) return;
    await state.onSubmit({ role: "emprendedor", values });
  };

  return (
    <Form {...form}>
      <form noValidate onSubmit={form.handleSubmit(submit)} className="space-y-4" aria-busy={state.isSubmitting}>
        <ReadOnlySummary entrepreneur={entrepreneur}>
          <DetailField label="Tipo y segmentación (no editable)">
            <NullableText value={[entrepreneur.tipo, entrepreneur.segmentacion].filter(Boolean).join(" · ") || null} />
          </DetailField>
        </ReadOnlySummary>
        <fieldset disabled={state.isSubmitting || state.conflict} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <EntrepreneurTextField
            control={form.control}
            name="nombre_completo"
            label="Nombre completo"
            placeholder="Nombres y apellidos"
            autoComplete="name"
            required
          />
          <EntrepreneurTextField control={form.control} name="numero_telefono" {...TELEFONO_FIELD} />
          <EntrepreneurTextField control={form.control} name="programa_formacion" {...PROFILE_TEXT_FIELDS.programa_formacion} />
          <EntrepreneurTextField control={form.control} name="nivel_formacion" {...PROFILE_TEXT_FIELDS.nivel_formacion} />
        </fieldset>
        <RoleEditFooter form={form} state={state} onClose={onClose} onReload={onReload} />
      </form>
    </Form>
  );
}

export function EntrepreneurRoleEditModal({ entrepreneur, role, open, state, onClose, onReload }: EntrepreneurRoleEditModalProps) {
  const FormComponent = role === "orientador" ? OrientadorEditForm : OwnEditForm;

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next && !state.isSubmitting) onClose();
      }}
      title={role === "orientador" ? "Editar datos del emprendedor" : "Editar mi ficha"}
      description="Solo puedes modificar los campos habilitados para tu rol."
    >
      {open && <FormComponent entrepreneur={entrepreneur} state={state} onClose={onClose} onReload={onReload} />}
    </Modal>
  );
}
