import { z } from "zod";

import { PERSONA_COLUMNS, embeddedOne, numericSchema, personaRowSchema } from "@/lib/personName";

export const RETO_COLUMNS = "id, titulo, descripcion, orden, estado, created_at, updated_at, cumplimiento_retos(count)";

export const retoRowSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  descripcion: z.string().nullable(),
  orden: numericSchema,
  estado: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
  cumplimiento_retos: z.array(z.object({ count: z.number() })).nullable(),
});

export type RetoRow = z.infer<typeof retoRowSchema>;

export const CUMPLIMIENTO_COLUMNS = `id, fecha_entrega, estado_cumplimiento, observacion, archivo_evidencia, id_proyecto_fk, proyecto:proyectos(titulo, emprendedor:emprendedores(nombre_completo)), sustentacion_retos(id, resultado, observacion, fecha_sustentacion, orientador:usuarios!id_orientador_fk(${PERSONA_COLUMNS}))`;

export const cumplimientoRowSchema = z.object({
  id: z.string(),
  fecha_entrega: z.string().nullable(),
  estado_cumplimiento: z.string().nullable(),
  observacion: z.string().nullable(),
  archivo_evidencia: z.string().nullable(),
  id_proyecto_fk: z.string().nullable(),
  proyecto: embeddedOne(
    z.object({
      titulo: z.string(),
      emprendedor: embeddedOne(z.object({ nombre_completo: z.string() })),
    })
  ),
  sustentacion_retos: z
    .array(
      z.object({
        id: z.string(),
        resultado: z.string().nullable(),
        observacion: z.string().nullable(),
        fecha_sustentacion: z.string().nullable(),
        orientador: embeddedOne(personaRowSchema),
      })
    )
    .nullable(),
});

export type CumplimientoRow = z.infer<typeof cumplimientoRowSchema>;

export const RETO_ESTADOS = [
  { value: "programado", label: "Programado" },
  { value: "en_curso", label: "En curso" },
  { value: "finalizado", label: "Finalizado" },
  { value: "cancelado", label: "Cancelado" },
] as const;

const estadoValues = RETO_ESTADOS.map((estado) => estado.value) as [string, ...string[]];

export const challengeFormSchema = z.object({
  titulo: z.string().trim().min(1, "El título del reto es obligatorio."),
  descripcion: z.string().trim(),
  orden: z
    .string()
    .trim()
    .regex(/^\d+$/, "El nivel debe ser un número entero positivo.")
    .refine((value) => Number(value) >= 1, "El nivel debe ser mayor o igual a 1."),
  estado: z.enum(estadoValues, "Selecciona un estado válido."),
});

export type ChallengeFormValues = z.infer<typeof challengeFormSchema>;

export const assignChallengeFormSchema = z.object({
  idProyecto: z.uuid("Selecciona un proyecto válido."),
  fechaEntrega: z.string().trim(),
});

export type AssignChallengeFormValues = z.infer<typeof assignChallengeFormSchema>;
