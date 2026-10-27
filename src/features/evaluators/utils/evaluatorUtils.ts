import { matchesOption, matchesSearch, normalizeText } from "@/lib/format";
import { personName } from "@/lib/personName";

import type { EvaluadorRow } from "../schemas/evaluatorsSchema";
import type { Evaluator, EvaluatorFilters } from "../types/evaluators";

export const INITIAL_EVALUATOR_FILTERS: EvaluatorFilters = { search: "", estado: "" };

export const MAX_EVALUADORES_POR_PITCH = 3;
export const MIN_EVALUADORES_POR_PITCH = 2;

export function toEvaluator(row: EvaluadorRow): Evaluator {
  return {
    id: row.id,
    usuarioId: row.id_usuario_fk,
    nombre: personName(row.usuario),
    documento: row.usuario?.numero_documento ?? null,
    correo: row.usuario?.correo_electronico ?? null,
    telefono: row.usuario?.numero_telefono ?? null,
    especialidad: row.especialidad,
    entidad: row.entidad,
    experiencia: row.experiencia,
    estado: row.estado,
    asignaciones: (row.asignacion_evaluadores ?? []).filter((item) => item.deleted_at === null).length,
    updatedAt: row.updated_at,
  };
}

export function isActiveEvaluator(evaluator: Pick<Evaluator, "estado">): boolean {
  return normalizeText(evaluator.estado) === "activo";
}

export function filterEvaluators(rows: readonly Evaluator[], filters: EvaluatorFilters): Evaluator[] {
  return rows.filter(
    (row) =>
      matchesOption(filters.estado, row.estado) &&
      matchesSearch(filters.search, row.nombre, row.documento, row.especialidad, row.entidad, row.telefono)
  );
}

export function isEvaluatorScoped(roles: readonly string[]): boolean {
  return roles.includes("evaluador") && !roles.includes("administrador") && !roles.includes("coordinador");
}
