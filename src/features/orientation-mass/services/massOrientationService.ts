import { MOCK_FILAS_VALIDACION, MOCK_INFO_ORIENTACION } from '../mocks/asistentesValidacion';
import { MOCK_ROWS_PREVIEW } from '../mocks/asistentesPreview';
import type { FilaRegistro, InfoOrientacion } from '../types/cargaMasiva';

type AsistentesService = {
  obtenerVistaPrevia(file: File): Promise<string[][]>;
  validarArchivo(file: File): Promise<{ info: InfoOrientacion; filas: FilaRegistro[] }>;
  confirmarRegistro(filasValidasIds: number[]): Promise<boolean>;
};

export const asistentesService: AsistentesService = {
  async obtenerVistaPrevia() {
    await new Promise((res) => setTimeout(res, 300));
    return MOCK_ROWS_PREVIEW;
  },

  async validarArchivo(file) {
    await new Promise((res) => setTimeout(res, 600));
    return {
      info: { ...MOCK_INFO_ORIENTACION, archivoNombre: file.name },
      filas: MOCK_FILAS_VALIDACION,
    };
  },

  async confirmarRegistro() {
    await new Promise((res) => setTimeout(res, 500));
    return true;
  },
};