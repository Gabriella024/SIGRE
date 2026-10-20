import type { Row, SheetData } from "write-excel-file/browser";

export type ExcelCellValue = string | Date | null;

export interface ExcelColumn<T> {
  header: string;
  type: "text" | "date";
  width?: number;
  value: (row: T) => ExcelCellValue;
}

export interface ExcelExportOptions<T> {
  fileName: string;
  sheetName: string;
  columns: readonly ExcelColumn<T>[];
  rows: readonly T[];
}

const EXCEL_DATE_FORMAT = "dd/mm/yyyy";
const FORMULA_TRIGGERS = new Set(["=", "+", "-", "@"]);

function isAllowedXmlChar(code: number): boolean {
  return code >= 0x20 || code === 0x09 || code === 0x0a || code === 0x0d;
}

function isBlankOrControl(char: string): boolean {
  const code = char.codePointAt(0) ?? 0;
  return code < 0x20 || code === 0x7f || /\s/.test(char);
}

export function sanitizeExcelText(value: string): string {
  const clean = Array.from(value)
    .filter((char) => isAllowedXmlChar(char.codePointAt(0) ?? 0))
    .join("");
  const first = Array.from(clean).find((char) => !isBlankOrControl(char));
  const startsWithControl = (clean.codePointAt(0) ?? 0x20) < 0x20;

  return startsWithControl || (first !== undefined && FORMULA_TRIGGERS.has(first)) ? `'${clean}` : clean;
}

export function toExcelLocalDate(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}

export function buildExcelSheet<T>(columns: readonly ExcelColumn<T>[], rows: readonly T[]): SheetData {
  const header: Row = columns.map((column) => ({ value: column.header, type: String, fontWeight: "bold" }));

  const body = rows.map<Row>((row) =>
    columns.map((column) => {
      const value = column.value(row);
      if (value === null) return null;
      if (value instanceof Date) return { value, type: Date, format: EXCEL_DATE_FORMAT };
      return { value: sanitizeExcelText(value), type: String };
    })
  );

  return [header, ...body];
}

export async function downloadExcel<T>({ fileName, sheetName, columns, rows }: ExcelExportOptions<T>): Promise<void> {
  const { default: writeXlsxFile } = await import("write-excel-file/browser");

  await writeXlsxFile(buildExcelSheet(columns, rows), {
    sheet: sheetName,
    columns: columns.map((column) => ({ width: column.width })),
    stickyRowsCount: 1,
  }).toFile(fileName);
}
