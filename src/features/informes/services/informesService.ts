import { z } from "zod";

import { supabase } from "@/lib/supabase";
import { fetchAllPagesWithRetry, type PageResult } from "@/lib/pagination";
import { toQueryError } from "@/lib/adminOperation";
import { getAllEntrepreneurs } from "@/features/entrepreneurs/services/entrepreneursService";
import { getOrientationHistoryByEntrepreneur } from "@/features/orientations/services/entrepreneurHistoryService";
import { getAssignedPitches, getPitches } from "@/features/pitch/services/pitchService";
import { getConsolidatedResults, getMyEvaluations } from "@/features/evaluations/service/evaluationsService";
import { PITCH_COLUMNS, pitchRowSchema } from "@/features/pitch/schemas/pitchSchema";
import { toPitch } from "@/features/pitch/utils/pitchUtils";
import { PROYECTO_EXPORT_COLUMNS, proyectoExportRowSchema } from "@/features/projects/schemas/proyectSchema";
import { toProjectExportRow } from "@/features/projects/utils/proyectUtils";
import type { Entrepreneur } from "@/features/entrepreneurs/types/entrepreneur";
import type { Pitch } from "@/features/pitch/types/pitch";
import type { ProjectExportRow } from "@/features/projects/types/proyect";

import {
  CUMPLIMIENTO_REPORT_COLUMNS,
  ORIENTACION_REPORT_COLUMNS,
  cumplimientoReportRowSchema,
  orientacionReportRowSchema,
} from "../schemas/informeSchema";
import {
  entrepreneurFilter,
  fromConsolidatedResult,
  fromMyEvaluation,
  innerJoin,
  toComplianceReportRow,
  toEntrepreneurScope,
  toOrientationReportRow,
  toPersonalOrientationRow,
  toPitchReportRow,
} from "../utils/informesUtils";

import type {
  ComplianceReportRow,
  DataScope,
  EvaluationReportRow,
  OrientationReportRow,
  PitchReportRow,
} from "../types/types";

const EMPRENDEDOR_EMBED = "emprendedor:emprendedores";
const PROYECTO_EMBED = "proyecto:proyectos";

export function getEntrepreneursReport(scope: DataScope): Promise<Entrepreneur[]> {
  if (scope.kind === "evaluador") return Promise.resolve([]);
  return getAllEntrepreneurs(toEntrepreneurScope(scope));
}

async function getProjectsPage(scope: DataScope, from: number, to: number): Promise<PageResult<ProjectExportRow>> {
  const filter = entrepreneurFilter(scope);
  const columns = filter ? innerJoin(PROYECTO_EXPORT_COLUMNS, EMPRENDEDOR_EMBED) : PROYECTO_EXPORT_COLUMNS;
  let query = supabase.from("proyectos").select(columns, { count: "exact" }).is("deleted_at", null);
  if (filter) query = query.eq(`emprendedor.${filter.column}`, filter.value);

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to);

  if (error) throw toQueryError(error, "los proyectos");

  const parsed = z.array(proyectoExportRowSchema).safeParse(data);
  if (!parsed.success) throw new Error("La respuesta de proyectos no tiene el formato esperado.");

  return { rows: parsed.data.map(toProjectExportRow), total: count };
}

export function getProjectsReport(scope: DataScope): Promise<ProjectExportRow[]> {
  if (scope.kind === "evaluador") return Promise.resolve([]);
  return fetchAllPagesWithRetry((from, to) => getProjectsPage(scope, from, to));
}

async function getOrientationsPage(scope: DataScope, from: number, to: number): Promise<PageResult<OrientationReportRow>> {
  let query = supabase.from("orientaciones").select(ORIENTACION_REPORT_COLUMNS, { count: "exact" }).is("deleted_at", null);
  if (scope.kind === "orientador") query = query.eq("id_orientador_fk", scope.usuarioId);

  const { data, error, count } = await query
    .order("fecha", { ascending: false })
    .order("id", { ascending: true })
    .range(from, to);

  if (error) throw toQueryError(error, "las orientaciones");

  const parsed = z.array(orientacionReportRowSchema).safeParse(data);
  if (!parsed.success) throw new Error("La respuesta de orientaciones no tiene el formato esperado.");

  return { rows: parsed.data.map(toOrientationReportRow), total: count };
}

async function getPersonalOrientations(usuarioId: string): Promise<OrientationReportRow[]> {
  const own = await getAllEntrepreneurs({ kind: "own", usuarioId });
  const histories = await Promise.all(own.map((item) => getOrientationHistoryByEntrepreneur(item.id)));
  return histories.flat().map(toPersonalOrientationRow);
}

export function getOrientationsReport(scope: DataScope): Promise<OrientationReportRow[]> {
  if (scope.kind === "evaluador") return Promise.resolve([]);
  if (scope.kind === "emprendedor") return getPersonalOrientations(scope.usuarioId);
  return fetchAllPagesWithRetry((from, to) => getOrientationsPage(scope, from, to));
}

async function getCompliancePage(scope: DataScope, from: number, to: number): Promise<PageResult<ComplianceReportRow>> {
  const filter = entrepreneurFilter(scope);
  const columns = filter ? innerJoin(CUMPLIMIENTO_REPORT_COLUMNS, PROYECTO_EMBED, EMPRENDEDOR_EMBED) : CUMPLIMIENTO_REPORT_COLUMNS;
  let query = supabase.from("cumplimiento_retos").select(columns, { count: "exact" });
  if (filter) query = query.eq(`proyecto.emprendedor.${filter.column}`, filter.value);

  const { data, error, count } = await query
    .order("fecha_entrega", { ascending: false, nullsFirst: false })
    .order("id", { ascending: true })
    .range(from, to);

  if (error) throw toQueryError(error, "el cumplimiento de retos");

  const parsed = z.array(cumplimientoReportRowSchema).safeParse(data);
  if (!parsed.success) throw new Error("La respuesta de cumplimiento de retos no tiene el formato esperado.");

  return { rows: parsed.data.map(toComplianceReportRow), total: count };
}

export function getComplianceReport(scope: DataScope): Promise<ComplianceReportRow[]> {
  if (scope.kind === "evaluador") return Promise.resolve([]);
  return fetchAllPagesWithRetry((from, to) => getCompliancePage(scope, from, to));
}

async function getScopedPitchPage(scope: DataScope, from: number, to: number): Promise<PageResult<Pitch>> {
  const filter = entrepreneurFilter(scope);
  if (!filter) throw new Error("El alcance de pitch no es válido.");

  const { data, error, count } = await supabase
    .from("pitch")
    .select(innerJoin(PITCH_COLUMNS, PROYECTO_EMBED, EMPRENDEDOR_EMBED), { count: "exact" })
    .eq(`proyecto.emprendedor.${filter.column}`, filter.value)
    .order("fecha_hora", { ascending: false, nullsFirst: false })
    .order("id", { ascending: true })
    .range(from, to);

  if (error) throw toQueryError(error, "los pitch");

  const parsed = z.array(pitchRowSchema).safeParse(data);
  if (!parsed.success) throw new Error("La respuesta de pitch no tiene el formato esperado.");

  return { rows: parsed.data.map(toPitch), total: count };
}

function getScopedPitches(scope: DataScope): Promise<Pitch[]> {
  switch (scope.kind) {
    case "global":
      return getPitches();
    case "evaluador":
      return getAssignedPitches(scope.usuarioId);
    default:
      return fetchAllPagesWithRetry((from, to) => getScopedPitchPage(scope, from, to));
  }
}

export async function getPitchReport(scope: DataScope): Promise<PitchReportRow[]> {
  return (await getScopedPitches(scope)).map(toPitchReportRow);
}

export async function getEvaluationsReport(scope: DataScope): Promise<EvaluationReportRow[]> {
  if (scope.kind === "global") return (await getConsolidatedResults()).map(fromConsolidatedResult);
  if (scope.kind === "evaluador") return (await getMyEvaluations(scope.usuarioId)).map(fromMyEvaluation);
  return [];
}
