export interface UsuarioResumen {
  id: string;
  nombre: string | null;
  correo: string | null;
  estado: string | null;
  eliminado: boolean;
}

export interface UsuarioContacto extends UsuarioResumen {
  telefono: string | null;
  tipoDocumento: string | null;
  numeroDocumento: string | null;
}

export interface Entrepreneur {
  id: string;
  nombre: string;
  centro: string | null;
  programa: string | null;
  nivelFormacion: string | null;
  tipo: string | null;
  segmentacion: string | null;
  estado: string | null;
  createdAt: string;
  orientadorId: string | null;
  orientador: UsuarioResumen | null;
}

export interface EntrepreneurDetail extends Entrepreneur {
  updatedAt: string | null;
  usuarioId: string | null;
  usuario: UsuarioContacto | null;
  centroSenaId: string | null;
}

export interface EntrepreneurFilters {
  search: string;
  estado: string;
  centro: string;
  nivelFormacion: string;
  tipo: string;
  orientador: string;
}

export type EntrepreneurSortKey =
  | "nombre"
  | "centro"
  | "programa"
  | "nivelFormacion"
  | "tipo"
  | "estado"
  | "orientador"
  | "createdAt";

export interface EntrepreneurSort {
  key: EntrepreneurSortKey;
  dir: "asc" | "desc";
}

export interface EntrepreneurMetrics {
  total: number;
  activos: number;
  inactivos: number;
  otros: number;
}

export type EntrepreneurView = "cards" | "tabla";

export interface EligibleEntrepreneurUser {
  id: string;
  nombre: string;
  correo: string;
}

export interface CentroSena {
  id: string;
  codigo: string | null;
  nombre: string;
}

export interface CrearEmprendedorAdminInput {
  usuarioId: string;
  nombreCompleto: string;
  idCentroSena: string;
  programaFormacion: string | null;
  nivelFormacion: string | null;
  tipoEmprendedor: string | null;
  segmentacion: string | null;
}

export type EntrepreneurErrorReason = "usuario" | "centro" | "registro" | "orientador" | "estado" | null;

export type EntrepreneurCreateResult =
  | { success: true; id: string; error: null; reason: null }
  | { success: false; id: null; error: string; reason: EntrepreneurErrorReason };

export interface EditarEmprendedorAdminInput {
  idEmprendedor: string;
  updatedAtEsperado: string;
  nombreCompleto: string;
  idCentroSena: string;
  programaFormacion: string | null;
  nivelFormacion: string | null;
  tipoEmprendedor: string | null;
  segmentacion: string | null;
}

export interface EntrepreneurEditableFields {
  nombreCompleto: string;
  programaFormacion: string | null;
  nivelFormacion: string | null;
  tipoEmprendedor: string | null;
  segmentacion: string | null;
}

export interface EntrepreneurEditTarget {
  id: string;
  updatedAt: string | null;
  original: EntrepreneurEditableFields;
}

export type EntrepreneurUpdateResult =
  | { success: true; id: string; error: null; reason: null; conflict: false }
  | { success: false; id: null; error: string; reason: EntrepreneurErrorReason; conflict: boolean };

export interface OrientadorElegible {
  id: string;
  nombre: string;
  correo: string;
}

export interface AsignarOrientadorAdminInput {
  idEmprendedor: string;
  updatedAtEsperado: string;
  idOrientador: string | null;
}

export interface EntrepreneurAssignmentTarget {
  id: string;
  updatedAt: string | null;
  orientadorId: string | null;
}

export type EntrepreneurStatus = "activo" | "inactivo";

export interface CambiarEstadoEmprendedorAdminInput {
  idEmprendedor: string;
  updatedAtEsperado: string;
  estadoNuevo: EntrepreneurStatus;
  justificacion: string;
}

export interface EntrepreneurStatusTarget {
  id: string;
  updatedAt: string | null;
  estadoActual: EntrepreneurStatus;
  estadoNuevo: EntrepreneurStatus;
}

export type EntrepreneurEditorRole = "orientador" | "emprendedor";

export interface OrientadorEntrepreneurEditInput {
  idEmprendedor: string;
  updatedAtEsperado: string;
  numeroTelefono: string | null;
  programaFormacion: string | null;
  nivelFormacion: string | null;
  tipoEmprendedor: string | null;
  segmentacion: string | null;
}

export interface OwnEntrepreneurEditInput {
  idEmprendedor: string;
  updatedAtEsperado: string;
  nombreCompleto: string;
  numeroTelefono: string | null;
  programaFormacion: string | null;
  nivelFormacion: string | null;
}

export type EntrepreneurScope =
  | { kind: "all" }
  | { kind: "assigned"; orientadorId: string }
  | { kind: "own"; usuarioId: string };
