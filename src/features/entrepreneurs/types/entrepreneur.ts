export interface Entrepreneur {
  id: string;
  nombre: string;
  centro: string | null;
  programa: string | null;
  nivelFormacion: string | null;
  tipo: string | null;
  segmentacion: string | null;
  estado: string | null;
  createdAt: string;
}

export interface EntrepreneurFilters {
  search: string;
  estado: string;
  centro: string;
}
