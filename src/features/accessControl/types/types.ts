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