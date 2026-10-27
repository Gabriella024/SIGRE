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
import { formatStatusLabel } from "@/lib/format";

import { INVITABLE_ROLE_IDS, userInviteFormSchema, type UserInviteFormValues } from "../schemas/userSchema";

import type { MutationFeedback } from "@/hooks/useAdminMutation";
import type { MutationResult } from "@/lib/adminOperation";
import type { AccessRole } from "@/features/access-control/types/types";
import type { Municipality } from "@/features/settings/types/types";

interface UserInviteModalProps {
  open: boolean;
  roles: CatalogQuery & { data: AccessRole[] | null };
  municipios: CatalogQuery & { data: Municipality[] | null };
  feedback: MutationFeedback;
  onSubmit: (values: UserInviteFormValues) => Promise<MutationResult>;
  onClose: () => void;
}

const DEFAULT_VALUES: UserInviteFormValues = {
  correo: "",
  primer_nombre: "",
  segundo_nombre: "",
  primer_apellido: "",
  segundo_apellido: "",
  tipo_documento: "",
  numero_documento: "",
  numero_telefono: "",
  id_municipio: "",
  id_rol: "",
};

function UserInviteForm({ roles, municipios, feedback, onSubmit, onClose }: Omit<UserInviteModalProps, "open">) {
  const form = useForm<UserInviteFormValues>({
    resolver: zodResolver(userInviteFormSchema),
    defaultValues: DEFAULT_VALUES,
    mode: "onChange",
  });
  const options = (roles.data ?? []).filter((role) => INVITABLE_ROLE_IDS.includes(role.id));
  const municipioOptions = municipios.data ? municipalityOptions(municipios.data, null) : [];

  const submit = async (values: UserInviteFormValues) => {
    const result = await onSubmit(values);
    if (result.success) onClose();
  };

  return (
    <Form {...form}>
      <form noValidate onSubmit={form.handleSubmit(submit)} className="space-y-4" aria-busy={feedback.isSubmitting}>
        <fieldset disabled={feedback.isSubmitting} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <EntrepreneurTextField
              control={form.control}
              name="correo"
              label="Correo electrónico"
              type="email"
              autoComplete="off"
              description="El usuario recibirá un enlace para definir su contraseña."
              required
            />
          </div>
          <EntrepreneurTextField control={form.control} name="primer_nombre" label="Primer nombre" required />
          <EntrepreneurTextField control={form.control} name="segundo_nombre" label="Segundo nombre" />
          <EntrepreneurTextField control={form.control} name="primer_apellido" label="Primer apellido" required />
          <EntrepreneurTextField control={form.control} name="segundo_apellido" label="Segundo apellido" />
          <EntrepreneurTextField control={form.control} name="tipo_documento" label="Tipo de documento" required />
          <EntrepreneurTextField control={form.control} name="numero_documento" label="Número de documento" required />
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
                    isEmpty={municipioOptions.length === 0}
                    placeholders={{
                      loading: "Cargando municipios...",
                      failed: "No fue posible cargar los municipios",
                      empty: "No hay municipios disponibles",
                      ready: "Sin municipio",
                    }}
                    {...field}
                  >
                    {municipioOptions.map((municipio) => (
                      <option key={municipio.id} value={municipio.id}>
                        {municipalityLabel(municipio)}
                      </option>
                    ))}
                  </CatalogSelect>
                </FormControl>
                <CatalogStatus
                  query={municipios}
                  loadingMessage="Cargando municipios..."
                  isEmpty={municipioOptions.length === 0}
                  empty={<p className="text-xs text-slate-500">No hay municipios activos disponibles.</p>}
                  description="Solo se listan municipios activos."
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="sm:col-span-2">
            <FormField
              control={form.control}
              name="id_rol"
              render={({ field }) => (
                <FormItem>
                  <RequiredLabel required>Rol inicial</RequiredLabel>
                  <FormControl>
                    <CatalogSelect
                      query={roles}
                      isEmpty={options.length === 0}
                      placeholders={{
                        loading: "Cargando roles...",
                        failed: "No fue posible cargar los roles",
                        empty: "No hay roles disponibles",
                        ready: "Selecciona un rol",
                      }}
                      {...field}
                    >
                      {options.map((role) => (
                        <option key={role.id} value={role.id}>
                          {formatStatusLabel(role.name)}
                        </option>
                      ))}
                    </CatalogSelect>
                  </FormControl>
                  <CatalogStatus
                    query={roles}
                    loadingMessage="Cargando roles..."
                    isEmpty={options.length === 0}
                    empty={<p className="text-xs text-slate-500">No hay roles disponibles.</p>}
                    description="Los roles adicionales se asignan desde Control de accesos."
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </fieldset>

        <MutationAlert feedback={feedback} />

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={feedback.isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            className="gap-2 bg-lime-500 hover:bg-lime-600"
            disabled={feedback.isSubmitting || feedback.pendingBackend !== null || !form.formState.isValid}
          >
            {feedback.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {feedback.isSubmitting ? "Enviando..." : "Enviar invitación"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export function UserInviteModal({ open, ...props }: UserInviteModalProps) {
  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next && !props.feedback.isSubmitting) props.onClose();
      }}
      title="Invitar usuario"
      description="Los campos marcados con * son obligatorios."
    >
      {open && <UserInviteForm {...props} />}
    </Modal>
  );
}
