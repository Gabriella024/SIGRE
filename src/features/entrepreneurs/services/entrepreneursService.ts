import { z } from "zod";

import { supabase } from "@/lib/supabase";

import {
  EMPRENDEDOR_COLUMNS,
  emprendedorRowSchema,
} from "../schemas/entrepreneursSchema";
import { toEntrepreneur } from "../utils/entrepreneurUtils";

import type { Entrepreneur } from "../types/entrepreneur";

export async function getEntrepreneurs(): Promise<Entrepreneur[]> {
  const { data, error } = await supabase
    .from("emprendedores")
    .select(EMPRENDEDOR_COLUMNS)
    .is("deleted_at", null)
    .order("nombre_completo", { ascending: true });

  if (error) throw new Error(error.message);

  const parsed = z.array(emprendedorRowSchema).safeParse(data);

  if (!parsed.success) {
    throw new Error("La respuesta de emprendedores no tiene el formato esperado.");
  }

  return parsed.data.map(toEntrepreneur);
}
