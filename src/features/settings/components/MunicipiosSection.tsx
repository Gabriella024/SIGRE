import { useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Power, Search } from "lucide-react";

import { MutationAlert } from "@/components/ui/mutation-alert";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/query-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { matchesSearch } from "@/lib/format";
import { slicePage } from "@/lib/pagination";

import ConfigSection from "./ConfigSection";
import { CatalogFormModal, type CatalogField } from "./CatalogFormModal";
import { useMunicipios, useSettingsAccess, useSettingsMutations } from "../hooks/useSettings";
import { municipioFormSchema, type MunicipioFormValues } from "../schemas/settingsSchema";

import type { Municipality } from "../types/types";

const PAGE_SIZE = 10;

const FIELDS: readonly CatalogField<keyof MunicipioFormValues>[] = [
  { name: "nombre", label: "Municipio", placeholder: "Nombre del municipio" },
  { name: "departamento", label: "Departamento", placeholder: "Departamento" },
];

type Editing = { target: Municipality | null } | null;

export default function MunicipiosSection() {
  const { data, error, isLoading, reload } = useMunicipios();
  const { canCreate, canEdit } = useSettingsAccess();
  const { municipio: mutation, estadoMunicipio } = useSettingsMutations();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Editing>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const filtered = useMemo(
    () => (data ?? []).filter((item) => matchesSearch(query, item.name, item.department)),
    [data, query]
  );
  const slice = slicePage(filtered, page, PAGE_SIZE);

  const open = (target: Municipality | null) => {
    mutation.reset();
    setEditing({ target });
  };

  const submit = async (values: MunicipioFormValues) => {
    const result = await mutation.run({
      id: editing?.target?.id ?? null,
      nombre: values.nombre,
      departamento: values.departamento,
    });
    if (result.success) reload();
    return result;
  };

  const toggle = async (item: Municipality) => {
    setTogglingId(item.id);
    const result = await estadoMunicipio.run({ id: item.id, estaActivo: !item.active });
    setTogglingId(null);
    if (result.success) reload();
  };

  return (
    <ConfigSection
      id="municipios"
      title="Municipios"
      readOnly={!canCreate && !canEdit}
      description="Administra los municipios disponibles para el registro de usuarios."
      action={
        canCreate && (
          <button
            type="button"
            onClick={() => open(null)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#39a900] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2f8f00] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#39a900] focus-visible:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            Nuevo municipio
          </button>
        )
      }
    >
      {canEdit && (
        <div className="mb-3">
          <MutationAlert feedback={estadoMunicipio} onReload={reload} />
        </div>
      )}

      {isLoading ? (
        <LoadingState message="Cargando municipios..." />
      ) : error ? (
        <ErrorState message="No fue posible cargar los municipios." detail={error} onRetry={reload} />
      ) : data?.length === 0 ? (
        <EmptyState message="No hay municipios registrados o visibles para tu usuario." />
      ) : (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50/70 p-4">
              <div className="relative w-full sm:max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Buscar municipio o departamento"
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 pl-9 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#39a900] focus:ring-2 focus:ring-[#39a900]/20"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      Municipio
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      Departamento
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      Estado
                    </th>
                    {canEdit && (
                      <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-slate-500">
                        Acciones
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {slice.rows.length === 0 ? (
                    <tr>
                      <td colSpan={canEdit ? 4 : 3} className="px-4 py-10 text-center text-sm text-slate-400">
                        No se encontraron municipios con la búsqueda actual.
                      </td>
                    </tr>
                  ) : (
                    slice.rows.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 last:border-b-0">
                        <td className="px-4 py-4 font-semibold text-slate-900">{item.name}</td>
                        <td className="px-4 py-4 text-slate-600">{item.department}</td>
                        <td className="px-4 py-4">
                          <StatusBadge value={item.active ? "activo" : "inactivo"} />
                        </td>
                        {canEdit && (
                          <td className="px-4 py-4">
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => open(item)}
                                aria-label={`Editar ${item.name}`}
                                className="rounded-md p-2 text-slate-600 hover:bg-slate-100"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => void toggle(item)}
                                disabled={estadoMunicipio.isSubmitting || estadoMunicipio.pendingBackend !== null}
                                aria-label={`${item.active ? "Inactivar" : "Activar"} ${item.name}`}
                                title={estadoMunicipio.pendingBackend ?? (item.active ? "Inactivar" : "Activar")}
                                className={`rounded-md p-2 disabled:opacity-40 ${
                                  item.active ? "text-red-500 hover:bg-red-50" : "text-green-600 hover:bg-green-50"
                                }`}
                              >
                                {togglingId === item.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Power className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <PaginationBar {...slice} onPageChange={setPage} />
        </div>
      )}

      <CatalogFormModal
        open={editing !== null}
        title={editing?.target ? "Editar municipio" : "Nuevo municipio"}
        fields={FIELDS}
        initialValues={{ nombre: editing?.target?.name ?? "", departamento: editing?.target?.department ?? "" }}
        schema={municipioFormSchema}
        feedback={mutation}
        onSubmit={submit}
        onClose={() => setEditing(null)}
        onReload={reload}
      />
    </ConfigSection>
  );
}
