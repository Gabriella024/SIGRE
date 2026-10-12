export interface Orientacion {
  id: string;
  tema: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  fechaHora: string;
  modalidad: string | null;
  lugarLink: string | null;
  audiencia: string | null;
  estado: string;
}

export interface OrientationFilters {
  search: string;
  estado: string;
  modalidad: string;
  fecha: string;
}
