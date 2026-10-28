import { z } from "zod";

export const ORIENTACION_COLUMNS =
  "id, tema, fecha, hora_inicio, hora_fin, modalidad, lugar_link, audiencia_esperada, estado, id_orientador_fk, cupo";

export const ORIENTACION_DETAIL_COLUMNS =
  "id, tema, descripcion, fecha, hora_inicio, hora_fin, modalidad, lugar_link, fuente, audiencia_esperada, estado, id_orientador_fk, cupo, id_centro_sena_fk, observaciones, centro:sena_centros(nombre)";

export const JORNADA_WRITABLE_FIELDS = [
  "tema",
  "fecha",
  "modalidad",
  "hora_inicio",
  "hora_fin",
  "lugar_link",
  "cupo",
  "id_centro_sena_fk",
  "observaciones",
] as const;

export const orientacionRowSchema = z.object({
  id: z.string(),
  tema: z.string(),
  fecha: z.string(),
  hora_inicio: z.string(),
  hora_fin: z.string(),
  modalidad: z.string().nullable(),
  lugar_link: z.string().nullable(),
  audiencia_esperada: z.string().nullable(),
  estado: z.string(),
  id_orientador_fk: z.string().nullable(),
  cupo: z.number().nullable(),
});

export const orientacionDetailRowSchema = orientacionRowSchema.extend({
  descripcion: z.string().nullable(),
  fuente: z.string().nullable(),
  id_centro_sena_fk: z.string().nullable(),
  observaciones: z.string().nullable(),
  centro: z.object({ nombre: z.string() }).nullable(),
});

export type OrientacionRow = z.infer<typeof orientacionRowSchema>;
export type OrientacionDetailRow = z.infer<typeof orientacionDetailRowSchema>;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

function isValidDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function toSeconds(value: string): number {
  const [hours, minutes, seconds = 0] = value.split(":").map(Number);
  return hours * 3600 + minutes * 60 + seconds;
}

const requiredTime = (label: string) =>
  z
    .string()
    .trim()
    .min(1, { message: `La hora de ${label} es obligatoria.`, abort: true })
    .regex(TIME_PATTERN, `La hora de ${label} no tiene un formato válido (HH:MM).`);

export const jornadaFormSchema = z
  .object({
    tema: z.string().trim().min(1, "El tema es obligatorio."),
    fecha: z
      .string()
      .trim()
      .min(1, { message: "La fecha es obligatoria.", abort: true })
      .refine(isValidDate, "La fecha no es válida (AAAA-MM-DD)."),
    modalidad: z.string().trim(),
    hora_inicio: requiredTime("inicio"),
    hora_fin: requiredTime("fin"),
    lugar_link: z.string().trim(),
    cupo: z
      .string()
      .trim()
      .refine(
        (value) => value === "" || /^[1-9]\d*$/.test(value),
        "El cupo debe ser un número entero positivo."
      ),
    id_centro_sena_fk: z.string().trim(),
    observaciones: z.string().trim(),
  })
  .refine(
    ({ hora_inicio, hora_fin }) =>
      !TIME_PATTERN.test(hora_inicio) ||
      !TIME_PATTERN.test(hora_fin) ||
      toSeconds(hora_fin) > toSeconds(hora_inicio),
    {
      path: ["hora_fin"],
      message: "La hora de fin debe ser posterior a la hora de inicio.",
    }
  );

export type JornadaFormValues = z.infer<typeof jornadaFormSchema>;
