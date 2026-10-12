export interface Project {
  id: string;
  titulo: string;
  emprendedorId: string | null;
  emprendedor: string | null;
  sector: string | null;
  etapa: string | null;
  estado: string | null;
  createdAt: string;
}

export interface ProjectFilters {
  search: string;
  estado: string;
  sector: string;
  etapa: string;
  fechaRegistro: string;
}
