import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { MutationAlert } from "@/components/ui/mutation-alert";
import {
  CatalogSelect,
  CatalogStatus,
  EntrepreneurTextField,
  RequiredLabel,
  type CatalogQuery,
} from "@/features/entrepreneurs/components/EntrepreneurProfileFields";
import { municipalityLabel, municipalityOptions } from "@/features/settings/utils/settingUtils";

import { userEditFormSchema, type UserEditFormValues } from "../schemas/userSchema";
import { MISSING_VERSION_MESSAGE, toEditFormValues } from "../utils/userUtils";

import type { MutationFeedback } from "@/hooks/useAdminMutation";
import type { MutationResult } from "@/lib/adminOperation";
import type { Municipality } from "@/features/settings/types/types";
import type { User } from "../types/users";

interface UserEditModalProps {
  user: User | null;
  municipios: CatalogQuery & { data: Municipality[] | null };
  feedback: MutationFeedback;
  onSubmit: (user: User, values: UserEditFormValues) => Promise<MutationResult>;
  onClose: () => void;
  onReload: () => void;
}

function municipioOptionsFor(data: Municipality[] | null, currentId: number | null): Municipality[] {
  return data ? municipalityOptions(data, currentId) : [];
}

function UserEditForm({ user, municipios, feedback, onSubmit, onClose, onReload }: UserEditModalProps & { user: User }) {
  const form = useForm<UserEditFormValues>({
    resolver: zodResolver(userEditFormSchema),
    defaultValues: toEditFormValues(user),
    mode: "onChange",
  });
  const missingVersion = !user.updatedAt;
  const blocked = feedback.isSubmitting || feedback.conflict || missingVersion;
  const options = municipioOptionsFor(municipios.data, user.municipioId);

  const submit = async (values: UserEditFormValues) => {
    const result = await onSubmit(user, values);
    if (result.success) onClose();
  };

  return (
    <Form {...form}>
      <form noValidate onSubmit={form.handleSubmit(submit)} className="space-y-4" aria-busy={feedback.isSubmitting}>
        <p className="text-sm text-slate-500">
          Correo: <span className="font-medium text-slate-700">{user.correo ?? "Sin correo"}</span>. El correo de acceso
          no se modifica desde aquí.
        </p>

        {missingVersion && (
          <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {MISSING_VERSION_MESSAGE}
          </div>
        )}

        <fieldset disabled={blocked} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <EntrepreneurTextField control={form.control} name="primer_nombre" label="Primer nombre" required />
          <EntrepreneurTextField control={form.control} name="segundo_nombre" label="Segundo nombre" />
          <EntrepreneurTextField control={form.control} name="primer_apellido" label="Primer apellido" required />
          <EntrepreneurTextField control={form.control} name="segundo_apellido" label="Segundo apellido" />
          <EntrepreneurTextField control={form.control} name="tipo_documento" label="Tipo de documento" />
          <EntrepreneurTextField control={form.control} name="numero_documento" label="Número de documento" />
          <EntrepreneurTextField control={form.control} name="numero_telefono" label="Teléfono" type="tel" />
          <FormField
            control={form.control}
            name="id_municipio"
            render={({ field }) => (
              <FormItem>
                <RequiredLabel>Municipio</RequiredLabel>
                <FormControl>
                  <CatalogSelect
                    query={municipios}
                    isEmpty={options.length === 0}
                    placeholders={{
                      loading: "Cargando municipios...",
                      failed: "No fue posible cargar los municipios",
                      empty: "No hay municipios disponibles",
                      ready: "Sin municipio",
                    }}
                    {...field}
                  >
                    {options.map((municipio) => (
                      <option key={municipio.id} value={municipio.id}>
                        {municipalityLabel(municipio)}
                      </option>
                    ))}
                  </CatalogSelect>
                </FormControl>
                <CatalogStatus
                  query={municipios}
                  loadingMessage="Cargando municipios..."
                  isEmpty={options.length === 0}
                  empty={<p className="text-xs text-slate-500">No hay municipios activos disponibles.</p>}
                  description="Solo se listan municipios activos."
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </fieldset>

        {!missingVersion && <MutationAlert feedback={feedback} onReload={onReload} />}

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={feedback.isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            className="gap-2 bg-lime-500 hover:bg-lime-600"
            disabled={blocked || feedback.pendingBackend !== null || !form.formState.isDirty || !form.formState.isValid}
          >
            {feedback.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {feedback.isSubmitting ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export function UserEditModal(props: UserEditModalProps) {
  const { user, feedback, onClose } = props;

  return (
    <Modal
      open={user !== null}
      onOpenChange={(next) => {
        if (!next && !feedback.isSubmitting) onClose();
      }}
      title="Editar usuario"
      description="Los campos marcados con * son obligatorios."
    >
      {user && <UserEditForm key={user.id} {...props} user={user} />}
    </Modal>
  );
}
