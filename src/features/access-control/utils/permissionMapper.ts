import type {
  AccessLevel,
  GrantingLevel,
  MyPermissionRow,
  PermissionDifference,
  SigreAction,
  SigrePermission,
  SigreRole,
  SigreUserAccess,
} from "../types/types";

const VALID_ROLES: readonly SigreRole[] = [
  "administrador",
  "coordinador",
  "orientador",
  "evaluador",
  "emprendedor",
];

const VALID_LEVELS: readonly AccessLevel[] = ["SA", "SL", "LE", "AT"];

export const ACTION_LEVELS: Readonly<Record<SigreAction, readonly GrantingLevel[]>> = {
  ver: ["SL", "LE", "AT"],
  exportar: ["SL", "LE", "AT"],
  crear: ["LE", "AT"],
  editar: ["LE", "AT"],
  eliminar: ["AT"],
};

type GrantCandidate = {
  moduleCode: string;
  screenCode: string;
  action: SigreAction;
  levels: Set<AccessLevel>;
  roles: Set<string>;
};

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

export function isPermissionRow(value: unknown): value is MyPermissionRow {
  if (typeof value !== "object" || value === null) return false;

  const row = value as Record<string, unknown>;

  return (
    isNullableString(row.rol) &&
    isNullableString(row.modulo) &&
    isNullableString(row.pantalla) &&
    isNullableString(row.accion) &&
    isNullableString(row.nivel_acceso)
  );
}

function clean(value: string | null): string {
  return value?.trim() ?? "";
}

function isOneOf<T extends string>(
  list: readonly T[],
  value: string
): value is T {
  return (list as readonly string[]).includes(value);
}

function isAction(value: string): value is SigreAction {
  return Object.hasOwn(ACTION_LEVELS, value);
}

export function grantsAction(
  action: SigreAction,
  level: AccessLevel
): level is GrantingLevel {
  return (ACTION_LEVELS[action] as readonly string[]).includes(level);
}

export function buildUserAccess(rows: MyPermissionRow[]): SigreUserAccess {
  const roles = new Set<SigreRole>();
  const candidates = new Map<string, GrantCandidate>();

  for (const row of rows) {
    const role = clean(row.rol);
    const moduleCode = clean(row.modulo);
    const screenCode = clean(row.pantalla);
    const action = clean(row.accion);
    const level = clean(row.nivel_acceso);

    if (!isOneOf(VALID_ROLES, role)) {
      console.warn(`Rol desconocido en permisos: "${role}"`);
      continue;
    }

    roles.add(role);

    if (
      !moduleCode ||
      !screenCode ||
      !isAction(action) ||
      !isOneOf(VALID_LEVELS, level)
    ) {
      continue;
    }

    const key = `${moduleCode}:${screenCode}:${action}`;
    const candidate = candidates.get(key) ?? {
      moduleCode,
      screenCode,
      action,
      levels: new Set<AccessLevel>(),
      roles: new Set<string>(),
    };

    candidate.levels.add(level);
    candidate.roles.add(role);
    candidates.set(key, candidate);
  }

  const permissions: SigrePermission[] = [];
  const differences: PermissionDifference[] = [];

  for (const { moduleCode, screenCode, action, levels, roles: sources } of candidates.values()) {
    const distinctLevels = [...levels];
    const grantingLevels = distinctLevels.filter((level) => grantsAction(action, level));
    const granted = grantingLevels.length > 0;

    if (distinctLevels.length > 1) {
      differences.push({
        moduleCode,
        screenCode,
        action,
        levels: distinctLevels,
        grantingLevels,
        roles: [...sources],
        granted,
      });
    }

    if (granted) {
      permissions.push({ moduleCode, screenCode, action, accessLevels: grantingLevels });
    }
  }

  return { roles: [...roles], permissions, differences };
}
