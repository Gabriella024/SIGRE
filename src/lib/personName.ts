import { z } from "zod";

export const PERSONA_COLUMNS = "primer_nombre, segundo_nombre, primer_apellido, segundo_apellido";

export const personaRowSchema = z.object({
  primer_nombre: z.string().nullable(),
  segundo_nombre: z.string().nullable(),
  primer_apellido: z.string().nullable(),
  segundo_apellido: z.string().nullable(),
});

export type PersonaRow = z.infer<typeof personaRowSchema>;

export function personName(row: PersonaRow | null | undefined): string | null {
  if (!row) return null;
  const nombre = [row.primer_nombre, row.segundo_nombre, row.primer_apellido, row.segundo_apellido]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
  return nombre || null;
}

export function initials(nombre: string | null): string {
  if (!nombre) return "?";
  const parts = nombre.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 2 ? parts[2][0] : (parts[1]?.[0] ?? ""))).toUpperCase() || "?";
}

export const numericSchema = z
  .union([z.number(), z.string()])
  .nullable()
  .transform((value) => {
    if (value === null) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  });

export const embeddedOne = <T extends z.ZodType>(schema: T) =>
  z
    .union([schema, z.array(schema)])
    .nullable()
    .transform((value) => (Array.isArray(value) ? (value[0] ?? null) : value));
