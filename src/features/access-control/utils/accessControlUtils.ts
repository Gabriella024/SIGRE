import { normalizeText } from "@/lib/format";

import { ACTION_LEVELS, grantsAction } from "./permissionMapper";

import type { PantallaAccionRow, RolPermisoRow, RolRow } from "../schemas/accessControlSchema";
import type {
  AccessLevel,
  AccessRole,
  PermissionChange,
  RolePermissionEntry,
  ScreenActionEntry,
  SigreAction,
  SigreRole,
} from "../types/types";

export const SIGRE_ROLES: readonly SigreRole[] = [
  "administrador",
  "coordinador",
  "orientador",
  "evaluador",
  "emprendedor",
];

export const ACCESS_LEVELS: readonly { value: AccessLevel; label: string }[] = [
  { value: "SA", label: "Sin acceso" },
  { value: "SL", label: "Solo lectura" },
  { value: "LE", label: "Lectura y escritura" },
  { value: "AT", label: "Acceso total" },
];

export const MATRIX_ACTIONS = Object.keys(ACTION_LEVELS) as SigreAction[];

const ACTION_ORDER = ["ver", "crear", "editar", "eliminar", "exportar"];

export function toAccessRole(row: RolRow): AccessRole {
  return { id: row.id, name: row.nombre_rol, status: row.estado };
}

export function toRolePermissionEntry(row: RolPermisoRow): RolePermissionEntry {
  return {
    id: row.id,
    roleId: row.id_rol_fk,
    screenActionId: row.id_pantalla_accion_fk,
    level: row.nivel_acceso,
    status: row.estado,
  };
}

const isActive = (status: string | null) => status === null || normalizeText(status) === "activo";

export function toScreenActionEntries(rows: PantallaAccionRow[]): ScreenActionEntry[] {
  return rows
    .flatMap((row) =>
      row.pantalla && row.accion && row.pantalla.deleted_at === null && isActive(row.estado)
        ? [
            {
              id: row.id,
              moduleCode: row.pantalla.modulo?.codigo ?? "",
              moduleName: row.pantalla.modulo?.nombre ?? "Sin módulo",
              screenId: row.pantalla.id,
              screenCode: row.pantalla.codigo,
              screenName: row.pantalla.nombre,
              screenOrder: row.pantalla.orden,
              actionCode: row.accion.codigo,
              actionName: row.accion.nombre,
            },
          ]
        : []
    )
    .sort(
      (a, b) =>
        (a.screenOrder ?? Number.MAX_SAFE_INTEGER) - (b.screenOrder ?? Number.MAX_SAFE_INTEGER) ||
        a.screenName.localeCompare(b.screenName, "es") ||
        ACTION_ORDER.indexOf(a.actionCode) - ACTION_ORDER.indexOf(b.actionCode)
    );
}

export function isSigreRole(value: string): value is SigreRole {
  return (SIGRE_ROLES as readonly string[]).includes(normalizeText(value));
}

export function sortRoles(roles: readonly AccessRole[]): AccessRole[] {
  const rank = (role: AccessRole) => {
    const index = SIGRE_ROLES.indexOf(normalizeText(role.name) as SigreRole);
    return index === -1 ? SIGRE_ROLES.length : index;
  };
  return [...roles].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name, "es"));
}

export function isAccessLevel(value: string): value is AccessLevel {
  return ACCESS_LEVELS.some((level) => level.value === value);
}

export function levelGrants(actionCode: string, level: string): boolean {
  return (
    isAccessLevel(level) &&
    Object.hasOwn(ACTION_LEVELS, actionCode) &&
    grantsAction(actionCode as SigreAction, level)
  );
}

export interface MatrixScreen {
  screenId: string;
  screenName: string;
  screenCode: string;
  moduleName: string;
  actions: Partial<Record<string, ScreenActionEntry>>;
}

export function groupByScreen(entries: readonly ScreenActionEntry[]): MatrixScreen[] {
  const screens = new Map<string, MatrixScreen>();

  for (const entry of entries) {
    const screen = screens.get(entry.screenId) ?? {
      screenId: entry.screenId,
      screenName: entry.screenName,
      screenCode: entry.screenCode,
      moduleName: entry.moduleName,
      actions: {},
    };
    screen.actions[entry.actionCode] = entry;
    screens.set(entry.screenId, screen);
  }

  return [...screens.values()];
}

export function levelsForRole(roleId: number, permissions: readonly RolePermissionEntry[]): Record<string, AccessLevel> {
  const levels: Record<string, AccessLevel> = {};

  for (const permission of permissions) {
    if (permission.roleId === roleId && isActive(permission.status) && isAccessLevel(permission.level)) {
      levels[permission.screenActionId] = permission.level;
    }
  }

  return levels;
}

export function toPermissionChanges(
  original: Record<string, AccessLevel>,
  draft: Record<string, AccessLevel>
): PermissionChange[] {
  return Object.entries(draft)
    .filter(([screenActionId, level]) => (original[screenActionId] ?? "SA") !== level)
    .map(([screenActionId, level]) => ({ screenActionId, level }));
}
