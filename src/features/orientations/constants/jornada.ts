export const DEFAULT_JORNADA_ESTADO = "programada";

export const CLOSED_JORNADA_ESTADO = "finalizada";

export const ORIENTADOR_ROLE = "orientador";

export const JORNADA_TIME_ZONE = "America/Bogota";

export const MODALIDAD_OPTIONS = [
  { value: "presencial", label: "Presencial" },
  { value: "virtual", label: "Virtual" },
  { value: "mixta", label: "Mixta" },
] as const;

export type Modalidad = (typeof MODALIDAD_OPTIONS)[number]["value"];

export const MODALIDAD_VALUES = MODALIDAD_OPTIONS.map((option) => option.value) as [
  Modalidad,
  ...Modalidad[],
];

export const ESTADO_ASISTENCIA_OPTIONS = [
  { value: "asistio", label: "Asistió" },
  { value: "no_asistio", label: "No asistió" },
] as const;

export type EstadoAsistencia = (typeof ESTADO_ASISTENCIA_OPTIONS)[number]["value"];

export const ESTADO_ASISTENCIA_VALUES = ESTADO_ASISTENCIA_OPTIONS.map((option) => option.value) as [
  EstadoAsistencia,
  ...EstadoAsistencia[],
];

export const SIN_REGISTRAR_LABEL = "Sin registrar";

export const REPROGRAMACION_EMAIL = "emprendimientoatlantico@sena.edu.co";

export const PENDING_MIGRATION_LABEL = "Pendiente de migración";
