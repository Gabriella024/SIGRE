import { matchesOption, matchesSearch } from "@/lib/format";

import type { EmprendedorRow } from "../schemas/entrepreneursSchema";
import type { Entrepreneur, EntrepreneurFilters } from "../types/entrepreneur";

export const INITIAL_ENTREPRENEUR_FILTERS: EntrepreneurFilters = {
  search: "",
  estado: "",
  centro: "",
};

export function toEntrepreneur(row: EmprendedorRow): Entrepreneur {
  return {
    id: row.id,
    nombre: row.nombre_completo,
    centro: row.centro_sena,
    programa: row.programa_formacion,
    nivelFormacion: row.nivel_formacion,
    tipo: row.tipo_emprendedor,
    segmentacion: row.segmentacion,
    estado: row.estado,
    createdAt: row.created_at,
  };
}

export function filterEntrepreneurs(
  rows: Entrepreneur[],
  filters: EntrepreneurFilters
): Entrepreneur[] {
  return rows.filter(
    (row) =>
      matchesSearch(filters.search, row.nombre, row.centro, row.programa) &&
      matchesOption(filters.estado, row.estado) &&
      matchesOption(filters.centro, row.centro)
  );
}
