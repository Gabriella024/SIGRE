import type { LucideIcon } from "lucide-react";

import type { ModuleCode } from "@/features/access-control/constants/screens";
import type { Entrepreneur } from "@/features/entrepreneurs/types/entrepreneur";
import type { ProjectExportRow } from "@/features/projects/types/proyect";
import type { Pitch } from "@/features/pitch/types/pitch";
import type { ExcelColumn } from "@/lib/excel";

export type ReportId =
  | "emprendedores"
  | "proyectos"
  | "orientaciones"
  | "retos"
  | "pitch"
  | "evaluaciones";

export type ReportTone = "slate" | "violet" | "fuchsia" | "green" | "orange" | "teal" | "red";

export interface ReportDefinition {
  id: ReportId;
  title: string;
  description: string;
  tone: ReportTone;
  icon: LucideIcon;
}

export type DataScope =
  | { kind: "global"; role: "administrador" | "coordinador" }
  | { kind: "orientador"; usuarioId: string }
  | { kind: "evaluador"; usuarioId: string }
  | { kind: "emprendedor"; usuarioId: string };

export type DataScopeKind = DataScope["kind"];

export interface OrientationReportRow {
  id: string;
  tema: string;
  fecha: string | null;
  horario: string | null;
  modalidad: string | null;
  estado: string | null;
  orientador: string | null;
  cupo: number | null;
  inscritos: number | null;
  asistieron: number | null;
  noAsistieron: number | null;
  miInscripcion: string | null;
  miAsistencia: string | null;
}

export interface ComplianceReportRow {
  id: string;
  reto: string | null;
  nivel: string;
  proyecto: string | null;
  emprendedor: string | null;
  fechaEntrega: string | null;
  estado: string | null;
  evidencia: string | null;
  observacion: string | null;
  sustentaciones: number;
  ultimaSustentacion: string | null;
  ultimoResultado: string | null;
}

export interface PitchReportRow extends Pitch {
  evaluadoresNombres: string | null;
  cumpleMinimo: boolean;
}

export interface EvaluationReportRow {
  id: string;
  proyecto: string | null;
  emprendedor: string | null;
  fechaPitch: string | null;
  estadoPitch: string | null;
  asignados: number | null;
  calificados: number | null;
  votosAprobado: number | null;
  votosNoAprobado: number | null;
  puntaje: number | null;
  estado: string;
  miResultado: string | null;
}

export interface ReportRowMap {
  emprendedores: Entrepreneur;
  proyectos: ProjectExportRow;
  orientaciones: OrientationReportRow;
  retos: ComplianceReportRow;
  pitch: PitchReportRow;
  evaluaciones: EvaluationReportRow;
}

export interface ReportFilters {
  search: string;
  estado: string;
  desde: string;
  hasta: string;
}

export interface ReportConfig<T extends { id: string }> {
  definition: ReportDefinition;
  moduleCode: ModuleCode;
  scopes: readonly DataScopeKind[];
  fileName: string;
  sheetName: string;
  estadoLabel: string;
  fechaLabel: string;
  fetch: (scope: DataScope) => Promise<T[]>;
  columns: (scope: DataScope) => readonly ExcelColumn<T>[];
  searchFields: (row: T) => Array<string | null>;
  estado: (row: T) => string | null;
  fecha: (row: T) => string | null;
}
