export type EstadoValidacion = 'valida' | 'error' | 'duplicada' | 'existente';

export interface FilaRegistro {
  fila: number;
  doc: string;
  nombre: string;
  correo: string;
  estado: EstadoValidacion;
  mensaje: string;
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