export type UserStatus = "activo" | "inactivo";

export interface UserRoleAssignment {
  id: string;
  rolId: number;
  rol: string;
}

export interface User {
  id: string;
  nombre: string;
  primerNombre: string | null;
  segundoNombre: string | null;
  primerApellido: string | null;
  segundoApellido: string | null;
  correo: string | null;
  telefono: string | null;
  tipoDocumento: string | null;
  numeroDocumento: string | null;
  municipioId: number | null;
  municipio: string | null;
  departamento: string | null;
  estado: string | null;
  roles: UserRoleAssignment[];
  ultimoAcceso: string | null;
  fechaCreacion: string | null;
  updatedAt: string | null;
}

export interface UserFilters {
  search: string;
  estado: string;
  rol: string;
  fechaCreacion: string;
  ultimoAcceso: string;
}

export interface UserStatusTarget {
  id: string;
  updatedAt: string;
  estadoActual: UserStatus;
  estadoNuevo: UserStatus;
}

export interface EditarUsuarioAdminInput {
  idUsuario: string;
  updatedAtEsperado: string;
  primerNombre: string;
  segundoNombre: string | null;
  primerApellido: string;
  segundoApellido: string | null;
  tipoDocumento: string | null;
  numeroDocumento: string | null;
  numeroTelefono: string | null;
  idMunicipio: number | null;
}

export interface CambiarEstadoUsuarioAdminInput {
  idUsuario: string;
  updatedAtEsperado: string;
  estadoNuevo: UserStatus;
  justificacion: string;
}

export interface InvitarUsuarioInput {
  correo: string;
  primerNombre: string;
  segundoNombre: string | null;
  primerApellido: string;
  segundoApellido: string | null;
  tipoDocumento: string;
  numeroDocumento: string;
  numeroTelefono: string | null;
  idMunicipio: number | null;
  idRol: number;
}
