import { z } from "zod";

import { supabase } from "@/lib/supabase";

import { CLOSED_JORNADA_ESTADO, DEFAULT_JORNADA_ESTADO } from "../constants/jornada";

import {
  ORIENTACION_COLUMNS,
  ORIENTACION_DETAIL_COLUMNS,
  orientacionDetailRowSchema,
  orientacionRowSchema,
} from "../schemas/orientationSchema";
import { toOrientacion, toOrientacionDetalle } from "../utils/orientationUtils";

import type {
  JornadaChanges,
  JornadaInsert,
  Orientacion,
  OrientacionDetalle,
} from "../types/orientations";

type DbError = { code?: string; message: string };

const DB_ERROR_MESSAGES: Record<string, string> = {
  "42501": "No tienes permisos para realizar esta operación sobre la jornada.",
  "23514": "Uno de los valores no cumple las reglas de la base de datos.",
  "22P02": "Uno de los valores no es aceptado por la base de datos.",
  "23502": "Falta un valor obligatorio exigido por la base de datos.",
  "23503": "La jornada hace referencia a un registro inexistente.",
  "23505": "Ya existe una jornada con esos datos.",
  "22007": "La fecha u hora no tiene un formato válido.",
  "22008": "La fecha u hora está fuera de rango.",
  PGRST116: "La jornada no existe o no tienes permisos para verla.",
};

function toJornadaError(error: DbError, fallback: string): Error {
  const known = error.code ? DB_ERROR_MESSAGES[error.code] : undefined;
  return new Error(known ?? `${fallback} ${error.message}`);
}

export async function getOrientations(): Promise<Orientacion[]> {
  const { data, error } = await supabase
    .from("orientaciones")
    .select(ORIENTACION_COLUMNS)
    .is("deleted_at", null)
    .order("fecha", { ascending: false })
    .order("hora_inicio", { ascending: true });

  if (error) throw new Error(error.message);

  const parsed = z.array(orientacionRowSchema).safeParse(data);

  if (!parsed.success) {
    throw new Error("La respuesta de orientaciones no tiene el formato esperado.");
  }

  return parsed.data.map(toOrientacion);
}

export async function getOrientationById(id: string): Promise<OrientacionDetalle> {
  const { data, error } = await supabase
    .from("orientaciones")
    .select(ORIENTACION_DETAIL_COLUMNS)
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) throw toJornadaError(error, "No fue posible cargar la jornada.");

  const parsed = orientacionDetailRowSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error("La jornada no tiene el formato esperado.");
  }

  return toOrientacionDetalle(parsed.data);
}

export async function createJornada(payload: JornadaInsert): Promise<string> {
  const { data, error } = await supabase
    .from("orientaciones")
    .insert(payload)
    .select("id")
    .single();

  if (error) throw toJornadaError(error, "No fue posible crear la jornada.");

  return z.object({ id: z.string() }).parse(data).id;
}

export async function asignarOrientadorJornada(id: string, idOrientador: string | null): Promise<void> {
  const { data, error } = await supabase
    .from("orientaciones")
    .update({ id_orientador_fk: idOrientador })
    .eq("id", id)
    .is("deleted_at", null)
    .select("id");

  if (error) throw toJornadaError(error, "No fue posible asignar el orientador.");

  if (!data || data.length === 0) {
    throw new Error("No tienes permisos para asignar el orientador de esta jornada o ya no está disponible.");
  }
}

export async function cerrarJornada(id: string): Promise<void> {
  const { data, error } = await supabase
    .from("orientaciones")
    .update({ estado: CLOSED_JORNADA_ESTADO })
    .eq("id", id)
    .eq("estado", DEFAULT_JORNADA_ESTADO)
    .is("deleted_at", null)
    .select("id");

  if (error) throw toJornadaError(error, "No fue posible cerrar la jornada.");

  if (!data || data.length === 0) {
    throw new Error(
      "La jornada ya no está programada, fue eliminada o no tienes permisos para cerrarla. Recarga la información."
    );
  }
}

export async function updateJornada(id: string, changes: JornadaChanges): Promise<void> {
  const { data, error } = await supabase
    .from("orientaciones")
    .update(changes)
    .eq("id", id)
    .is("deleted_at", null)
    .select("id");

  if (error) throw toJornadaError(error, "No fue posible actualizar la jornada.");

  if (!data || data.length === 0) {
    throw new Error("No tienes permisos para editar esta jornada o ya no está disponible.");
  }
}
