import { useEffect, useMemo, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PendingIntegrationNotice } from "@/components/ui/pending-integration";
import { isActiveEntrepreneur } from "@/features/entrepreneurs/utils/entrepreneurUtils";
import type { Entrepreneur } from "@/features/entrepreneurs/types/entrepreneur";
import { matchesSearch } from "@/lib/format";

import { useProjectEntrepreneurOptions } from "../hooks/useProjectEntrepreneurOptions";

import type { ProjectFormValues } from "../schemas/proyectSchema";
import type { ProjectEntrepreneurScope } from "../types/proyect";

const SEARCH_THRESHOLD = 8;

const selectClass =
  "h-8 w-full min-w-0 rounded-2xl border border-transparent bg-input/50 px-2.5 text-base outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive md:text-sm";

const EMPTY_MESSAGES: Record<Exclude<ProjectEntrepreneurScope, "own">, string> = {
  all: "No hay emprendedores activos disponibles para asociar.",
  assigned: "No tienes emprendedores activos asignados.",
};

function optionLabel(row: Entrepreneur): string {
  const extra = [row.centro, row.programa].filter(Boolean).join(" · ");
  return extra ? `${row.nombre} — ${extra}` : row.nombre;
}

function resolveOwn(rows: Entrepreneur[]): { entrepreneur: Entrepreneur | null; error: string | null } {
  if (rows.length === 0) {
    return { entrepreneur: null, error: "Tu cuenta no tiene un registro de emprendedor asociado. Contacta al administrador." };
  }
  if (rows.length > 1) {
    return { entrepreneur: null, error: "Tu cuenta tiene más de un registro de emprendedor. Contacta al administrador." };
  }
  if (!isActiveEntrepreneur(rows[0])) {
    return { entrepreneur: null, error: "Tu registro de emprendedor no está activo. Contacta al administrador." };
  }
  return { entrepreneur: rows[0], error: null };
}

function Label() {
  return (
    <FormLabel>
      Emprendedor<span className="text-rose-600">*</span>
    </FormLabel>
  );
}

function QueryFeedback({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-rose-700">
      <span>No fue posible cargar los emprendedores. {error}</span>
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  );
}

function LoadingFeedback() {
  return (
    <FormDescription className="flex items-center gap-2">
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
      Consultando emprendedores...
    </FormDescription>
  );
}

function OwnEntrepreneurField() {
  const form = useFormContext<ProjectFormValues>();
  const { data, error, isLoading, reload } = useProjectEntrepreneurOptions("own");
  const resolved = useMemo(() => (data ? resolveOwn(data) : null), [data]);
  const ownId = resolved?.entrepreneur?.id ?? "";

  useEffect(() => {
    if (isLoading) return;
    form.setValue("id_emprendedor_fk", ownId, { shouldValidate: ownId !== "" });
  }, [form, isLoading, ownId]);

  return (
    <FormField
      control={form.control}
      name="id_emprendedor_fk"
      render={() => (
        <FormItem>
          <Label />
          <div className="flex min-h-8 items-center text-sm text-slate-800">
            {resolved?.entrepreneur ? (
              <span className="font-medium">{resolved.entrepreneur.nombre}</span>
            ) : (
              <span className="text-slate-500">{isLoading ? "Resolviendo tu registro..." : "Sin registro válido"}</span>
            )}
          </div>
          {isLoading ? (
            <LoadingFeedback />
          ) : error ? (
            <QueryFeedback error={error} onRetry={reload} />
          ) : resolved?.error ? (
            <PendingIntegrationNotice title="No es posible asociar el proyecto">{resolved.error}</PendingIntegrationNotice>
          ) : (
            <FormDescription>El proyecto quedará asociado a tu registro de emprendedor.</FormDescription>
          )}
        </FormItem>
      )}
    />
  );
}

function SelectableEntrepreneurField({ scope }: { scope: Exclude<ProjectEntrepreneurScope, "own"> }) {
  const form = useFormContext<ProjectFormValues>();
  const { data, error, isLoading, reload } = useProjectEntrepreneurOptions(scope);
  const [search, setSearch] = useState("");
  const selectedId = useWatch({ control: form.control, name: "id_emprendedor_fk" });

  const options = useMemo(() => (data ?? []).filter(isActiveEntrepreneur), [data]);
  const visible = useMemo(
    () =>
      options.filter(
        (row) => row.id === selectedId || matchesSearch(search, row.nombre, row.centro, row.programa)
      ),
    [options, search, selectedId]
  );

  useEffect(() => {
    if (isLoading || !selectedId) return;
    if (!options.some((row) => row.id === selectedId)) {
      form.setValue("id_emprendedor_fk", "", { shouldValidate: true });
    }
  }, [form, isLoading, options, selectedId]);

  const placeholder = isLoading
    ? "Cargando emprendedores..."
    : error
      ? "No fue posible cargar los emprendedores"
      : options.length === 0
        ? "Sin emprendedores disponibles"
        : "Selecciona un emprendedor";

  return (
    <FormField
      control={form.control}
      name="id_emprendedor_fk"
      render={({ field }) => (
        <FormItem>
          <Label />
          {options.length > SEARCH_THRESHOLD && (
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre, centro o programa..."
              aria-label="Buscar emprendedor"
            />
          )}
          <FormControl>
            <select className={selectClass} disabled={isLoading || options.length === 0} {...field}>
              <option value="">{placeholder}</option>
              {visible.map((row) => (
                <option key={row.id} value={row.id}>
                  {optionLabel(row)}
                </option>
              ))}
            </select>
          </FormControl>
          {isLoading ? (
            <LoadingFeedback />
          ) : error ? (
            <QueryFeedback error={error} onRetry={reload} />
          ) : options.length === 0 ? (
            <PendingIntegrationNotice title="Sin emprendedores disponibles">{EMPTY_MESSAGES[scope]}</PendingIntegrationNotice>
          ) : search && visible.length === 0 ? (
            <FormDescription>No hay coincidencias con la búsqueda.</FormDescription>
          ) : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function ProjectEntrepreneurField({ scope }: { scope: ProjectEntrepreneurScope | null }) {
  if (scope === "own") return <OwnEntrepreneurField />;
  if (scope) return <SelectableEntrepreneurField scope={scope} />;

  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium text-slate-700">Emprendedor</span>
      <PendingIntegrationNotice title="No es posible asociar el proyecto">
        Tu rol no permite asociar emprendedores a nuevos proyectos.
      </PendingIntegrationNotice>
    </div>
  );
}
