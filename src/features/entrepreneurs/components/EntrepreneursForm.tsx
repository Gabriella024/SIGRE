import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PendingIntegrationNotice } from "@/components/ui/pending-integration";

import { CatalogSelect, CatalogStatus, EntrepreneurProfileFields, RequiredLabel } from "./EntrepreneurProfileFields";
import { useCentrosSena } from "../hooks/useCentrosSena";
import { useEligibleEntrepreneurUsers } from "../hooks/useEligibleEntrepreneurUsers";
import {
  DEFAULT_EMPRENDEDOR_ESTADO,
  EMPTY_ENTREPRENEUR_FORM,
  entrepreneurFormSchema,
  type EntrepreneurFormValues,
} from "../schemas/entrepreneursSchema";

import type { EntrepreneurCreateResult } from "../types/entrepreneur";

interface EntrepreneursFormProps {
  isSubmitting?: boolean;
  submitError?: string | null;
  onSubmit?: (values: EntrepreneurFormValues) => Promise<EntrepreneurCreateResult>;
  onCancel: () => void;
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
  const autoNameRef = useRef("");

  const eligibleUsers = useEligibleEntrepreneurUsers();
  const users = eligibleUsers.data;
  const userList = users ?? [];
  const centros = useCentrosSena();

  useEffect(() => {
    if (!users) return;
    const current = form.getValues("usuario_id");
    if (current && !users.some((user) => user.id === current)) {
      form.setValue("usuario_id", "", { shouldValidate: true });
    }
  }, [users, form]);

  const autocompleteName = (usuarioId: string) => {
    const user = userList.find((item) => item.id === usuarioId);
    const current = form.getValues("nombre_completo");
    if (!user || (current.trim() !== "" && current !== autoNameRef.current)) return;
    autoNameRef.current = user.nombre;
    form.setValue("nombre_completo", user.nombre, { shouldValidate: true, shouldDirty: true });
  };

  const submit = async (values: EntrepreneurFormValues) => {
    if (!onSubmit) return;
    const result = await onSubmit(values);
    if (result.success) return;
    if (result.reason === "usuario") eligibleUsers.reload();
    if (result.reason === "centro") centros.reload();
  };

  const canSave = Boolean(onSubmit) && !isSubmitting && form.formState.isValid;

  return (
    <Form {...form}>
      <form noValidate onSubmit={form.handleSubmit(submit)} className="space-y-4" aria-busy={isSubmitting}>
        <fieldset disabled={isSubmitting} className="space-y-4">
          <FormField
            control={form.control}
            name="usuario_id"
            render={({ field }) => (
              <FormItem>
                <RequiredLabel required>Usuario</RequiredLabel>
                <FormControl>
                  <CatalogSelect
                    query={eligibleUsers}
                    isEmpty={userList.length === 0}
                    placeholders={{
                      loading: "Cargando usuarios...",
                      failed: "No fue posible cargar los usuarios",
                      empty: "No hay usuarios elegibles disponibles",
                      ready: "Selecciona un usuario",
                    }}
                    {...field}
                    onChange={(event) => {
                      field.onChange(event);
                      autocompleteName(event.target.value);
                    }}
                  >
                    {userList.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.nombre} — {user.correo}
                      </option>
                    ))}
                  </CatalogSelect>
                </FormControl>
                <CatalogStatus
                  query={eligibleUsers}
                  loadingMessage="Consultando usuarios elegibles..."
                  isEmpty={userList.length === 0}
                  empty={
                    <PendingIntegrationNotice title="No hay usuarios elegibles">
                      Primero debe crearse una cuenta activa con rol Emprendedor que no tenga un registro de
                      emprendedor asociado.
                    </PendingIntegrationNotice>
                  }
                  description="Cuentas activas con rol Emprendedor sin registro de emprendedor asociado."
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <EntrepreneurProfileFields
            centros={centros}
            nombreDescription="Se completa con el nombre del usuario seleccionado. Puedes corregirlo."
          >
            <div className="grid gap-2">
              <Label htmlFor="emprendedor-estado">Estado</Label>
              <Input id="emprendedor-estado" value={DEFAULT_EMPRENDEDOR_ESTADO} readOnly disabled />
              <p className="text-muted-foreground text-sm">Se asigna automáticamente al registrar.</p>
            </div>
          </EntrepreneurProfileFields>

          {!onSubmit && (
            <PendingIntegrationNotice title="Registro no disponible">
              No tienes autorización para registrar emprendedores.
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
