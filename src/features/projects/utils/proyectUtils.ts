import { localDateKey, matchesOption, matchesSearch } from "@/lib/format";

import type { ProyectoRow } from "../schemas/proyectSchema";
import type { Project, ProjectFilters } from "../types/proyect";

export const INITIAL_PROJECT_FILTERS: ProjectFilters = {
  search: "",
  estado: "",
  sector: "",
  etapa: "",
  fechaRegistro: "",
};

export function toProject(row: ProyectoRow): Project {
  return {
    id: row.id,
    titulo: row.titulo,
    emprendedorId: row.id_emprendedor_fk,
    emprendedor: row.emprendedor?.nombre_completo ?? null,
    sector: row.sector_economico,
    etapa: row.etapa_actual,
    estado: row.estado_proyecto,
    createdAt: row.created_at,
  };
}

export function filterProjects(rows: Project[], filters: ProjectFilters): Project[] {
  return rows.filter(
    (row) =>
      matchesSearch(filters.search, row.titulo, row.emprendedor, row.sector) &&
      matchesOption(filters.estado, row.estado) &&
      matchesOption(filters.sector, row.sector) &&
      matchesOption(filters.etapa, row.etapa) &&
      (filters.fechaRegistro === "" || localDateKey(row.createdAt) === filters.fechaRegistro)
  );
}
