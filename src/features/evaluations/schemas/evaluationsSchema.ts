import { z } from "zod";

import { PERSONA_COLUMNS, embeddedOne, numericSchema, personaRowSchema } from "@/lib/personName";

const PROYECTO_EMBED = "proyecto:proyectos(titulo, emprendedor:emprendedores(nombre_completo))";

const proyectoEmbedSchema = embeddedOne(
  z.object({
    titulo: z.string(),
    emprendedor: embeddedOne(z.object({ nombre_completo: z.string() })),
  })
);

const CALIFICACION_COLUMNS = "calificaciones_pitch(id, puntaje, resultado, observacion)";

const calificacionRowSchema = z.object({
  id: z.string(),
  puntaje: numericSchema,
  resultado: z.string().nullable(),
  observacion: z.string().nullable(),
});

export type CalificacionRow = z.infer<typeof calificacionRowSchema>;

export const MI_ASIGNACION_COLUMNS = `id, estado, pitch(id, fecha_hora, estado, modalidad, ${PROYECTO_EMBED}), ${CALIFICACION_COLUMNS}`;

export const miAsignacionRowSchema = z.object({
  id: z.string(),
  estado: z.string().nullable(),
  pitch: embeddedOne(
    z.object({
      id: z.string(),
      fecha_hora: z.string().nullable(),
      estado: z.string().nullable(),
      modalidad: z.string().nullable(),
      proyecto: proyectoEmbedSchema,
    })
  ),
  calificaciones_pitch: embeddedOne(calificacionRowSchema),
});

export type MiAsignacionRow = z.infer<typeof miAsignacionRowSchema>;

export const RESULTADO_PITCH_COLUMNS = `id, fecha_hora, estado, ${PROYECTO_EMBED}, asignacion_evaluadores(id, deleted_at, evaluador:evaluadores(usuario:usuarios(${PERSONA_COLUMNS})), ${CALIFICACION_COLUMNS})`;

export const resultadoPitchRowSchema = z.object({
  id: z.string(),
  fecha_hora: z.string().nullable(),
  estado: z.string().nullable(),
  proyecto: proyectoEmbedSchema,
  asignacion_evaluadores: z
    .array(
      z.object({
        id: z.string(),
        deleted_at: z.string().nullable(),
        evaluador: embeddedOne(z.object({ usuario: embeddedOne(personaRowSchema) })),
        calificaciones_pitch: embeddedOne(calificacionRowSchema),
      })
    )
    .nullable(),
});

export type ResultadoPitchRow = z.infer<typeof resultadoPitchRowSchema>;

export const RESULTADOS_CALIFICACION = [
  { value: "aprobado", label: "Aprobado" },
  { value: "no_aprobado", label: "No aprobado" },
] as const;

export const calificacionFormSchema = z.object({
  puntaje: z
    .string()
    .trim()
    .min(1, "El puntaje es obligatorio.")
    .refine((value) => /^\d+(\.\d{1,2})?$/.test(value) && Number(value) >= 0 && Number(value) <= 100, "El puntaje debe estar entre 0 y 100."),
  resultado: z.enum(["aprobado", "no_aprobado"], "Selecciona el resultado."),
  observacion: z.string().trim(),
});

export type CalificacionFormValues = z.infer<typeof calificacionFormSchema>;
