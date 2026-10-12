import { matchesOption, matchesSearch } from "@/lib/format";

import type { OrientacionRow } from "../schemas/orientationSchema";
import type { Orientacion, OrientationFilters } from "../types/orientations";

export const INITIAL_ORIENTATION_FILTERS: OrientationFilters = {
  search: "",
  estado: "",
  modalidad: "",
  fecha: "",
};

export function toOrientacion(row: OrientacionRow): Orientacion {
  return {
    id: row.id,
    tema: row.tema,
    fecha: row.fecha,
    horaInicio: row.hora_inicio,
    horaFin: row.hora_fin,
    fechaHora: `${row.fecha} ${row.hora_inicio}`,
    modalidad: row.modalidad,
    lugarLink: row.lugar_link,
    audiencia: row.audiencia_esperada,
    estado: row.estado,
  };
}

export function isUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

export function filterOrientations(
  rows: Orientacion[],
  filters: OrientationFilters
): Orientacion[] {
  return rows.filter(
    (row) =>
      matchesSearch(filters.search, row.tema, row.lugarLink) &&
      matchesOption(filters.estado, row.estado) &&
      matchesOption(filters.modalidad, row.modalidad) &&
      (filters.fecha === "" || row.fecha === filters.fecha)
  );
}
