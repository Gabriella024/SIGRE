// Estados válidos en orientacion_inscripciones.estado (CHECK): 'inscrito' | 'cancelado'.
export const ESTADO_INSCRIPCION_ACTIVA = "inscrito";

export type EstadoInscripcionJornada = "inscrito" | "cancelado";

export function isActiveEnrollment(estado: string | null): boolean {
  return estado?.trim().toLowerCase() === ESTADO_INSCRIPCION_ACTIVA;
}

// Cualquier inscripción existente no activa impide reinscribirse (la RPC responde 23505).
export function inscripcionesPorJornada(
  items: readonly { orientacionId: string; inscripcion: { estado: string | null } | null }[]
): Map<string, EstadoInscripcionJornada> {
  const estados = new Map<string, EstadoInscripcionJornada>();
  for (const item of items) {
    if (!item.inscripcion) continue;
    estados.set(item.orientacionId, isActiveEnrollment(item.inscripcion.estado) ? "inscrito" : "cancelado");
  }
  return estados;
}
