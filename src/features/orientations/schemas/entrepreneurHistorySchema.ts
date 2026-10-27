import { z } from "zod";

const HISTORY_JORNADA_COLUMNS = "id, tema, fecha, hora_inicio, hora_fin, modalidad, estado, deleted_at";

export const INSCRIPCION_HISTORY_COLUMNS = `id, id_orientacion_fk, estado, origen, created_at, orientacion:orientaciones(${HISTORY_JORNADA_COLUMNS})`;

export const ASISTENCIA_HISTORY_COLUMNS = `id, id_orientacion_fk, estado_asistencia, observacion, confirmado_at, orientacion:orientaciones(${HISTORY_JORNADA_COLUMNS})`;

const historyJornadaRowSchema = z.object({
  id: z.string(),
  tema: z.string(),
  fecha: z.string(),
  hora_inicio: z.string(),
  hora_fin: z.string(),
  modalidad: z.string().nullable(),
  estado: z.string(),
  deleted_at: z.string().nullable(),
});

export type HistoryJornadaRow = z.infer<typeof historyJornadaRowSchema>;

export const inscripcionHistoryRowSchema = z.object({
  id: z.string(),
  id_orientacion_fk: z.string(),
  estado: z.string().nullable(),
  origen: z.string().nullable(),
  created_at: z.string(),
  orientacion: historyJornadaRowSchema.nullable(),
});

export type InscripcionHistoryRow = z.infer<typeof inscripcionHistoryRowSchema>;

export const asistenciaHistoryRowSchema = z.object({
  id: z.string(),
  id_orientacion_fk: z.string(),
  estado_asistencia: z.string().nullable(),
  observacion: z.string().nullable(),
  confirmado_at: z.string().nullable(),
  orientacion: historyJornadaRowSchema.nullable(),
});

export type AsistenciaHistoryRow = z.infer<typeof asistenciaHistoryRowSchema>;
