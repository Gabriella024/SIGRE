import { useMemo, useState } from "react";
import { Loader2, RotateCcw, Save, TriangleAlert } from "lucide-react";

import { MutationAlert } from "@/components/ui/mutation-alert";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/query-state";

import ConfigSection from "./ConfigSection";
import ToggleSwitch from "./ToggleSwitch";
import { usePantallas, useSettingsAccess, useSettingsMutations } from "../hooks/useSettings";
import { screenOrderSchema } from "../schemas/settingsSchema";
import { isActiveStatus } from "../utils/settingUtils";

import type { ScreenChange, SystemScreen } from "../types/types";

type Draft = { orden: string; activa: boolean };

function draftOf(screen: SystemScreen): Draft {
  return { orden: screen.order === null ? "" : String(screen.order), activa: isActiveStatus(screen.status) };
}

export default function ModulosPantallasSection() {
  const { data, error, isLoading, reload } = usePantallas();
  const { canEdit } = useSettingsAccess();
  const { pantallas: mutation } = useSettingsMutations();
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [validationError, setValidationError] = useState<string | null>(null);

  const screens = useMemo(() => data ?? [], [data]);
  const moduleCount = useMemo(() => new Set(screens.map((screen) => screen.moduleCode)).size, [screens]);
  const dirtyIds = Object.keys(drafts);

  const valueOf = (screen: SystemScreen): Draft => drafts[screen.id] ?? draftOf(screen);

  const update = (screen: SystemScreen, changes: Partial<Draft>) => {
    setValidationError(null);
    setDrafts((current) => {
      const next = { ...valueOf(screen), ...changes };
      const original = draftOf(screen);
      const rest = { ...current };
      delete rest[screen.id];
      return next.orden === original.orden && next.activa === original.activa ? rest : { ...rest, [screen.id]: next };
    });
  };

  const discard = () => {
    setDrafts({});
    setValidationError(null);
    mutation.reset();
  };

  const save = async () => {
    const changes: ScreenChange[] = [];

    for (const screen of screens) {
      const draft = drafts[screen.id];
      if (!draft) continue;

      const orden = screenOrderSchema.safeParse(Number(draft.orden));
      if (draft.orden.trim() === "" || !orden.success) {
        setValidationError(`Orden inválido en "${screen.name}": ${orden.error?.issues[0]?.message ?? "es obligatorio."}`);
        return;
      }
      if (!screen.updatedAt) {
        setValidationError(`La pantalla "${screen.name}" no tiene una versión registrada y no puede modificarse.`);
        return;
      }

      changes.push({ id: screen.id, updatedAt: screen.updatedAt, orden: orden.data, estado: draft.activa ? "activo" : "inactivo" });
    }

    const result = await mutation.run(changes);
    if (result.success) {
      setDrafts({});
      reload();
    }
  };

  return (
    <ConfigSection
      id="modulos-pantallas"
      title="Módulos y pantallas"
      readOnly={!canEdit}
      description="Configura la navegación y disponibilidad de las pantallas del sistema."
      action={
        canEdit &&
        dirtyIds.length > 0 && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={discard}
              disabled={mutation.isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4" />
              Descartar
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={mutation.isSubmitting || mutation.pendingBackend !== null}
              className="inline-flex items-center gap-2 rounded-lg bg-[#39a900] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2f8f00] disabled:opacity-60"
            >
              {mutation.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar cambios ({dirtyIds.length})
            </button>
          </div>
        )
      }
    >
      <div className="mb-3 space-y-2">
        {validationError && (
          <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {validationError}
          </p>
        )}
        {canEdit && <MutationAlert feedback={mutation} onReload={reload} />}
      </div>

      {isLoading ? (
        <LoadingState message="Cargando módulos y pantallas..." />
      ) : error ? (
        <ErrorState message="No fue posible cargar los módulos y pantallas." detail={error} onRetry={reload} />
      ) : screens.length === 0 ? (
        <EmptyState message="No hay pantallas registradas o visibles para tu usuario." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {canEdit && (
            <div className="m-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <TriangleAlert className="h-4 w-4 shrink-0" />
              <p>
                <strong className="font-semibold">Ten en cuenta:</strong> Desactivar una pantalla la oculta para todos
                los roles.
              </p>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {["Módulo", "Código", "Nombre", "Ruta", "Orden en el menú", "Activa"].map((label) => (
                    <th
                      key={label}
                      className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {screens.map((screen) => {
                  const value = valueOf(screen);
                  const dirty = screen.id in drafts;
                  return (
                    <tr key={screen.id} className={`border-t border-slate-100 ${dirty ? "bg-amber-50/50" : ""}`}>
                      <td className="px-4 py-4 font-semibold text-slate-900">{screen.moduleName}</td>
                      <td className="px-4 py-4">
                        <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-semibold text-slate-600">
                          {screen.code}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-800">{screen.name}</td>
                      <td className="px-4 py-4">
                        <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600">
                          {screen.route ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <input
                          type="number"
                          min={1}
                          value={value.orden}
                          aria-label={`Orden de ${screen.name} en el menú`}
                          disabled={!canEdit || mutation.isSubmitting}
                          onChange={(event) => update(screen, { orden: event.target.value })}
                          className="h-10 w-16 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#39a900] focus:ring-2 focus:ring-[#39a900]/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <ToggleSwitch
                          checked={value.activa}
                          onChange={(next) => update(screen, { activa: next })}
                          label={`${value.activa ? "Desactivar" : "Activar"} pantalla ${screen.name}`}
                          disabled={!canEdit || mutation.isSubmitting}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
            {moduleCount} módulos · {screens.length} pantallas configuradas
          </div>
        </div>
      )}
    </ConfigSection>
  );
}
