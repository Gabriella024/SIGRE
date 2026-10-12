import { z } from "zod";

import { supabase } from "@/lib/supabase";

import { PROYECTO_COLUMNS, proyectoRowSchema } from "../schemas/proyectSchema";
import { toProject } from "../utils/proyectUtils";

import type { Project } from "../types/proyect";

export async function getProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("proyectos")
    .select(PROYECTO_COLUMNS)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const parsed = z.array(proyectoRowSchema).safeParse(data);

  if (!parsed.success) {
    throw new Error("La respuesta de proyectos no tiene el formato esperado.");
  }

  return parsed.data.map(toProject);
}
