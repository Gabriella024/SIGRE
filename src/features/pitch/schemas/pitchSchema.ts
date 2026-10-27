import { z } from "zod";

import { PERSONA_COLUMNS, embeddedOne, personaRowSchema } from "@/lib/personName";

const proyectoEmbedSchema = embeddedOne(
  z.object({
    titulo: z.string(),
    emprendedor: embeddedOne(z.object({ nombre_completo: z.string() })),
  })
);

const PROYECTO_EMBED = "proyecto:proyectos(titulo, emprendedor:emprendedores(nombre_completo))";

export const ASIGNACION_COLUMNS = `id, estado, fecha_asignacion, updated_at, deleted_at, id_evaluador_fk, evaluador:evaluadores(especialidad, id_usuario_fk, usuario:usuarios(${PERSONA_COLUMNS}))`;

export const asignacionRowSchema = z.object({
  id: z.string(),
  estado: z.string().nullable(),
  fecha_asignacion: z.string().nullable(),
  updated_at: z.string().nullable(),
  deleted_at: z.string().nullable(),
  id_evaluador_fk: z.string().nullable(),
  evaluador: embeddedOne(
    z.object({
      especialidad: z.string().nullable(),
      id_usuario_fk: z.string().nullable(),
      usuario: embeddedOne(personaRowSchema),
    })
  ),
});

export type AsignacionRow = z.infer<typeof asignacionRowSchema>;

export const PITCH_COLUMNS = `id, fecha_hora, modalidad, lugar_link, estado, observacion, updated_at, id_proyecto_fk, ${PROYECTO_EMBED}, asignacion_evaluadores(${ASIGNACION_COLUMNS})`;

export const pitchRowSchema = z.object({
  id: z.string(),
  fecha_hora: z.string().nullable(),
  modalidad: z.string().nullable(),
  lugar_link: z.string().nullable(),
  estado: z.string().nullable(),
  observacion: z.string().nullable(),
  updated_at: z.string().nullable(),
  id_proyecto_fk: z.string().nullable(),
  proyecto: proyectoEmbedSchema,
  asignacion_evaluadores: z.array(asignacionRowSchema).nullable(),
});

export type PitchRow = z.infer<typeof pitchRowSchema>;

export const PREPARACION_COLUMNS = `id, fecha, estado, observacion, ${PROYECTO_EMBED}, orientador:usuarios(${PERSONA_COLUMNS})`;

export const preparacionRowSchema = z.object({
  id: z.string(),
  fecha: z.string().nullable(),
  estado: z.string().nullable(),
  observacion: z.string().nullable(),
  proyecto: proyectoEmbedSchema,
  orientador: embeddedOne(personaRowSchema),
});

export type PreparacionRow = z.infer<typeof preparacionRowSchema>;

export const PITCH_ESTADOS = [
  { value: "programado", label: "Programado" },
  { value: "confirmado", label: "Confirmado" },
  { value: "en_evaluacion", label: "En evaluación" },
  { value: "cerrado", label: "Cerrado" },
  { value: "cancelado", label: "Cancelado" },
] as const;

export const PITCH_ESTADOS_REQUIEREN_EVALUADORES: readonly string[] = ["confirmado", "en_evaluacion"];

export const PITCH_MODALIDADES = [
  { value: "presencial", label: "Presencial" },
  { value: "virtual", label: "Virtual" },
] as const;

export const pitchFormSchema = z.object({
  idProyecto: z.uuid("Selecciona el proyecto del pitch."),
  fechaHora: z
    .string()
    .min(1, "La fecha y hora son obligatorias.")
    .refine((value) => !Number.isNaN(Date.parse(value)), "La fecha y hora no son válidas."),
  modalidad: z.enum(["presencial", "virtual"], "Selecciona la modalidad."),
  lugarLink: z.string().trim(),
  observacion: z.string().trim(),
});

export type PitchFormValues = z.infer<typeof pitchFormSchema>;
