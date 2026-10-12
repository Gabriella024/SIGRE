import { z } from "zod";

import { supabase } from "@/lib/supabase";

import { ORIENTACION_COLUMNS, orientacionRowSchema } from "../schemas/orientationSchema";
import { toOrientacion } from "../utils/orientationUtils";

import type { Orientacion } from "../types/orientations";

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
