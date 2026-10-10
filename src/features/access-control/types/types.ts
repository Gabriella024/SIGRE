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

export type SigreAction =
  | "ver"
  | "crear"
  | "editar"
  | "eliminar"
  | "exportar";

export interface SigrePermission {
  moduleCode: string;
  screenCode: string;
  action: SigreAction;
  enabled: boolean;
  accessLevel: AccessLevel;
}

export interface SigreUserAccess {
  userId: string;
  roles: SigreRole[];
  permissions: SigrePermission[];
}