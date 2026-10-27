import { useMemo, useState } from "react";
import { Loader2, RotateCcw, Save } from "lucide-react";

import { MutationAlert } from "@/components/ui/mutation-alert";
import { PendingIntegrationNotice, ReadOnlyBadge } from "@/components/ui/pending-integration";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/query-state";
import { formatStatusLabel, normalizeText } from "@/lib/format";

import {
  ACCESS_LEVELS,
  MATRIX_ACTIONS,
  groupByScreen,
  levelGrants,
  levelsForRole,
  toPermissionChanges,
} from "../utils/accessControlUtils";

import type { MutationFeedback } from "@/hooks/useAdminMutation";
import type { MutationResult } from "@/lib/adminOperation";
import type { AccessLevel, AccessRole, PermissionChange, RolePermissionEntry, ScreenActionEntry } from "../types/types";

interface QueryOf<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

interface PermisosSectionProps {
  roles: AccessRole[];
  screenActions: QueryOf<ScreenActionEntry[]>;
  rolePermissions: QueryOf<RolePermissionEntry[]>;
  ownPermissionsCount: number;
  ownRoles: readonly string[];
  feedback: MutationFeedback;
  onSave?: (roleId: number, changes: PermissionChange[]) => Promise<MutationResult>;
  onSaved: (roleName: string) => void;
}

const LEVEL_STYLES: Record<AccessLevel, string> = {
  SA: "bg-slate-100 text-slate-500",
  SL: "bg-sky-100 text-sky-800",
  LE: "bg-amber-100 text-amber-800",
  AT: "bg-emerald-100 text-emerald-800",
};

const LEVEL_LABEL = Object.fromEntries(ACCESS_LEVELS.map((level) => [level.value, level.label])) as Record<
  AccessLevel,
  string
>;

function LevelBadge({ level, grants }: { level: AccessLevel; grants: boolean }) {
  return (
    <span
      title={`${LEVEL_LABEL[level]}${level !== "SA" && !grants ? " (no habilita esta acción)" : ""}`}
      className={`inline-flex min-w-9 justify-center rounded-full px-2 py-0.5 font-mono text-xs font-semibold ${LEVEL_STYLES[level]} ${
        level !== "SA" && !grants ? "line-through opacity-60" : ""
      }`}
    >
      {level}
    </span>
  );
}

export default function PermisosSection({
  roles,
  screenActions,
  rolePermissions,
  ownPermissionsCount,
  ownRoles,
  feedback,
  onSave,
  onSaved,
}: PermisosSectionProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Record<string, AccessLevel>>({});

  const role = roles.find((item) => item.id === selectedRoleId) ?? roles[0] ?? null;
  const roleId = role?.id ?? null;
  const screens = useMemo(() => groupByScreen(screenActions.data ?? []), [screenActions.data]);
  const original = useMemo(
    () => (roleId === null ? {} : levelsForRole(roleId, rolePermissions.data ?? [])),
    [roleId, rolePermissions.data]
  );
  const changes = toPermissionChanges(original, draft);
  const isLoading = screenActions.isLoading || rolePermissions.isLoading;
  const error = screenActions.error ?? rolePermissions.error;
  const editable = Boolean(onSave);
  const rlsSuspected =
    !isLoading && !error && (rolePermissions.data?.length ?? 0) === 0 && ownPermissionsCount > 0;

  const levelOf = (screenActionId: string): AccessLevel => draft[screenActionId] ?? original[screenActionId] ?? "SA";

  const save = async () => {
    if (!onSave || !role) return;
    const result = await onSave(role.id, changes);
    if (result.success) {
      setDraft({});
      onSaved(role.name);
    }
  };

  const reload = () => {
    screenActions.reload();
    rolePermissions.reload();
  };

  return (
    <section id="permisos" className="scroll-mt-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[#0f2f4a]">
            Permisos
            {!editable && <ReadOnlyBadge />}
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Nivel de acceso de cada rol por pantalla y acción, según la configuración registrada en la base de datos.
          </p>
        </div>

        {editable && changes.length > 0 && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDraft({})}
              disabled={feedback.isSubmitting}
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4" />
              Descartar
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={feedback.isSubmitting || feedback.pendingBackend !== null}
              className="inline-flex items-center gap-2 rounded-md bg-[#39a900] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2f8f00] disabled:opacity-60"
            >
              {feedback.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar cambios ({changes.length})
            </button>
          </div>
        )}
      </div>

      <div className="mb-3 space-y-2">
        {editable && <MutationAlert feedback={feedback} onReload={reload} />}
        {rlsSuspected && (
          <PendingIntegrationNotice title="Permisos no visibles">
            La tabla de permisos por rol no devolvió registros para tu usuario, aunque tus permisos activos sí existen.
            Es probable que la política de lectura no esté habilitada para este perfil; la matriz puede estar incompleta.
          </PendingIntegrationNotice>
        )}
      </div>

      {isLoading ? (
        <LoadingState message="Cargando matriz de permisos..." />
      ) : error ? (
        <ErrorState message="No fue posible cargar la matriz de permisos." detail={error} onRetry={reload} />
      ) : screens.length === 0 || roles.length === 0 ? (
        <EmptyState message="No hay pantallas, acciones o roles configurados visibles para tu usuario." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-slate-50/70 p-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">Rol seleccionado</p>
              <p className="text-xs text-slate-500">
                {changes.length > 0 ? "Guarda o descarta los cambios para cambiar de rol." : "Selecciona el rol que deseas consultar."}
              </p>
            </div>

            <select
              value={roleId ?? ""}
              onChange={(event) => setSelectedRoleId(Number(event.target.value))}
              disabled={changes.length > 0 || feedback.isSubmitting}
              aria-label="Rol"
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#39a900] focus:ring-2 focus:ring-green-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {roles.map((item) => (
                <option key={item.id} value={item.id}>
                  {formatStatusLabel(item.name)}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Módulo / Pantalla
                  </th>
                  {MATRIX_ACTIONS.map((action) => (
                    <th
                      key={action}
                      className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      {formatStatusLabel(action)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {screens.map((screen) => (
                  <tr key={screen.screenId} className="border-b border-slate-100 last:border-b-0">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{screen.moduleName}</p>
                      <p className="text-xs text-slate-500">
                        {screen.screenName} · <span className="font-mono">{screen.screenCode}</span>
                      </p>
                    </td>
                    {MATRIX_ACTIONS.map((action) => {
                      const entry = screen.actions[action];
                      if (!entry) {
                        return (
                          <td key={action} className="px-4 py-3 text-center text-xs text-slate-300" title="Acción no aplica">
                            —
                          </td>
                        );
                      }
                      const level = levelOf(entry.id);
                      const dirty = entry.id in draft && draft[entry.id] !== (original[entry.id] ?? "SA");
                      return (
                        <td key={action} className={`px-4 py-3 text-center ${dirty ? "bg-amber-50" : ""}`}>
                          {editable ? (
                            <select
                              value={level}
                              disabled={feedback.isSubmitting}
                              aria-label={`${entry.actionName} en ${screen.screenName}`}
                              title={LEVEL_LABEL[level]}
                              onChange={(event) =>
                                setDraft((current) => ({ ...current, [entry.id]: event.target.value as AccessLevel }))
                              }
                              className={`h-8 rounded-md border border-slate-200 px-1.5 font-mono text-xs font-semibold outline-none focus:ring-2 focus:ring-green-100 ${LEVEL_STYLES[level]}`}
                            >
                              {ACCESS_LEVELS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.value}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <LevelBadge level={level} grants={levelGrants(action, level)} />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-500">
            {ACCESS_LEVELS.map((level) => (
              <span key={level.value}>
                <span className="font-mono font-semibold">{level.value}</span>: {level.label}
              </span>
            ))}
            {role && ownRoles.includes(normalizeText(role.name)) && (
              <span className="font-semibold text-slate-700">Este rol está asignado a tu usuario.</span>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
