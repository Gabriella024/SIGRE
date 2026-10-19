import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PendingIntegrationNotice } from "@/components/ui/pending-integration";

import { useEligibleEntrepreneurUsers } from "../hooks/useEligibleEntrepreneurUsers";
import {
  DEFAULT_EMPRENDEDOR_ESTADO,
  EMPTY_ENTREPRENEUR_FORM,
  entrepreneurFormSchema,
  type EntrepreneurFormValues,
} from "../schemas/entrepreneursSchema";

const selectClass =
  "h-8 w-full min-w-0 rounded-2xl border border-transparent bg-input/50 px-2.5 text-base outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive md:text-sm";

type TextFieldName = Extract<
  keyof EntrepreneurFormValues,
  "centro_sena" | "programa_formacion" | "nivel_formacion" | "tipo_emprendedor" | "segmentacion"
>;

const TEXT_FIELDS: { name: TextFieldName; label: string; placeholder: string }[] = [
  { name: "centro_sena", label: "Centro SENA", placeholder: "Nombre del centro" },
  { name: "programa_formacion", label: "Programa de formación", placeholder: "Programa cursado" },
  { name: "nivel_formacion", label: "Nivel de formación", placeholder: "Nivel" },
  { name: "tipo_emprendedor", label: "Tipo de emprendedor", placeholder: "Tipo" },
  { name: "segmentacion", label: "Segmentación", placeholder: "Segmento" },
];

interface EntrepreneursFormProps {
  isSubmitting?: boolean;
  submitError?: string | null;
  onSubmit?: (values: EntrepreneurFormValues) => void;
  onCancel: () => void;
}

function RequiredLabel({ children, required }: { children: string; required?: boolean }) {
  return (
    <FormLabel>
      {children}
      {required && <span className="text-rose-600">*</span>}
    </FormLabel>
  );
}

export function EntrepreneursForm({
  isSubmitting = false,
  submitError = null,
  onSubmit,
  onCancel,
}: EntrepreneursFormProps) {
  const form = useForm<EntrepreneurFormValues>({
    resolver: zodResolver(entrepreneurFormSchema),
    defaultValues: EMPTY_ENTREPRENEUR_FORM,
    mode: "onTouched",
  });

  const eligibleUsers = useEligibleEntrepreneurUsers();
  const users = eligibleUsers.data ?? [];
  const userPlaceholder = eligibleUsers.isLoading
    ? "Cargando usuarios..."
    : eligibleUsers.error
      ? "No fue posible cargar los usuarios"
      : users.length === 0
        ? "No hay usuarios elegibles disponibles"
        : "Selecciona un usuario";

  const canSave = Boolean(onSubmit) && !isSubmitting;

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit((values) => onSubmit?.(values))}
        className="space-y-4"
        aria-busy={isSubmitting}
      >
        <fieldset disabled={isSubmitting} className="space-y-4">
          <FormField
            control={form.control}
            name="usuario_id"
            render={({ field }) => (
              <FormItem>
                <RequiredLabel required>Usuario</RequiredLabel>
                <FormControl>
                  <select
                    className={selectClass}
                    disabled={eligibleUsers.isLoading || users.length === 0}
                    {...field}
                  >
                    <option value="">{userPlaceholder}</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.nombre} — {user.correo}
                      </option>
                    ))}
                  </select>
                </FormControl>
                {eligibleUsers.isLoading ? (
                  <FormDescription className="flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Consultando usuarios elegibles...
                  </FormDescription>
                ) : eligibleUsers.error ? (
                  <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-rose-700">
                    <span>{eligibleUsers.error}</span>
                    <Button type="button" variant="outline" size="sm" onClick={eligibleUsers.reload}>
                      Reintentar
                    </Button>
                  </div>
                ) : users.length === 0 ? (
                  <PendingIntegrationNotice title="No hay usuarios elegibles">
                    Primero debe crearse una cuenta activa con rol Emprendedor que no tenga un registro de
                    emprendedor asociado.
                  </PendingIntegrationNotice>
                ) : (
                  <FormDescription>
                    Cuentas activas con rol Emprendedor sin registro de emprendedor asociado.
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nombre_completo"
            render={({ field }) => (
              <FormItem>
                <RequiredLabel required>Nombre completo</RequiredLabel>
                <FormControl>
                  <Input placeholder="Nombres y apellidos" autoFocus {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {TEXT_FIELDS.map(({ name, label, placeholder }) => (
              <FormField
                key={name}
                control={form.control}
                name={name}
                render={({ field }) => (
                  <FormItem>
                    <RequiredLabel>{label}</RequiredLabel>
                    <FormControl>
                      <Input placeholder={placeholder} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

            <div className="grid gap-2">
              <Label htmlFor="emprendedor-estado">Estado</Label>
              <Input id="emprendedor-estado" value={DEFAULT_EMPRENDEDOR_ESTADO} readOnly disabled />
              <p className="text-muted-foreground text-sm">Se asigna automáticamente al registrar.</p>
            </div>

            <FormField
              control={form.control}
              name="id_orientador_fk"
              render={({ field }) => (
                <FormItem>
                  <RequiredLabel>Orientador asignado</RequiredLabel>
                  <FormControl>
                    <select className={selectClass} disabled {...field}>
                      <option value="">Catálogo no disponible</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="id_centro_sena_fk"
              render={({ field }) => (
                <FormItem>
                  <RequiredLabel>Centro SENA (catálogo)</RequiredLabel>
                  <FormControl>
                    <select className={selectClass} disabled {...field}>
                      <option value="">Catálogo no disponible</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {!onSubmit && (
            <PendingIntegrationNotice title="Registro deshabilitado">
              El guardado se habilitará cuando esté disponible el servicio de creación de emprendedores.
              No se crean cuentas desde esta pantalla.
            </PendingIntegrationNotice>
          )}
        </fieldset>

        {submitError && (
          <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {submitError}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" className="gap-2 bg-lime-500 hover:bg-lime-600" disabled={!canSave}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? "Guardando..." : "Registrar emprendedor"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
