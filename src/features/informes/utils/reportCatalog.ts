import { CalendarDays, ClipboardCheck, Presentation, Sparkles, Target, Users } from "lucide-react";

import { toExcelLocalDate, type ExcelColumn } from "@/lib/excel";
import { formatStatusLabel } from "@/lib/format";
import { ENTREPRENEUR_EXPORT_COLUMNS } from "@/features/entrepreneurs/utils/entrepreneurExport";
import { orientadorNombre } from "@/features/entrepreneurs/utils/entrepreneurUtils";
import { PROJECT_EXPORT_COLUMNS } from "@/features/projects/utils/projectExport";
import { APPROVAL_RULE_PENDING_MESSAGE } from "@/features/evaluations/utils/evaluationUtils";
import { formatDateTime } from "@/features/pitch/utils/pitchUtils";

import {
  getComplianceReport,
  getEntrepreneursReport,
  getEvaluationsReport,
  getOrientationsReport,
  getPitchReport,
  getProjectsReport,
} from "../services/informesService";

import type {
  ComplianceReportRow,
  DataScope,
  DataScopeKind,
  EvaluationReportRow,
  OrientationReportRow,
  PitchReportRow,
  ReportConfig,
  ReportId,
  ReportRowMap,
} from "../types/types";

const ALL_SCOPES: readonly DataScopeKind[] = ["global", "orientador", "emprendedor"];

function labelOrNull(value: string | null): string | null {
  return value?.trim() ? formatStatusLabel(value) : null;
}

function numberText(value: number | null): string | null {
  return value === null ? null : String(value);
}

const ORIENTATION_BASE_COLUMNS: readonly ExcelColumn<OrientationReportRow>[] = [
  { header: "Tema", type: "text", width: 40, value: (row) => row.tema },
  { header: "Fecha", type: "date", width: 14, value: (row) => toExcelLocalDate(row.fecha ? `${row.fecha}T00:00:00` : null) },
  { header: "Horario", type: "text", width: 16, value: (row) => row.horario },
  { header: "Modalidad", type: "text", width: 14, value: (row) => labelOrNull(row.modalidad) },
  { header: "Estado de la jornada", type: "text", width: 18, value: (row) => labelOrNull(row.estado) },
];

const ORIENTATION_STAFF_COLUMNS: readonly ExcelColumn<OrientationReportRow>[] = [
  ...ORIENTATION_BASE_COLUMNS,
  { header: "Orientador", type: "text", width: 30, value: (row) => row.orientador },
  { header: "Cupo", type: "text", width: 10, value: (row) => numberText(row.cupo) },
  { header: "Inscritos", type: "text", width: 12, value: (row) => numberText(row.inscritos) },
  { header: "Asistieron", type: "text", width: 12, value: (row) => numberText(row.asistieron) },
  { header: "No asistieron", type: "text", width: 14, value: (row) => numberText(row.noAsistieron) },
];

const ORIENTATION_PERSONAL_COLUMNS: readonly ExcelColumn<OrientationReportRow>[] = [
  ...ORIENTATION_BASE_COLUMNS,
  { header: "Mi inscripción", type: "text", width: 16, value: (row) => row.miInscripcion },
  { header: "Mi asistencia", type: "text", width: 16, value: (row) => row.miAsistencia ?? "Sin registrar" },
];

const COMPLIANCE_COLUMNS: readonly ExcelColumn<ComplianceReportRow>[] = [
  { header: "Nivel", type: "text", width: 10, value: (row) => row.nivel },
  { header: "Reto", type: "text", width: 32, value: (row) => row.reto },
  { header: "Proyecto", type: "text", width: 32, value: (row) => row.proyecto },
  { header: "Emprendedor", type: "text", width: 30, value: (row) => row.emprendedor },
  { header: "Fecha de entrega", type: "date", width: 16, value: (row) => toExcelLocalDate(row.fechaEntrega) },
  { header: "Estado de cumplimiento", type: "text", width: 22, value: (row) => labelOrNull(row.estado) },
  { header: "Archivo de evidencia", type: "text", width: 40, value: (row) => row.evidencia },
  { header: "Observación", type: "text", width: 36, value: (row) => row.observacion },
  { header: "Sustentaciones", type: "text", width: 14, value: (row) => String(row.sustentaciones) },
  { header: "Última sustentación", type: "date", width: 18, value: (row) => toExcelLocalDate(row.ultimaSustentacion) },
  { header: "Último resultado", type: "text", width: 18, value: (row) => labelOrNull(row.ultimoResultado) },
];

const PITCH_COLUMNS: readonly ExcelColumn<PitchReportRow>[] = [
  { header: "Proyecto", type: "text", width: 32, value: (row) => row.proyecto },
  { header: "Emprendedor", type: "text", width: 30, value: (row) => row.emprendedor },
  { header: "Fecha y hora", type: "text", width: 20, value: (row) => formatDateTime(row.fechaHora) },
  { header: "Modalidad", type: "text", width: 14, value: (row) => labelOrNull(row.modalidad) },
  { header: "Lugar o enlace", type: "text", width: 32, value: (row) => row.lugarLink },
  { header: "Estado", type: "text", width: 16, value: (row) => labelOrNull(row.estado) },
  { header: "Evaluadores asignados", type: "text", width: 12, value: (row) => String(row.totalEvaluadores) },
  { header: "Cumple mínimo de 2 evaluadores", type: "text", width: 16, value: (row) => (row.cumpleMinimo ? "Sí" : "No") },
  { header: "Evaluadores", type: "text", width: 40, value: (row) => row.evaluadoresNombres },
];

const EVALUATION_BASE_COLUMNS: readonly ExcelColumn<EvaluationReportRow>[] = [
  { header: "Proyecto", type: "text", width: 32, value: (row) => row.proyecto },
  { header: "Emprendedor", type: "text", width: 30, value: (row) => row.emprendedor },
  { header: "Fecha del pitch", type: "date", width: 16, value: (row) => toExcelLocalDate(row.fechaPitch) },
  { header: "Estado del pitch", type: "text", width: 16, value: (row) => labelOrNull(row.estadoPitch) },
];

const EVALUATION_GLOBAL_COLUMNS: readonly ExcelColumn<EvaluationReportRow>[] = [
  ...EVALUATION_BASE_COLUMNS,
  { header: "Evaluadores asignados", type: "text", width: 12, value: (row) => numberText(row.asignados) },
  { header: "Calificaciones registradas", type: "text", width: 14, value: (row) => numberText(row.calificados) },
  { header: "Votos aprobado", type: "text", width: 12, value: (row) => numberText(row.votosAprobado) },
  { header: "Votos no aprobado", type: "text", width: 12, value: (row) => numberText(row.votosNoAprobado) },
  { header: "Puntaje promedio", type: "text", width: 12, value: (row) => numberText(row.puntaje) },
  { header: "Estado de calificación", type: "text", width: 22, value: (row) => row.estado },
  { header: "Resultado final", type: "text", width: 28, value: () => "Pendiente de confirmación de regla" },
];

const EVALUATION_EVALUATOR_COLUMNS: readonly ExcelColumn<EvaluationReportRow>[] = [
  ...EVALUATION_BASE_COLUMNS,
  { header: "Estado de mi evaluación", type: "text", width: 18, value: (row) => row.estado },
  { header: "Mi puntaje", type: "text", width: 12, value: (row) => numberText(row.puntaje) },
  { header: "Mi resultado", type: "text", width: 16, value: (row) => row.miResultado },
];

const ENTREPRENEURS_REPORT: ReportConfig<ReportRowMap["emprendedores"]> = {
  definition: {
    id: "emprendedores",
    title: "Reporte de emprendedores",
    description: "Emprendedores registrados con centro, programa, estado y orientador asignado.",
    tone: "slate",
    icon: Users,
  },
  moduleCode: "emprendedores",
  scopes: ALL_SCOPES,
  fileName: "reporte_emprendedores",
  sheetName: "Emprendedores",
  estadoLabel: "Estado del emprendedor",
  fechaLabel: "Fecha de registro",
  fetch: getEntrepreneursReport,
  columns: () => ENTREPRENEUR_EXPORT_COLUMNS,
  searchFields: (row) => [row.nombre, row.centro, row.programa, row.tipo, row.segmentacion, orientadorNombre(row)],
  estado: (row) => row.estado,
  fecha: (row) => row.createdAt,
};

const PROJECTS_REPORT: ReportConfig<ReportRowMap["proyectos"]> = {
  definition: {
    id: "proyectos",
    title: "Reporte de proyectos",
    description: "Proyectos con emprendedor, sector, etapa actual, estado y fechas de registro.",
    tone: "orange",
    icon: Presentation,
  },
  moduleCode: "proyectos",
  scopes: ALL_SCOPES,
  fileName: "reporte_proyectos",
  sheetName: "Proyectos",
  estadoLabel: "Estado del proyecto",
  fechaLabel: "Fecha de registro",
  fetch: getProjectsReport,
  columns: () => PROJECT_EXPORT_COLUMNS,
  searchFields: (row) => [row.titulo, row.emprendedor, row.sector, row.etapa],
  estado: (row) => row.estado,
  fecha: (row) => row.createdAt,
};

const ORIENTATIONS_REPORT: ReportConfig<ReportRowMap["orientaciones"]> = {
  definition: {
    id: "orientaciones",
    title: "Reporte de orientaciones y asistencias",
    description: "Jornadas de orientación con inscritos y asistencia registrada.",
    tone: "violet",
    icon: CalendarDays,
  },
  moduleCode: "orientaciones",
  scopes: ALL_SCOPES,
  fileName: "reporte_orientaciones",
  sheetName: "Orientaciones",
  estadoLabel: "Estado de la jornada",
  fechaLabel: "Fecha de la jornada",
  fetch: getOrientationsReport,
  columns: (scope: DataScope) => (scope.kind === "emprendedor" ? ORIENTATION_PERSONAL_COLUMNS : ORIENTATION_STAFF_COLUMNS),
  searchFields: (row) => [row.tema, row.orientador, row.modalidad],
  estado: (row) => row.estado,
  fecha: (row) => row.fecha,
};

const COMPLIANCE_REPORT: ReportConfig<ReportRowMap["retos"]> = {
  definition: {
    id: "retos",
    title: "Reporte de retos y cumplimiento",
    description: "Retos asignados a proyectos con entrega, evidencia y sustentaciones registradas.",
    tone: "green",
    icon: Target,
  },
  moduleCode: "retos",
  scopes: ALL_SCOPES,
  fileName: "reporte_retos_cumplimiento",
  sheetName: "Retos",
  estadoLabel: "Estado de cumplimiento",
  fechaLabel: "Fecha de entrega",
  fetch: getComplianceReport,
  columns: () => COMPLIANCE_COLUMNS,
  searchFields: (row) => [row.reto, row.nivel, row.proyecto, row.emprendedor, row.observacion],
  estado: (row) => row.estado,
  fecha: (row) => row.fechaEntrega,
};

const PITCH_REPORT: ReportConfig<ReportRowMap["pitch"]> = {
  definition: {
    id: "pitch",
    title: "Reporte de pitch",
    description: "Pitch programados con modalidad, estado y evaluadores asignados (mínimo 2, máximo 3).",
    tone: "fuchsia",
    icon: Sparkles,
  },
  moduleCode: "pitch",
  scopes: [...ALL_SCOPES, "evaluador"],
  fileName: "reporte_pitch",
  sheetName: "Pitch",
  estadoLabel: "Estado del pitch",
  fechaLabel: "Fecha del pitch",
  fetch: getPitchReport,
  columns: () => PITCH_COLUMNS,
  searchFields: (row) => [row.proyecto, row.emprendedor, row.lugarLink, row.evaluadoresNombres],
  estado: (row) => row.estado,
  fecha: (row) => row.fechaHora,
};

const EVALUATIONS_REPORT: ReportConfig<ReportRowMap["evaluaciones"]> = {
  definition: {
    id: "evaluaciones",
    title: "Reporte de evaluaciones y resultados",
    description: `Calificaciones registradas por pitch. ${APPROVAL_RULE_PENDING_MESSAGE}`,
    tone: "red",
    icon: ClipboardCheck,
  },
  moduleCode: "evaluaciones",
  scopes: ["global", "evaluador"],
  fileName: "reporte_evaluaciones",
  sheetName: "Evaluaciones",
  estadoLabel: "Estado de calificación",
  fechaLabel: "Fecha del pitch",
  fetch: getEvaluationsReport,
  columns: (scope: DataScope) => (scope.kind === "evaluador" ? EVALUATION_EVALUATOR_COLUMNS : EVALUATION_GLOBAL_COLUMNS),
  searchFields: (row) => [row.proyecto, row.emprendedor],
  estado: (row) => row.estado,
  fecha: (row) => row.fechaPitch,
};

export const REPORT_CONFIGS: { [K in ReportId]: ReportConfig<ReportRowMap[K]> } = {
  emprendedores: ENTREPRENEURS_REPORT,
  proyectos: PROJECTS_REPORT,
  orientaciones: ORIENTATIONS_REPORT,
  retos: COMPLIANCE_REPORT,
  pitch: PITCH_REPORT,
  evaluaciones: EVALUATIONS_REPORT,
};

export const REPORT_IDS = Object.keys(REPORT_CONFIGS) as ReportId[];
