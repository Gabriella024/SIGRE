import { z } from "zod";

import { ESTADO_ASISTENCIA_VALUES } from "../constants/jornada";

export const estadoAsistenciaSchema = z.enum(ESTADO_ASISTENCIA_VALUES, {
  message: "Selecciona si el emprendedor asistió o no asistió.",
});

export const registrarAsistenciaResultSchema = z.uuid();

export const inscritoAsistenciaRowSchema = z.object({
  id_inscripcion: z.string(),
  id_emprendedor_fk: z.string(),
  nombre_completo: z.string(),
  estado_asistencia: estadoAsistenciaSchema.nullable(),
  observacion: z.string().nullable(),
  confirmado_at: z.string().nullable(),
  registrado_por_usuario_id: z.string().nullable(),
});

export type InscritoAsistenciaRow = z.infer<typeof inscritoAsistenciaRowSchema>;

export const attendanceFormSchema = z.object({
  estado: estadoAsistenciaSchema,
  observacion: z.string().trim(),
});

export type AttendanceFormValues = z.infer<typeof attendanceFormSchema>;
