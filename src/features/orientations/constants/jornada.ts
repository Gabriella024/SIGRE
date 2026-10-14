export const DEFAULT_JORNADA_ESTADO = "programada";

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

export const REPROGRAMACION_EMAIL = "emprendimientoatlantico@sena.edu.co";

export const PENDING_MIGRATION_LABEL = "Pendiente de migración";
