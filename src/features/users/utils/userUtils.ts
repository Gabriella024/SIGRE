import { localDateKey, matchesOption, matchesSearch, normalizeText } from "@/lib/format";

import type { UserEditFormValues, UsuarioAdminRow } from "../schemas/userSchema";
import type { EditarUsuarioAdminInput, User, UserFilters, UserStatusTarget } from "../types/users";

export const INITIAL_USER_FILTERS: UserFilters = {
  search: "",
  estado: "",
  rol: "",
  fechaCreacion: "",
  ultimoAcceso: "",
};

function joinName(...parts: Array<string | null>): string {
  return parts
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
}

function isActiveAssignment(assignment: UsuarioAdminRow["usuario_roles"][number]): boolean {
  return assignment.deleted_at === null && (assignment.estado === null || normalizeText(assignment.estado) === "activo");
}

export function toUser(row: UsuarioAdminRow): User {
  return {
    id: row.id,
    nombre:
      joinName(row.primer_nombre, row.segundo_nombre, row.primer_apellido, row.segundo_apellido) ||
      row.correo_electronico ||
      "Usuario sin nombre",
    primerNombre: row.primer_nombre,
    segundoNombre: row.segundo_nombre,
    primerApellido: row.primer_apellido,
    segundoApellido: row.segundo_apellido,
    correo: row.correo_electronico,
    telefono: row.numero_telefono,
    tipoDocumento: row.tipo_documento,
    numeroDocumento: row.numero_documento,
    municipioId: row.id_municipio_fk,
    municipio: row.municipio?.nombre_municipio ?? null,
    departamento: row.municipio?.departamento ?? null,
    estado: row.estado,
    roles: row.usuario_roles.filter(isActiveAssignment).flatMap((assignment) =>
      assignment.rol ? [{ id: assignment.id, rolId: assignment.rol.id, rol: assignment.rol.nombre_rol }] : []
    ),
    ultimoAcceso: row.ultimo_acceso,
    fechaCreacion: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function isActiveUser(user: Pick<User, "estado">): boolean {
  return normalizeText(user.estado) === "activo";
}

export function filterUsers(rows: readonly User[], filters: UserFilters): User[] {
  return rows.filter(
    (row) =>
      matchesSearch(filters.search, row.nombre, row.correo, row.numeroDocumento) &&
      matchesOption(filters.estado, row.estado) &&
      (filters.rol === "" || row.roles.some((role) => normalizeText(role.rol) === normalizeText(filters.rol))) &&
      (filters.fechaCreacion === "" || (row.fechaCreacion !== null && localDateKey(row.fechaCreacion) === filters.fechaCreacion)) &&
      (filters.ultimoAcceso === "" || (row.ultimoAcceso !== null && localDateKey(row.ultimoAcceso) === filters.ultimoAcceso))
  );
}

export const MISSING_VERSION_MESSAGE =
  "Este usuario no tiene versión registrada (updated_at) y no puede modificarse sin control de concurrencia. Recarga el listado; si persiste, el registro debe corregirse en el servidor.";

export function toStatusTarget(user: User): UserStatusTarget | null {
  if (!user.updatedAt) return null;
  const active = isActiveUser(user);
  return {
    id: user.id,
    updatedAt: user.updatedAt,
    estadoActual: active ? "activo" : "inactivo",
    estadoNuevo: active ? "inactivo" : "activo",
  };
}

export function toEditFormValues(user: User): UserEditFormValues {
  return {
    primer_nombre: user.primerNombre ?? "",
    segundo_nombre: user.segundoNombre ?? "",
    primer_apellido: user.primerApellido ?? "",
    segundo_apellido: user.segundoApellido ?? "",
    tipo_documento: user.tipoDocumento ?? "",
    numero_documento: user.numeroDocumento ?? "",
    numero_telefono: user.telefono ?? "",
    id_municipio: user.municipioId === null ? "" : String(user.municipioId),
  };
}

const nullIfEmpty = (value: string): string | null => (value.trim() === "" ? null : value.trim());

export function toEditarUsuarioAdminInput(user: User, updatedAt: string, values: UserEditFormValues): EditarUsuarioAdminInput {
  return {
    idUsuario: user.id,
    updatedAtEsperado: updatedAt,
    primerNombre: values.primer_nombre,
    segundoNombre: nullIfEmpty(values.segundo_nombre),
    primerApellido: values.primer_apellido,
    segundoApellido: nullIfEmpty(values.segundo_apellido),
    tipoDocumento: nullIfEmpty(values.tipo_documento),
    numeroDocumento: nullIfEmpty(values.numero_documento),
    numeroTelefono: nullIfEmpty(values.numero_telefono),
    idMunicipio: values.id_municipio === "" ? null : Number(values.id_municipio),
  };
}
