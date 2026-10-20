import { downloadExcel, toExcelLocalDate, type ExcelColumn } from "@/lib/excel";
import { formatStatusLabel, localDateKey } from "@/lib/format";

import { filterProjects } from "./proyectUtils";

import type { ProjectExportRow, ProjectFilters } from "../types/proyect";

export type ProjectExportOutcome =
  | { status: "success"; count: number }
  | { status: "empty" }
  | { status: "denied" }
  | { status: "error"; message: string };

export interface ProjectExportDeps {
  checkPermission: () => Promise<boolean>;
  fetchAll: () => Promise<ProjectExportRow[]>;
  download: (rows: ProjectExportRow[]) => Promise<void>;
}

function labelOrNull(value: string | null): string | null {
  return value?.trim() ? formatStatusLabel(value) : null;
}

export const PROJECT_EXPORT_COLUMNS: readonly ExcelColumn<ProjectExportRow>[] = [
  { header: "Título del proyecto", type: "text", width: 40, value: (row) => row.titulo },
  { header: "Emprendedor", type: "text", width: 32, value: (row) => row.emprendedor },
  { header: "Sector económico", type: "text", width: 24, value: (row) => row.sector },
  { header: "Etapa actual", type: "text", width: 16, value: (row) => labelOrNull(row.etapa) },
  { header: "Estado del proyecto", type: "text", width: 18, value: (row) => labelOrNull(row.estado) },
  { header: "Fecha de registro", type: "date", width: 16, value: (row) => toExcelLocalDate(row.createdAt) },
  { header: "Última actualización", type: "date", width: 18, value: (row) => toExcelLocalDate(row.updatedAt) },
];

export function projectExportFileName(now = new Date()): string {
  return `proyectos_${localDateKey(now.toISOString())}.xlsx`;
}

export function downloadProjectsExcel(rows: ProjectExportRow[]): Promise<void> {
  return downloadExcel({
    fileName: projectExportFileName(),
    sheetName: "Proyectos",
    columns: PROJECT_EXPORT_COLUMNS,
    rows,
  });
}

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export async function runProjectExport(
  filters: ProjectFilters,
  deps: ProjectExportDeps
): Promise<ProjectExportOutcome> {
  let allowed: boolean;
  try {
    allowed = await deps.checkPermission();
  } catch {
    return { status: "error", message: "No fue posible verificar tu autorización para exportar." };
  }
  if (!allowed) return { status: "denied" };

  let rows: ProjectExportRow[];
  try {
    rows = filterProjects(await deps.fetchAll(), filters);
  } catch (error) {
    return { status: "error", message: messageOf(error, "No fue posible consultar los proyectos para exportar.") };
  }
  if (rows.length === 0) return { status: "empty" };

  try {
    await deps.download(rows);
  } catch {
    return { status: "error", message: "No fue posible generar el archivo Excel." };
  }

  return { status: "success", count: rows.length };
}
