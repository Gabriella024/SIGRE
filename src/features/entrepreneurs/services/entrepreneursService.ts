import { z } from "zod";

import { supabase } from "@/lib/supabase";
import { fetchAllPagesWithRetry, type PageResult } from "@/lib/pagination";

import {
  EMPRENDEDOR_COLUMNS,
  emprendedorRowSchema,
} from "../schemas/entrepreneursSchema";
import { toEntrepreneur } from "../utils/entrepreneurUtils";

import type { Entrepreneur, EntrepreneurScope } from "../types/entrepreneur";

export async function getEntrepreneurs(
  scope: EntrepreneurScope = { kind: "all" }
): Promise<Entrepreneur[]> {
  let query = supabase
    .from("emprendedores")
    .select(EMPRENDEDOR_COLUMNS)
    .is("deleted_at", null);

  if (scope.kind === "assigned") query = query.eq("id_orientador_fk", scope.orientadorId);
  if (scope.kind === "own") query = query.eq("usuario_id", scope.usuarioId);

  const { data, error } = await query.order("nombre_completo", { ascending: true });

  if (error) throw new Error(error.message);

  const parsed = z.array(emprendedorRowSchema).safeParse(data);

  if (!parsed.success) {
    throw new Error("La respuesta de emprendedores no tiene el formato esperado.");
  }

  return parsed.data.map(toEntrepreneur);
}

async function getEntrepreneursPage(
  scope: EntrepreneurScope,
  from: number,
  to: number
): Promise<PageResult<Entrepreneur>> {
  let query = supabase
    .from("emprendedores")
    .select(EMPRENDEDOR_COLUMNS, { count: "exact" })
    .is("deleted_at", null);

  if (scope.kind === "assigned") query = query.eq("id_orientador_fk", scope.orientadorId);
  if (scope.kind === "own") query = query.eq("usuario_id", scope.usuarioId);

  const { data, error, count } = await query
    .order("nombre_completo", { ascending: true })
    .order("id", { ascending: true })
    .range(from, to);

  if (error) throw new Error("No fue posible consultar los emprendedores.");

  const parsed = z.array(emprendedorRowSchema).safeParse(data);

  if (!parsed.success) {
    throw new Error("La respuesta de emprendedores no tiene el formato esperado.");
  }

  return { rows: parsed.data.map(toEntrepreneur), total: count };
}

export function getAllEntrepreneurs(scope: EntrepreneurScope = { kind: "all" }): Promise<Entrepreneur[]> {
  return fetchAllPagesWithRetry((from, to) => getEntrepreneursPage(scope, from, to));
}
