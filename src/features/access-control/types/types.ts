export type UserStatus = "active" | "inactive";

export interface AccessUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: UserStatus;
}

export interface AccessRole {
  id: string;
  name: string;
  description: string;
  usersCount: number;
  active: boolean;
}

export type PermissionAction =
  | "view"
  | "create"
  | "edit"
  | "delete";

export interface PermissionModule {
  id: string;
  name: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
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
