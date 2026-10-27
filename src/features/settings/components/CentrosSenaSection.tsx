import { useState } from "react";
import { Loader2, Pencil, Plus, Power } from "lucide-react";

import { MutationAlert } from "@/components/ui/mutation-alert";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/query-state";
import { StatusBadge } from "@/components/ui/status-badge";

import ConfigSection from "./ConfigSection";
import { CatalogFormModal, type CatalogField } from "./CatalogFormModal";
import { useCentrosSenaAdmin, useSettingsAccess, useSettingsMutations } from "../hooks/useSettings";
import { centroSenaFormSchema, type CentroSenaFormValues } from "../schemas/settingsSchema";
import { isActiveStatus, toggledStatus } from "../utils/settingUtils";

import type { SenaCenter } from "../types/types";

const FIELDS: readonly CatalogField<keyof CentroSenaFormValues>[] = [
  { name: "codigo", label: "Código", placeholder: "Código del centro" },
  { name: "nombre", label: "Nombre", placeholder: "Nombre del centro de formación" },
];

type Editing = { target: SenaCenter | null } | null;

const REGIONAL_REQUIRED =
  "Crear un centro SENA exige la regional (id_regional_fk, uuid). El catálogo de regionales no está expuesto al frontend, por lo que la creación permanece bloqueada.";

export default function CentrosSenaSection() {
  const { data, error, isLoading, reload } = useCentrosSenaAdmin();
  const { canCreate, canEdit } = useSettingsAccess();
  const { centro: mutation, estadoCentro } = useSettingsMutations();
  const [editing, setEditing] = useState<Editing>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const open = (target: SenaCenter | null) => {
    mutation.reset();
    setEditing({ target });
  };

  const submit = async (values: CentroSenaFormValues) => {
    const target = editing?.target ?? null;
    if (!target) return { success: false, data: null, error: REGIONAL_REQUIRED, conflict: false } as const;
    const result = await mutation.run({
      id: target.id,
      updatedAt: target.updatedAt,
      idRegional: target.regionalId,
      codigo: values.codigo,
      nombre: values.nombre,
    });
    if (result.success) reload();
    return result;
  };

  const toggle = async (center: SenaCenter) => {
    if (!center.updatedAt) return;
    setTogglingId(center.id);
    const result = await estadoCentro.run({
      id: center.id,
      updatedAt: center.updatedAt,
      estadoNuevo: toggledStatus(center.status),
    });
    setTogglingId(null);
    if (result.success) reload();
  };

  return (
    <ConfigSection
      id="centros-sena"
      title="Centros SENA"
      readOnly={!canCreate && !canEdit}
      description="Administra los centros de formación disponibles para emprendedores."
      action={
        canCreate && (
          <button
            type="button"
            onClick={() => open(null)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#39a900] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2f8f00]"
          >
            <Plus className="h-4 w-4" />
            Nuevo centro
          </button>
        )
      }
    >
      {canEdit && (
        <div className="mb-3">
          <MutationAlert feedback={estadoCentro} onReload={reload} />
        </div>
      )}

      {isLoading ? (
        <LoadingState message="Cargando centros SENA..." />
      ) : error ? (
        <ErrorState message="No fue posible cargar los centros SENA." detail={error} onRetry={reload} />
      ) : data?.length === 0 ? (
        <EmptyState message="No hay centros SENA registrados o visibles para tu usuario." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Código
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Centro
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
                {(data ?? []).map((item) => {
                  const active = isActiveStatus(item.status);
                  return (
                    <tr key={item.id} className="border-b border-slate-100 last:border-b-0">
                      <td className="px-4 py-4">
                        <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-semibold text-slate-600">
                          {item.code ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-900">{item.name}</td>
                      <td className="px-4 py-4">
                        <StatusBadge value={item.status} />
                      </td>
                      {canEdit && (
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-1">
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
                              disabled={estadoCentro.isSubmitting || estadoCentro.pendingBackend !== null || !item.updatedAt}
                              aria-label={`${active ? "Desactivar" : "Activar"} ${item.name}`}
                              title={
                                estadoCentro.pendingBackend ??
                                (item.updatedAt ? (active ? "Desactivar" : "Activar") : "Sin versión registrada: no puede cambiarse")
                              }
                              className={`rounded-md p-2 disabled:opacity-40 ${
                                active ? "text-red-500 hover:bg-red-50" : "text-green-600 hover:bg-green-50"
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CatalogFormModal
        open={editing !== null}
        title={editing?.target ? "Editar centro SENA" : "Nuevo centro SENA"}
        fields={FIELDS}
        initialValues={{ codigo: editing?.target?.code ?? "", nombre: editing?.target?.name ?? "" }}
        schema={centroSenaFormSchema}
        feedback={mutation}
        blockedReason={editing && !editing.target ? REGIONAL_REQUIRED : null}
        onSubmit={submit}
        onClose={() => setEditing(null)}
        onReload={reload}
      />
    </ConfigSection>
  );
}
