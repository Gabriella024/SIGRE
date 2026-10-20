import type { ProjectFormValues } from "../schemas/proyectSchema";

export interface Project {
  id: string;
  titulo: string;
  emprendedorId: string | null;
  emprendedor: string | null;
  sector: string | null;
  etapa: string | null;
  estado: string | null;
  createdAt: string;
}

export interface ProjectDetail extends Project {
  descripcion: string | null;
  problemaOportunidad: string | null;
  propuestaValor: string | null;
  observaciones: string | null;
  updatedAt: string | null;
}

export interface ProjectExportRow extends Project {
  updatedAt: string | null;
}

export interface ProjectFilters {
  search: string;
  estado: string;
  sector: string;
  etapa: string;
  fechaRegistro: string;
}

export type ProjectRoleView = "administrador" | "coordinador" | "orientador" | "emprendedor" | "evaluador";

export type ProjectEntrepreneurScope = "all" | "assigned" | "own";

export interface ProjectCapabilities {
  view: ProjectRoleView | null;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageObservations: boolean;
  entrepreneurScope: ProjectEntrepreneurScope | null;
}

export type ProjectEditorMode = "create" | "edit";

export interface ProjectFormContext {
  emprendedor: string | null;
  estado: string | null;
  etapa: string | null;
  updatedAt: string | null;
}

export interface CrearProyectoAdminInput {
  idEmprendedor: string;
  titulo: string;
  descripcion: string | null;
  sectorEconomico: string | null;
  problemaOportunidad: string | null;
  propuestaValor: string | null;
  observaciones: string | null;
}

export interface ProjectFormSubmission {
  canSubmit: boolean;
  blocked: boolean;
  isSubmitting: boolean;
  error: string | null;
  conflict?: boolean;
  onSubmit: (values: ProjectFormValues) => Promise<void>;
}

export interface EditarProyectoAdminInput {
  idProyecto: string;
  updatedAtEsperado: string;
  titulo: string;
  descripcion: string | null;
  sectorEconomico: string | null;
  problemaOportunidad: string | null;
  propuestaValor: string | null;
  observaciones: string | null;
}

export interface ProjectEditableFields {
  titulo: string;
  descripcion: string | null;
  sectorEconomico: string | null;
  problemaOportunidad: string | null;
  propuestaValor: string | null;
  observaciones: string | null;
}

export interface ProjectEditTarget {
  id: string;
  updatedAt: string | null;
  original: ProjectEditableFields;
}

export interface EliminarProyectoAdminInput {
  idProyecto: string;
  updatedAtEsperado: string;
}

export interface ProjectDeleteTarget {
  id: string;
  titulo: string;
  updatedAt: string | null;
}

export interface ProjectDeletion {
  confirming: boolean;
  blocked: boolean;
  isSubmitting: boolean;
  error: string | null;
  conflict: boolean;
  onRequest: () => void;
  onCancel: () => void;
  onConfirm: (target: ProjectDeleteTarget) => Promise<void>;
  onRefresh: () => void;
}
