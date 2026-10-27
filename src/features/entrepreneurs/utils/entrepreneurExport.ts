import { downloadExcel, toExcelLocalDate, type ExcelColumn } from "@/lib/excel";
import { formatStatusLabel, localDateKey } from "@/lib/format";

import { filterEntrepreneurs, orientadorNombre, sortEntrepreneurs } from "./entrepreneurUtils";

import type { Entrepreneur, EntrepreneurFilters, EntrepreneurSort } from "../types/entrepreneur";

export type EntrepreneurExportOutcome =
  | { status: "success"; count: number }
  | { status: "empty" }
  | { status: "denied" }
  | { status: "error"; message: string };

export interface EntrepreneurExportDeps {
  checkPermission: () => Promise<boolean>;
  fetchAll: () => Promise<Entrepreneur[]>;
  download: (rows: Entrepreneur[]) => Promise<void>;
}

function labelOrNull(value: string | null): string | null {
  return value?.trim() ? formatStatusLabel(value) : null;
}

export const ENTREPRENEUR_EXPORT_COLUMNS: readonly ExcelColumn<Entrepreneur>[] = [
  { header: "Nombre del emprendedor", type: "text", width: 36, value: (row) => row.nombre },
  { header: "Centro SENA", type: "text", width: 32, value: (row) => row.centro },
  { header: "Programa", type: "text", width: 32, value: (row) => row.programa },
  { header: "Nivel", type: "text", width: 18, value: (row) => row.nivelFormacion },
  { header: "Tipo", type: "text", width: 18, value: (row) => row.tipo },
  { header: "Segmentación", type: "text", width: 20, value: (row) => row.segmentacion },
  { header: "Estado", type: "text", width: 14, value: (row) => labelOrNull(row.estado) },
  { header: "Orientador", type: "text", width: 32, value: (row) => orientadorNombre(row) },
  { header: "Fecha de registro", type: "date", width: 16, value: (row) => toExcelLocalDate(row.createdAt) },
];

export function entrepreneurExportFileName(now = new Date()): string {
  return `emprendedores_${localDateKey(now.toISOString())}.xlsx`;
}

export function downloadEntrepreneursExcel(rows: Entrepreneur[]): Promise<void> {
  return downloadExcel({
    fileName: entrepreneurExportFileName(),
    sheetName: "Emprendedores",
    columns: ENTREPRENEUR_EXPORT_COLUMNS,
    rows,
  });
}

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export async function runEntrepreneurExport(
  filters: EntrepreneurFilters,
  sort: EntrepreneurSort,
  deps: EntrepreneurExportDeps
): Promise<EntrepreneurExportOutcome> {
  let allowed: boolean;
  try {
    allowed = await deps.checkPermission();
  } catch {
    return { status: "error", message: "No fue posible verificar tu autorización para exportar." };
  }
  if (!allowed) return { status: "denied" };

  let rows: Entrepreneur[];
  try {
    rows = sortEntrepreneurs(filterEntrepreneurs(await deps.fetchAll(), filters), sort);
  } catch (error) {
    return {
      status: "error",
      message: messageOf(error, "No fue posible consultar los emprendedores para exportar."),
    };
  }
  if (rows.length === 0) return { status: "empty" };

  try {
    await deps.download(rows);
  } catch {
    return { status: "error", message: "No fue posible generar el archivo Excel." };
  }

  return { status: "success", count: rows.length };
}
