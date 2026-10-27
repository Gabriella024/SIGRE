export interface AccessRole {
  id: number;
  name: string;
  status: string | null;
}

export interface ScreenActionEntry {
  id: string;
  moduleCode: string;
  moduleName: string;
  screenId: string;
  screenCode: string;
  screenName: string;
  screenOrder: number | null;
  actionCode: string;
  actionName: string;
}

export interface RolePermissionEntry {
  id: string;
  roleId: number;
  screenActionId: string;
  level: string;
  status: string | null;
}

export interface PermissionChange {
  screenActionId: string;
  level: AccessLevel;
}

export interface AsignarRolesUsuarioInput {
  idUsuario: string;
  updatedAtEsperado: string;
  idsRoles: number[];
}

export type SigreRole =
  | "administrador"
  | "coordinador"
  | "orientador"
  | "evaluador"
  | "emprendedor";

export type AccessLevel =
  | "SA"
  | "SL"
  | "LE"
  | "AT";

export type GrantingLevel = Exclude<AccessLevel, "SA">;

export type SigreAction =
  | "ver"
  | "crear"
  | "editar"
  | "eliminar"
  | "exportar";

export interface MyPermissionRow {
  rol: string | null;
  modulo: string | null;
  pantalla: string | null;
  accion: string | null;
  nivel_acceso: string | null;
}

export interface SigrePermission {
  moduleCode: string;
  screenCode: string;
  action: SigreAction;
  accessLevels: GrantingLevel[];
}

export interface PermissionDifference {
  moduleCode: string;
  screenCode: string;
  action: SigreAction;
  levels: AccessLevel[];
  grantingLevels: GrantingLevel[];
  roles: string[];
  granted: boolean;
}

export interface SigreUserAccess {
  roles: SigreRole[];
  permissions: SigrePermission[];
  differences: PermissionDifference[];
}
