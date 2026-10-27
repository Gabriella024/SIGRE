import type { FormEvent, ReactNode } from "react";
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
import { NullableText } from "@/components/ui/nullable-text";
import { PendingIntegrationNotice } from "@/components/ui/pending-integration";
import { StatusBadge } from "@/components/ui/status-badge";

import { EtapaBadge } from "./ProjectEtapaBadge";
import { PROJECT_CREATE_BLOCKED_MESSAGE } from "../hooks/useProjectCreate";
import { PROJECT_EDIT_BLOCKED_MESSAGE } from "../hooks/useProjectUpdate";
import { ProjectEntrepreneurField } from "./ProjectEntrepreneurField";
import {
  projectEditFormSchema,
  projectFormSchema,
  type ProjectFormValues,
} from "../schemas/proyectSchema";

import type {
  ProjectEditorMode,
  ProjectEntrepreneurScope,
  ProjectFixedEntrepreneur,
  ProjectFormContext,
  ProjectFormSubmission,
} from "../types/proyect";

type LongTextField = Extract<
  keyof ProjectFormValues,
  "descripcion" | "problema_oportunidad" | "propuesta_valor"
>;

const LONG_TEXT_FIELDS: { name: LongTextField; label: string; placeholder: string }[] = [
  { name: "descripcion", label: "Descripción", placeholder: "Describe brevemente el proyecto" },
  { name: "problema_oportunidad", label: "Problema u oportunidad", placeholder: "¿Qué problema resuelve o qué oportunidad aprovecha?" },
  { name: "propuesta_valor", label: "Propuesta de valor", placeholder: "¿Qué lo diferencia?" },
];

interface ProjectFormProps {
  mode: ProjectEditorMode;
  defaultValues: ProjectFormValues;
  context: ProjectFormContext;
  showObservaciones: boolean;
  entrepreneurScope: ProjectEntrepreneurScope | null;
  fixedEntrepreneur?: ProjectFixedEntrepreneur | null;
  submission?: ProjectFormSubmission;
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

function ReadOnlyField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="flex min-h-8 items-center text-sm text-slate-800">{children}</div>
    </div>
  );
}

export function ProjectForm({
  mode,
  defaultValues,
  context,
  showObservaciones,
  entrepreneurScope,
  fixedEntrepreneur,
  submission,
  onCancel,
}: ProjectFormProps) {
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(mode === "create" ? projectFormSchema : projectEditFormSchema),
    defaultValues,
    mode: "onTouched",
  });

  const isSubmitting = submission?.isSubmitting ?? false;
  const blockedMessage = mode === "create" ? PROJECT_CREATE_BLOCKED_MESSAGE : PROJECT_EDIT_BLOCKED_MESSAGE;
  const submissionError = submission?.error === blockedMessage ? null : submission?.error;
  const handleSubmit = submission
    ? form.handleSubmit((values) => {
        if (!isSubmitting) return submission.onSubmit(values);
      })
    : (event: FormEvent<HTMLFormElement>) => event.preventDefault();

  return (
    <Form {...form}>
      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        <fieldset disabled={isSubmitting} className="space-y-4">
          {mode === "create" ? (
            <ProjectEntrepreneurField scope={entrepreneurScope} fixedEntrepreneur={fixedEntrepreneur} />
          ) : (
            <FormField
              control={form.control}
              name="id_emprendedor_fk"
              render={() => (
                <FormItem>
                  <FormLabel>Emprendedor</FormLabel>
                  <div className="flex min-h-8 items-center text-sm text-slate-800">
                    <NullableText value={context.emprendedor} />
                  </div>
                  {defaultValues.id_emprendedor_fk ? (
                    <FormDescription>El emprendedor asociado no se puede modificar.</FormDescription>
                  ) : (
                    <p role="alert" className="text-sm text-rose-700">
                      El proyecto no tiene un emprendedor asociado.
                    </p>
                  )}
                </FormItem>
              )}
            />
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ReadOnlyField label="Estado del proyecto">
              <StatusBadge value={context.estado} />
            </ReadOnlyField>
            <ReadOnlyField label="Etapa actual">
              <EtapaBadge etapa={context.etapa} />
            </ReadOnlyField>
          </div>

          <FormField
            control={form.control}
            name="titulo"
            render={({ field }) => (
              <FormItem>
                <RequiredLabel required>Título del proyecto</RequiredLabel>
                <FormControl>
                  <Input placeholder="Nombre del proyecto" autoFocus {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sector_economico"
            render={({ field }) => (
              <FormItem>
                <RequiredLabel>Sector económico</RequiredLabel>
                <FormControl>
                  <Input placeholder="Sector al que pertenece" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {LONG_TEXT_FIELDS.map(({ name, label, placeholder }) => (
            <FormField
              key={name}
              control={form.control}
              name={name}
              render={({ field }) => (
                <FormItem>
                  <RequiredLabel>{label}</RequiredLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder={placeholder} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}

          {showObservaciones && (
            <FormField
              control={form.control}
              name="observaciones"
              render={({ field }) => (
                <FormItem>
                  <RequiredLabel>Observaciones</RequiredLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Observaciones de seguimiento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {!submission ? (
            <PendingIntegrationNotice title="Solo lectura">
              No tienes autorización para guardar proyectos.
            </PendingIntegrationNotice>
          ) : (
            submission.blocked && (
              <PendingIntegrationNotice title="Pendiente de backend">
                {blockedMessage}
              </PendingIntegrationNotice>
            )
          )}

          {submission && submissionError && (
            <p
              role="alert"
              className={
                submission.conflict
                  ? "rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900"
                  : "rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800"
              }
            >
              {submission.conflict && <span className="font-semibold">Conflicto de versión. </span>}
              {submissionError}
            </p>
          )}
        </fieldset>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
          {submission ? (
            <Button
              type="submit"
              className="bg-lime-500 hover:bg-lime-600"
              disabled={!submission.canSubmit || isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "create"
                ? isSubmitting ? "Creando..." : "Crear proyecto"
                : isSubmitting ? "Guardando..." : "Guardar cambios"}
            </Button>
          ) : (
            <span title="No tienes autorización para guardar proyectos">
              <Button type="submit" className="w-full bg-lime-500 hover:bg-lime-600" disabled>
                {mode === "create" ? "Crear proyecto" : "Guardar cambios"}
              </Button>
            </span>
          )}
        </div>
      </form>
    </Form>
  );
}
