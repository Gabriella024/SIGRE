import { z } from "zod";

import { PERSONA_COLUMNS, embeddedOne, numericSchema, personaRowSchema } from "@/lib/personName";
import { ORIENTACION_COLUMNS, orientacionRowSchema } from "@/features/orientations/schemas/orientationSchema";

export const ORIENTACION_REPORT_COLUMNS = `${ORIENTACION_COLUMNS}, orientador:usuarios!id_orientador_fk(${PERSONA_COLUMNS}), orientacion_inscripciones(id, deleted_at), asistencias(estado_asistencia, deleted_at)`;

export const orientacionReportRowSchema = orientacionRowSchema.extend({
  orientador: embeddedOne(personaRowSchema),
  orientacion_inscripciones: z.array(z.object({ id: z.string(), deleted_at: z.string().nullable() })).nullable(),
  asistencias: z
    .array(z.object({ estado_asistencia: z.string().nullable(), deleted_at: z.string().nullable() }))
    .nullable(),
});

export type OrientacionReportRow = z.infer<typeof orientacionReportRowSchema>;

export const CUMPLIMIENTO_REPORT_COLUMNS =
  "id, fecha_entrega, estado_cumplimiento, observacion, archivo_evidencia, reto:retos(titulo, orden), proyecto:proyectos(titulo, emprendedor:emprendedores(nombre_completo)), sustentacion_retos(resultado, fecha_sustentacion)";

export const cumplimientoReportRowSchema = z.object({
  id: z.string(),
  fecha_entrega: z.string().nullable(),
  estado_cumplimiento: z.string().nullable(),
  observacion: z.string().nullable(),
  archivo_evidencia: z.string().nullable(),
  reto: embeddedOne(z.object({ titulo: z.string(), orden: numericSchema })),
  proyecto: embeddedOne(
    z.object({
      titulo: z.string(),
      emprendedor: embeddedOne(z.object({ nombre_completo: z.string() })),
    })
  ),
  sustentacion_retos: z
    .array(z.object({ resultado: z.string().nullable(), fecha_sustentacion: z.string().nullable() }))
    .nullable(),
});

export type CumplimientoReportRow = z.infer<typeof cumplimientoReportRowSchema>;
