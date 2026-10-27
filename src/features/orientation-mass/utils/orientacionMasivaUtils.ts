import { normalizeText } from '@/lib/format';
import type { ExcelColumn } from '@/lib/excel';

import { ASISTENTE_COLUMNS, MAX_FILAS_CARGA, asistenteRowSchema } from '../schemas/orientacionMasivaSchema';

import type {
  AsistenteField,
  AsistenteRow,
  EstadoValidacion,
  FilaRegistro,
  ResultadoCarga,
} from '../types/cargaMasiva';

export class EstructuraArchivoError extends Error {}

function headerKey(value: string): string {
  return normalizeText(value).replace(/[_\s.]+/g, ' ').trim();
}

const HEADER_LOOKUP = new Map<string, AsistenteField>(
  ASISTENTE_COLUMNS.flatMap((column) =>
    [column.header, column.field, ...column.aliases].map((label) => [headerKey(label), column.field] as const)
  )
);

function mapHeaders(header: readonly string[]): Map<AsistenteField, number> {
  const positions = new Map<AsistenteField, number>();

  header.forEach((cell, index) => {
    const field = HEADER_LOOKUP.get(headerKey(cell));
    if (!field) return;
    if (positions.has(field)) {
      throw new EstructuraArchivoError(`La columna "${cell}" está repetida en el encabezado.`);
    }
    positions.set(field, index);
  });

  const missing = ASISTENTE_COLUMNS.filter((column) => !positions.has(column.field)).map((column) => column.header);
  if (missing.length > 0) {
    throw new EstructuraArchivoError(
      `Faltan columnas obligatorias: ${missing.join(', ')}. Descarga la plantilla y conserva sus encabezados.`
    );
  }

  return positions;
}

function toAsistenteRow(cells: readonly string[], positions: Map<AsistenteField, number>): AsistenteRow {
  const value = (field: AsistenteField) => (cells[positions.get(field) ?? -1] ?? '').trim();
  return {
    tipo_documento: value('tipo_documento'),
    numero_documento: value('numero_documento'),
    nombres: value('nombres'),
    apellidos: value('apellidos'),
    correo: value('correo'),
    telefono: value('telefono'),
  };
}

function validateRow(fila: number, row: AsistenteRow): FilaRegistro {
  const nombre = [row.nombres, row.apellidos].filter(Boolean).join(' ');
  const parsed = asistenteRowSchema.safeParse(row);

  if (!parsed.success) {
    return {
      fila,
      doc: row.numero_documento || '—',
      nombre: nombre || '—',
      correo: row.correo || '—',
      estado: 'error',
      mensaje: [...new Set(parsed.error.issues.map((issue) => issue.message))].join(' '),
      asistente: null,
    };
  }

  const data = parsed.data;
  return {
    fila,
    doc: data.numero_documento,
    nombre: `${data.nombres} ${data.apellidos}`,
    correo: data.correo,
    estado: 'valida',
    mensaje: 'Lista para registrar',
    asistente: {
      fila,
      tipo_documento: data.tipo_documento.toUpperCase(),
      numero_documento: data.numero_documento,
      nombres: data.nombres,
      apellidos: data.apellidos,
      correo: data.correo.toLowerCase(),
      telefono: data.telefono === '' ? null : data.telefono,
    },
  };
}

function markDuplicates(filas: FilaRegistro[]): FilaRegistro[] {
  const byDocumento = new Map<string, number>();
  const byCorreo = new Map<string, number>();

  return filas.map((fila) => {
    if (!fila.asistente) return fila;

    const documento = `${fila.asistente.tipo_documento}:${fila.asistente.numero_documento.toUpperCase()}`;
    const correo = fila.asistente.correo;
    const previousDoc = byDocumento.get(documento);
    const previousMail = byCorreo.get(correo);

    if (previousDoc !== undefined || previousMail !== undefined) {
      const reasons = [
        previousDoc !== undefined && `documento repetido de la fila ${previousDoc}`,
        previousMail !== undefined && `correo repetido de la fila ${previousMail}`,
      ].filter(Boolean);
      return { ...fila, estado: 'duplicada' as const, mensaje: `Duplicada: ${reasons.join(' y ')}.`, asistente: null };
    }

    byDocumento.set(documento, fila.fila);
    byCorreo.set(correo, fila.fila);
    return fila;
  });
}

function isBlankRow(cells: readonly string[]): boolean {
  return cells.every((cell) => cell.trim() === '');
}

export function validarHojaAsistentes(sheet: readonly (readonly string[])[]): FilaRegistro[] {
  const headerIndex = sheet.findIndex((row) => !isBlankRow(row));
  if (headerIndex === -1) throw new EstructuraArchivoError('El archivo no contiene datos.');

  const positions = mapHeaders(sheet[headerIndex]);
  const body = sheet
    .map((cells, index) => ({ cells, fila: index + 1 }))
    .slice(headerIndex + 1)
    .filter(({ cells }) => !isBlankRow(cells));

  if (body.length === 0) throw new EstructuraArchivoError('El archivo no tiene filas de asistentes debajo del encabezado.');
  if (body.length > MAX_FILAS_CARGA) {
    throw new EstructuraArchivoError(`El archivo supera el máximo de ${MAX_FILAS_CARGA} asistentes por carga.`);
  }

  return markDuplicates(body.map(({ cells, fila }) => validateRow(fila, toAsistenteRow(cells, positions))));
}

export function contarPorEstado(filas: readonly FilaRegistro[]): Record<EstadoValidacion, number> {
  const counts: Record<EstadoValidacion, number> = { valida: 0, error: 0, duplicada: 0, existente: 0 };
  for (const fila of filas) counts[fila.estado] += 1;
  return counts;
}

export function aplicarResultadoCarga(filas: readonly FilaRegistro[], resultado: ResultadoCarga): FilaRegistro[] {
  const byFila = new Map(resultado.resultados.map((item) => [item.fila, item]));

  return filas.map((fila) => {
    const item = byFila.get(fila.fila);
    if (!item || fila.estado !== 'valida') return fila;
    if (item.estado === 'existente') {
      return { ...fila, estado: 'existente', mensaje: item.mensaje ?? 'Ya registrado en esta orientación' };
    }
    if (item.estado === 'rechazada') {
      return { ...fila, estado: 'error', mensaje: item.mensaje ?? 'Rechazado por el servidor' };
    }
    return { ...fila, mensaje: item.mensaje ?? 'Registrado' };
  });
}

export const PLANTILLA_COLUMNS: readonly ExcelColumn<never>[] = ASISTENTE_COLUMNS.map((column) => ({
  header: column.header,
  type: 'text',
  width: 24,
  value: () => null,
}));
