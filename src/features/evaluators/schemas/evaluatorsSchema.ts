import { z } from "zod";

import { PERSONA_COLUMNS, embeddedOne, personaRowSchema } from "@/lib/personName";

export const EVALUADOR_COLUMNS = `id, especialidad, entidad, experiencia, estado, updated_at, id_usuario_fk, usuario:usuarios(${PERSONA_COLUMNS}, correo_electronico, numero_telefono, numero_documento), asignacion_evaluadores(id, deleted_at)`;

export const evaluadorRowSchema = z.object({
  id: z.string(),
  especialidad: z.string().nullable(),
  entidad: z.string().nullable(),
  experiencia: z.union([z.string(), z.number()]).nullable().transform((value) => (value === null ? null : String(value))),
  estado: z.string().nullable(),
  updated_at: z.string().nullable(),
  id_usuario_fk: z.string().nullable(),
  usuario: embeddedOne(
    personaRowSchema.extend({
      correo_electronico: z.string().nullable(),
      numero_telefono: z.string().nullable(),
      numero_documento: z.string().nullable(),
    })
  ),
  asignacion_evaluadores: z.array(z.object({ id: z.string(), deleted_at: z.string().nullable() })).nullable(),
});

export type EvaluadorRow = z.infer<typeof evaluadorRowSchema>;

export const evaluatorFormSchema = z.object({
  idUsuario: z.uuid("Selecciona el usuario evaluador."),
  especialidad: z.string().trim().min(1, "La especialidad es obligatoria."),
  entidad: z.string().trim(),
  experiencia: z.string().trim(),
});

export type EvaluatorFormValues = z.infer<typeof evaluatorFormSchema>;
