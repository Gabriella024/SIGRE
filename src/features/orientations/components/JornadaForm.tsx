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
import { Textarea } from "@/components/ui/textarea";
import { PendingIntegrationNotice } from "@/components/ui/pending-integration";

import { MODALIDAD_OPTIONS, PENDING_MIGRATION_LABEL } from "../constants/jornada";
import { jornadaFormSchema, type JornadaFormValues } from "../schemas/orientationSchema";
import type { OrientationEditorMode } from "../types/orientations";

const selectClass =
  "h-8 w-full min-w-0 rounded-2xl border border-transparent bg-input/50 px-2.5 text-base outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive md:text-sm";

interface JornadaFormProps {
  mode: OrientationEditorMode;
  defaultValues: JornadaFormValues;
  isSubmitting: boolean;
  submitError: string | null;
  onSubmit: (values: JornadaFormValues) => void;
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

export function JornadaForm({
  mode,
  defaultValues,
  isSubmitting,
  submitError,
  onSubmit,
  onCancel,
}: JornadaFormProps) {
  const form = useForm<JornadaFormValues>({
    resolver: zodResolver(jornadaFormSchema),
    defaultValues,
  });

  const legacyModalidad =
    defaultValues.modalidad &&
    !MODALIDAD_OPTIONS.some((option) => option.value === defaultValues.modalidad)
      ? defaultValues.modalidad
      : null;

  return (
    <Form {...form}>
      <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" aria-busy={isSubmitting}>
        <fieldset disabled={isSubmitting} className="space-y-4">
          <FormField
            control={form.control}
            name="tema"
            render={({ field }) => (
              <FormItem>
                <RequiredLabel required>Tema</RequiredLabel>
                <FormControl>
                  <Input placeholder="Nombre de la jornada" autoFocus {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="fecha"
              render={({ field }) => (
                <FormItem>
                  <RequiredLabel required>Fecha</RequiredLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="modalidad"
              render={({ field }) => (
                <FormItem>
                  <RequiredLabel>Modalidad</RequiredLabel>
                  <FormControl>
                    <select className={selectClass} {...field}>
                      <option value="">Sin definir</option>
                      {MODALIDAD_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                      {legacyModalidad && (
                        <option value={legacyModalidad}>{legacyModalidad} (valor anterior)</option>
                      )}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hora_inicio"
              render={({ field }) => (
                <FormItem>
                  <RequiredLabel required>Hora de inicio</RequiredLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hora_fin"
              render={({ field }) => (
                <FormItem>
                  <RequiredLabel required>Hora de fin</RequiredLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="lugar_link"
            render={({ field }) => (
              <FormItem>
                <RequiredLabel>Lugar o enlace</RequiredLabel>
                <FormControl>
                  <Input placeholder="Sede, salón o https://..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="cupo"
              render={({ field }) => (
                <FormItem>
                  <RequiredLabel>Cupo</RequiredLabel>
                  <FormControl>
                    <Input type="number" min={1} step={1} inputMode="numeric" disabled {...field} />
                  </FormControl>
                  <FormDescription>{PENDING_MIGRATION_LABEL}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="centro"
              render={({ field }) => (
                <FormItem>
                  <RequiredLabel>Centro SENA</RequiredLabel>
                  <FormControl>
                    <select className={selectClass} disabled {...field}>
                      <option value="">Catálogo no disponible</option>
                    </select>
                  </FormControl>
                  <FormDescription>{PENDING_MIGRATION_LABEL}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="observaciones"
            render={({ field }) => (
              <FormItem>
                <RequiredLabel>Observaciones</RequiredLabel>
                <FormControl>
                  <Textarea rows={3} disabled {...field} />
                </FormControl>
                <FormDescription>{PENDING_MIGRATION_LABEL}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <PendingIntegrationNotice title="Orientador responsable">
            La asignación del orientador se hará como una operación administrativa independiente cuando
            el servicio y sus políticas estén aprobados.
          </PendingIntegrationNotice>
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
          <Button type="submit" className="gap-2 bg-lime-500 hover:bg-lime-600" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? "Guardando..." : mode === "create" ? "Crear jornada" : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
