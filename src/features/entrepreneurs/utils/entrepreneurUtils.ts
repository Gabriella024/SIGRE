import { matchesOption, matchesSearch, normalizeText } from "@/lib/format";

import type {
  EmprendedorInsert,
  EmprendedorRow,
  EntrepreneurFormValues,
  UsuarioElegibleRow,
} from "../schemas/entrepreneursSchema";
import type {
  EligibleEntrepreneurUser,
  Entrepreneur,
  EntrepreneurFilters,
} from "../types/entrepreneur";

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

const toNullable = (value: string): string | null => (value === "" ? null : value);

export function toEmprendedorInsert(values: EntrepreneurFormValues): EmprendedorInsert {
  return {
    usuario_id: values.usuario_id,
    nombre_completo: values.nombre_completo,
    centro_sena: toNullable(values.centro_sena),
    programa_formacion: toNullable(values.programa_formacion),
    nivel_formacion: toNullable(values.nivel_formacion),
    tipo_emprendedor: toNullable(values.tipo_emprendedor),
    segmentacion: toNullable(values.segmentacion),
    id_orientador_fk: toNullable(values.id_orientador_fk),
    id_centro_sena_fk: toNullable(values.id_centro_sena_fk),
  };
}

export function toEligibleEntrepreneurUser(row: UsuarioElegibleRow): EligibleEntrepreneurUser {
  return {
    id: row.usuario_id,
    nombre: row.nombre_completo,
    correo: row.correo_electronico,
  };
}

export function isActiveEntrepreneur(row: Pick<Entrepreneur, "estado">): boolean {
  return normalizeText(row.estado) === "activo";
}
