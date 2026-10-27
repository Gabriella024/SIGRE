import { supabase } from '@/lib/supabase';
import { downloadExcel } from '@/lib/excel';
import { parseOperationResult, toAdminOperationError } from '@/lib/adminOperation';
import { assertBackendAvailable } from '@/lib/backendContract';

import { resultadoCargaSchema } from '../schemas/orientacionMasivaSchema';
import { EstructuraArchivoError, PLANTILLA_COLUMNS, validarHojaAsistentes } from '../utils/orientacionMasivaUtils';

import type { FilaRegistro, RegistrarCargaInput, ResultadoCarga } from '../types/cargaMasiva';

function cellText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

export async function validarArchivoAsistentes(file: File): Promise<FilaRegistro[]> {
  const { readSheet, InvalidInputError, InvalidSpreadsheetError } = await import('read-excel-file/browser');

  let sheet: string[][];
  try {
    const data = await readSheet(file);
    sheet = data.map((row) => row.map(cellText));
  } catch (error) {
    if (error instanceof InvalidInputError || error instanceof InvalidSpreadsheetError) {
      throw new EstructuraArchivoError('El archivo no es un Excel .xlsx válido o está dañado.');
    }
    throw new EstructuraArchivoError('No fue posible leer el archivo. Verifica que sea la plantilla en formato .xlsx.');
  }

  return validarHojaAsistentes(sheet);
}

export function descargarPlantillaAsistentes(): Promise<void> {
  return downloadExcel({
    fileName: 'plantilla_asistentes_orientacion.xlsx',
    sheetName: 'Asistentes',
    columns: PLANTILLA_COLUMNS,
    rows: [],
  });
}

export async function registrarCargaAsistentes(input: RegistrarCargaInput): Promise<ResultadoCarga> {
  const operation = 'Registrar carga masiva de asistentes';
  assertBackendAvailable({ name: 'sigre_registrar_carga_asistentes', operation });

  const { data, error } = await supabase.rpc('sigre_registrar_carga_asistentes', {
    p_id_orientacion: input.orientacionId,
    p_nombre_archivo: input.nombreArchivo,
    p_asistentes: input.asistentes,
  });

  if (error) {
    throw toAdminOperationError(error, {
      operation,
      denied: 'No tienes autorización para registrar asistentes en esta jornada.',
      notFound: 'La jornada no existe o fue eliminada. Recarga la información.',
      invalid: 'La carga contiene datos no válidos o la jornada no admite registro de asistentes.',
      fallback: 'No fue posible registrar la carga. Inténtalo nuevamente más tarde.',
    });
  }

  const parsed = parseOperationResult(data, resultadoCargaSchema, operation);
  return { idCarga: parsed.id_carga, resultados: parsed.resultados };
}
