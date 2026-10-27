export type EstadoValidacion = 'valida' | 'error' | 'duplicada' | 'existente';

export type AsistenteField =
  | 'tipo_documento'
  | 'numero_documento'
  | 'nombres'
  | 'apellidos'
  | 'correo'
  | 'telefono';

export type AsistenteRow = Record<AsistenteField, string>;

export interface AsistenteValido {
  fila: number;
  tipo_documento: string;
  numero_documento: string;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string | null;
}

export interface FilaRegistro {
  fila: number;
  doc: string;
  nombre: string;
  correo: string;
  estado: EstadoValidacion;
  mensaje: string;
  asistente: AsistenteValido | null;
}

export interface ResumenValidacion {
  estado: EstadoValidacion;
  valor: number;
  etiqueta: string;
}

export interface InfoOrientacion {
  orientacion: string;
  detallesOrientacion: string;
  archivoNombre: string;
  fechaCarga: string;
  cargadoPor: string;
}

export interface RegistrarCargaInput {
  orientacionId: string;
  nombreArchivo: string;
  asistentes: AsistenteValido[];
}

export interface ResultadoFilaCarga {
  fila: number;
  estado: 'registrada' | 'existente' | 'rechazada';
  mensaje: string | null;
}

export interface ResultadoCarga {
  idCarga: string;
  resultados: ResultadoFilaCarga[];
}
