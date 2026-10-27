import { personName } from "@/lib/personName";
import { matchesOption, matchesSearch } from "@/lib/format";

import type { CumplimientoRow, RetoRow } from "../schemas/challengesSchema";
import type { Challenge, ChallengeCompliance, ChallengeFilters } from "../types/Challenge";

export const INITIAL_CHALLENGE_FILTERS: ChallengeFilters = { search: "", estado: "", nivel: "" };

export function challengeLevel(orden: number | null): string {
  return orden === null ? "Sin nivel" : `R${orden}`;
}

export function toChallenge(row: RetoRow): Challenge {
  return {
    id: row.id,
    titulo: row.titulo,
    descripcion: row.descripcion,
    orden: row.orden,
    nivel: challengeLevel(row.orden),
    estado: row.estado,
    proyectos: row.cumplimiento_retos?.[0]?.count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toChallengeCompliance(row: CumplimientoRow): ChallengeCompliance {
  return {
    id: row.id,
    proyectoId: row.id_proyecto_fk,
    proyecto: row.proyecto?.titulo ?? null,
    emprendedor: row.proyecto?.emprendedor?.nombre_completo ?? null,
    fechaEntrega: row.fecha_entrega,
    estado: row.estado_cumplimiento,
    observacion: row.observacion,
    evidencia: row.archivo_evidencia,
    sustentaciones: (row.sustentacion_retos ?? []).map((item) => ({
      id: item.id,
      resultado: item.resultado,
      observacion: item.observacion,
      fecha: item.fecha_sustentacion,
      orientador: personName(item.orientador),
    })),
  };
}

export function isEvidenceUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

export function filterChallenges(rows: readonly Challenge[], filters: ChallengeFilters): Challenge[] {
  return rows.filter(
    (row) =>
      (filters.nivel === "" || row.nivel === filters.nivel) &&
      matchesOption(filters.estado, row.estado) &&
      matchesSearch(filters.search, row.titulo, row.descripcion, row.nivel)
  );
}
