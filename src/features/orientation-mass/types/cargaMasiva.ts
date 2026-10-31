export type EstadoValidacion = 'valida' | 'error' | 'duplicada' | 'existente';

export type AsistenteField =
  | 'nombres'
  | 'apellidos'
  | 'departamento'
  | 'municipio'
  | 'tipo_documento'
  | 'numero_documento'
  | 'fecha_nacimiento'
  | 'edad'
  | 'genero'
  | 'nacionalidad'
  | 'correo'
  | 'clasificacion_poblacional'
  | 'tipo_emprendedor'
  | 'nivel_formacion'
  | 'celular'
  | 'segmentacion';

export type AsistenteRow = Record<AsistenteField, string>;

export type AsistenteValido = { fila: number } & {
  [K in AsistenteField]: K extends 'tipo_documento' | 'numero_documento' | 'nombres' | 'apellidos' ? string : string | null;
};

export interface FilaRechazada {
  fila: number;
  estado: 'error' | 'duplicada';
  numero_documento: string | null;
  nombre: string | null;
  correo: string | null;
  mensaje: string;
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
  rechazados: FilaRechazada[];
}

export interface ResumenCarga {
  validas: number;
  errores: number;
  duplicadas: number;
  existentes: number;
  inscritos: number;
  prospectos: number;
  invitaciones: number;
}

export interface ResultadoFilaCarga {
  fila: number;
  estado: 'registrada' | 'existente' | 'rechazada';
  mensaje: string | null;
}

export interface ResultadoCarga {
  idCarga: string;
  resultados: ResultadoFilaCarga[];
  resumen: ResumenCarga | null;
}
