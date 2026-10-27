import { useEffect, type ComponentProps, type ReactNode } from "react";
import { useFormContext, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PendingIntegrationNotice } from "@/components/ui/pending-integration";

import { centroSenaLabel, PROFILE_TEXT_FIELDS } from "../utils/entrepreneurUtils";

import type { EntrepreneurEditFormValues } from "../schemas/entrepreneursSchema";
import type { CentroSena } from "../types/entrepreneur";

const selectClass =
  "h-8 w-full min-w-0 rounded-2xl border border-transparent bg-input/50 px-2.5 text-base outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive md:text-sm";

export interface CatalogQuery {
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

export interface CentrosSenaQuery extends CatalogQuery {
  data: CentroSena[] | null;
}

export interface CatalogPlaceholders {
  loading: string;
  failed: string;
  empty: string;
  ready: string;
}

type TextFieldName = Extract<
  keyof EntrepreneurEditFormValues,
  "programa_formacion" | "nivel_formacion" | "tipo_emprendedor" | "segmentacion"
>;

const TEXT_FIELDS: readonly TextFieldName[] = [
  "programa_formacion",
  "nivel_formacion",
  "tipo_emprendedor",
  "segmentacion",
];

export function RequiredLabel({ children, required }: { children: string; required?: boolean }) {
  return (
    <FormLabel>
      {children}
      {required && <span className="text-rose-600">*</span>}
    </FormLabel>
  );
}

interface EntrepreneurTextFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  type?: ComponentProps<"input">["type"];
  autoComplete?: string;
}

export function EntrepreneurTextField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  description,
  required,
  type,
  autoComplete,
}: EntrepreneurTextFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <RequiredLabel required={required}>{label}</RequiredLabel>
          <FormControl>
            <Input placeholder={placeholder} type={type} autoComplete={autoComplete} {...field} />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function CatalogSelect({
  query,
  isEmpty,
  placeholders,
  disabled,
  children,
  ...props
}: ComponentProps<"select"> & { query: CatalogQuery; isEmpty: boolean; placeholders: CatalogPlaceholders }) {
  const placeholder = query.isLoading
    ? placeholders.loading
    : query.error
      ? placeholders.failed
      : isEmpty
        ? placeholders.empty
        : placeholders.ready;

  return (
    <select className={selectClass} disabled={disabled || query.isLoading || isEmpty} {...props}>
      <option value="">{placeholder}</option>
      {children}
    </select>
  );
}

export function CatalogStatus({
  query,
  loadingMessage,
  isEmpty,
  empty,
  description,
}: {
  query: CatalogQuery;
  loadingMessage: string;
  isEmpty: boolean;
  empty: ReactNode;
  description: ReactNode;
}) {
  if (query.isLoading) {
    return (
      <FormDescription className="flex items-center gap-2">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {loadingMessage}
      </FormDescription>
    );
  }
  if (query.error) {
    return (
      <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-rose-700">
        <span>{query.error}</span>
        <Button type="button" variant="outline" size="sm" onClick={query.reload}>
          Reintentar
        </Button>
      </div>
    );
  }
  if (isEmpty) return <>{empty}</>;
  return <FormDescription>{description}</FormDescription>;
}

interface EntrepreneurProfileFieldsProps {
  centros: CentrosSenaQuery;
  nombreDescription: string;
  centroHint?: string | null;
  children?: ReactNode;
}

export function EntrepreneurProfileFields({
  centros,
  nombreDescription,
  centroHint,
  children,
}: EntrepreneurProfileFieldsProps) {
  const form = useFormContext<EntrepreneurEditFormValues>();
  const centroData = centros.data;
  const centroList = centroData ?? [];

  useEffect(() => {
    if (!centroData) return;
    const current = form.getValues("id_centro_sena_fk");
    if (current && !centroData.some((centro) => centro.id === current)) {
      form.setValue("id_centro_sena_fk", "", { shouldValidate: true });
    }
  }, [centroData, form]);

  return (
    <>
      <FormField
        control={form.control}
        name="nombre_completo"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel required>Nombre completo</RequiredLabel>
            <FormControl>
              <Input placeholder="Nombres y apellidos" autoComplete="off" {...field} />
            </FormControl>
            <FormDescription>{nombreDescription}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="id_centro_sena_fk"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel required>Centro SENA</RequiredLabel>
            <FormControl>
              <CatalogSelect
                query={centros}
                isEmpty={centroList.length === 0}
                placeholders={{
                  loading: "Cargando centros...",
                  failed: "No fue posible cargar los centros",
                  empty: "No hay centros SENA activos",
                  ready: "Selecciona un centro SENA",
                }}
                {...field}
              >
                {centroList.map((centro) => (
                  <option key={centro.id} value={centro.id}>
                    {centroSenaLabel(centro)}
                  </option>
                ))}
              </CatalogSelect>
            </FormControl>
            <CatalogStatus
              query={centros}
              loadingMessage="Consultando centros SENA..."
              isEmpty={centroList.length === 0}
              empty={
                <PendingIntegrationNotice title="No hay centros SENA activos">
                  Debe existir al menos un centro SENA activo en el catálogo para guardar el emprendedor.
                </PendingIntegrationNotice>
              }
              description={
                field.value === "" && centroHint
                  ? `Centro registrado actualmente: ${centroHint}. Selecciona un centro activo del catálogo.`
                  : "Centros SENA activos del catálogo institucional."
              }
            />
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {TEXT_FIELDS.map((name) => (
          <EntrepreneurTextField key={name} control={form.control} name={name} {...PROFILE_TEXT_FIELDS[name]} />
        ))}
        {children}
      </div>
    </>
  );
}
