// Ejecutar con: node --import ./tests/support/register-alias.mjs --test tests/dashboard/*.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";

import { DASHBOARD_SOURCES_BY_ROLE, buildRoleDashboard, evaluacionTotales } from "../../src/features/dashboard/utils/roleDashboard.ts";
import type { DashboardData, SourceId } from "../../src/features/dashboard/types/dashboard.ts";

const NOW = new Date("2026-10-31T12:00:00");
const OPTIONS = { now: NOW, minEvaluadores: 2 };

function empty(): DashboardData {
  return { emprendedores: [], proyectos: [], orientaciones: [], retos: [], pitch: [], evaluaciones: [], usuarios: [] };
}

function data(partial: Record<string, unknown[]>): DashboardData {
  return { ...empty(), ...partial } as unknown as DashboardData;
}

const reto = (id: string, estado: string | null, fechaEntrega: string | null, extra: Record<string, unknown> = {}) => ({
  id, reto: `Reto ${id}`, nivel: "R1", proyecto: `Proyecto ${id}`, emprendedor: `Emprendedor ${id}`,
  fechaEntrega, estado, evidencia: null, observacion: null, sustentaciones: 0, ultimaSustentacion: null, ultimoResultado: null, ...extra,
});

const pitch = (id: string, estado: string, fechaHora: string | null, totalEvaluadores: number, extra: Record<string, unknown> = {}) => ({
  id, proyectoId: `p-${id}`, proyecto: `Proyecto ${id}`, emprendedor: `Emprendedor ${id}`, fechaHora, modalidad: "presencial",
  lugarLink: null, estado, observacion: null, updatedAt: null, evaluadores: [], totalEvaluadores, evaluadoresNombres: null, cumpleMinimo: totalEvaluadores >= 2, ...extra,
});

const jornada = (id: string, fecha: string, extra: Record<string, unknown> = {}) => ({
  id, tema: `Jornada ${id}`, fecha, horario: "10:00 - 11:00", modalidad: "presencial", estado: "programada", orientador: null,
  cupo: 3, inscritos: 2, asistieron: 1, noAsistieron: 0, miInscripcion: null, miAsistencia: null, ...extra,
});

const all = (role: keyof typeof DASHBOARD_SOURCES_BY_ROLE) => new Set<SourceId>(DASHBOARD_SOURCES_BY_ROLE[role]);
const depsOf = (model: ReturnType<typeof buildRoleDashboard>) => new Set([...model.kpis, ...model.sections].flatMap((item) => item.deps));

test("el evaluador solo usa sus evaluaciones asignadas", () => {
  assert.deepEqual([...DASHBOARD_SOURCES_BY_ROLE.evaluador], ["evaluaciones"]);
  const model = buildRoleDashboard("evaluador", data({ emprendedores: [{ id: "x", nombre: "Ajeno Secreto", estado: "activo" }] }), all("evaluador"), OPTIONS);
  assert.deepEqual([...depsOf(model)], ["evaluaciones"]);
  assert.ok(!JSON.stringify(model).includes("Ajeno Secreto"));
});

test("el emprendedor no consulta usuarios, emprendedores ni evaluaciones y no ve resultados del pitch", () => {
  const sources = DASHBOARD_SOURCES_BY_ROLE.emprendedor;
  for (const prohibited of ["usuarios", "emprendedores", "evaluaciones"] as const) assert.ok(!sources.includes(prohibited), prohibited);
  const model = buildRoleDashboard(
    "emprendedor",
    data({ proyectos: [{ id: "p-1", titulo: "Mi café", etapa: "pitch", estado: "activo", sector: null, createdAt: "2026-10-01T00:00:00Z" }], pitch: [pitch("1", "cerrado", "2026-10-20T15:00:00Z", 3, { proyectoId: "p-1" })] }),
    all("emprendedor"),
    OPTIONS
  );
  const proyecto = model.sections.find((section) => section.kind === "project");
  assert.ok(proyecto && proyecto.kind === "project");
  assert.equal(proyecto.pitch?.estadoLabel, "Cerrado");
  assert.ok(!/aprobad|puntaje|promedio/i.test(JSON.stringify(proyecto)));
});

test("solo el administrador puede incluir usuarios", () => {
  for (const role of ["coordinador", "orientador", "evaluador", "emprendedor"] as const) {
    assert.ok(!DASHBOARD_SOURCES_BY_ROLE[role].includes("usuarios"), role);
  }
  assert.ok(DASHBOARD_SOURCES_BY_ROLE.administrador.includes("usuarios"));
});

test("un indicador o sección sin permiso sobre su fuente no se muestra", () => {
  const enabled = new Set<SourceId>(["emprendedores", "proyectos"]);
  const model = buildRoleDashboard("administrador", empty(), enabled, OPTIONS);
  for (const dep of depsOf(model)) assert.ok(enabled.has(dep), dep);
  assert.equal(model.kpis.find((kpi) => kpi.id === "usuarios"), undefined);
  assert.equal(model.sections.find((section) => section.id === "alertas"), undefined);
});

test("administrador: indicadores con datos reales", () => {
  const model = buildRoleDashboard(
    "administrador",
    data({
      emprendedores: [{ id: "e1", estado: "activo" }, { id: "e2", estado: "inactivo" }],
      usuarios: [{ id: "u1", estado: "activo" }, { id: "u2", estado: "activo" }, { id: "u3", estado: "inactivo" }],
      orientaciones: [jornada("j1", "2026-10-10", { asistieron: 2 }), jornada("j2", "2026-11-05", { asistieron: 0 })],
      evaluaciones: [
        { id: "v1", proyecto: "A", estado: "Calificación completa", estadoPitch: "cerrado", asignados: 3, calificados: 3, fechaPitch: null },
        { id: "v2", proyecto: "B", estado: "En revisión", estadoPitch: "en_evaluacion", asignados: 2, calificados: 1, fechaPitch: null },
      ],
    }),
    all("administrador"),
    OPTIONS
  );
  const kpi = (id: string) => model.kpis.find((item) => item.id === id);
  assert.equal(kpi("emprendedores")?.value, 2);
  assert.equal(kpi("emprendedores")?.hint, "1 activo");
  assert.equal(kpi("usuarios")?.value, 2);
  assert.equal(kpi("asistencias")?.value, 2);
  assert.equal(kpi("jornadas")?.hint, "1 próxima");
  assert.equal(kpi("evaluaciones")?.value, 4, "calificaciones registradas, no pitch");
  assert.equal(kpi("evaluaciones")?.hint, "de 5 asignadas");
  const progreso = model.sections.find((section) => section.kind === "progress");
  assert.ok(progreso && progreso.kind === "progress");
  assert.equal(progreso.items[0].label, "B", "las calificaciones incompletas van primero");
});

test("alertas: reto vencido y pitch sin mínimo de evaluadores primero", () => {
  const model = buildRoleDashboard(
    "administrador",
    data({
      retos: [reto("r1", "asignado", "2026-10-20"), reto("r2", "entregado", "2026-10-25"), reto("r3", "aprobado", "2026-10-01"), reto("r4", "asignado", "2026-11-10")],
      pitch: [pitch("p1", "confirmado", "2026-11-20T15:00:00Z", 1), pitch("p2", "programado", "2026-10-15T15:00:00Z", 2), pitch("p3", "cerrado", "2026-10-01T15:00:00Z", 1)],
    }),
    all("administrador"),
    OPTIONS
  );
  const alertas = model.sections.find((section) => section.kind === "alerts");
  assert.ok(alertas && alertas.kind === "alerts");
  assert.deepEqual(alertas.items.map((item) => item.id), ["reto-vencido-r1", "pitch-evaluadores-p1", "pitch-fecha-p2", "reto-revision-r2"]);
  assert.equal(alertas.items[0].days, 11);
});

test("coordinador: orientadores con emprendedores y emprendedores sin orientador", () => {
  const model = buildRoleDashboard(
    "coordinador",
    data({
      emprendedores: [
        { id: "e1", estado: "activo", orientadorId: "o1", orientador: { nombre: "Ana" } },
        { id: "e2", estado: "activo", orientadorId: "o1", orientador: { nombre: "Ana" } },
        { id: "e3", estado: "activo", orientadorId: null, orientador: null },
      ],
    }),
    all("coordinador"),
    OPTIONS
  );
  const orientadores = model.kpis.find((item) => item.id === "orientadores");
  assert.equal(orientadores?.value, 1);
  assert.equal(orientadores?.hint, "1 emprendedor sin orientador");
  const carga = model.sections.find((section) => section.id === "orientadores");
  assert.ok(carga && carga.kind === "distribution");
  assert.deepEqual(carga.items, [{ label: "Ana", value: 2 }, { label: "Sin orientador", value: 1 }]);
  assert.equal(model.kpis.find((item) => item.id === "usuarios"), undefined);
});

test("orientador: próximos compromisos ordenados y sin eventos pasados", () => {
  const model = buildRoleDashboard(
    "orientador",
    data({
      orientaciones: [jornada("j1", "2026-11-03"), jornada("j0", "2026-10-01"), jornada("jc", "2026-11-01", { estado: "cancelada" })],
      pitch: [pitch("p1", "programado", "2026-11-02T15:00:00Z", 2), pitch("p0", "programado", "2026-10-02T15:00:00Z", 2)],
      retos: [reto("r1", "requiere_ajustes", "2026-11-01"), reto("r0", "asignado", "2026-10-01")],
    }),
    all("orientador"),
    OPTIONS
  );
  const agenda = model.sections.find((section) => section.kind === "agenda");
  assert.ok(agenda && agenda.kind === "agenda");
  assert.deepEqual(agenda.items.map((item) => item.id), ["reto-r1", "pitch-p1", "jornada-j1"]);
  assert.equal(model.kpis.find((item) => item.id === "retos-revision")?.hint, "1 entrega vencida");
});

test("evaluador: calificaciones pendientes de pitch ya realizados son prioritarias", () => {
  const model = buildRoleDashboard(
    "evaluador",
    data({
      evaluaciones: [
        { id: "a1", proyecto: "Uno", estado: "Pendiente", estadoPitch: "confirmado", fechaPitch: "2026-11-12T15:00:00Z" },
        { id: "a2", proyecto: "Dos", estado: "Pendiente", estadoPitch: "en_evaluacion", fechaPitch: "2026-10-28T15:00:00Z" },
        { id: "a3", proyecto: "Tres", estado: "Completado", estadoPitch: "cerrado", fechaPitch: "2026-10-01T15:00:00Z" },
        { id: "a4", proyecto: "Cuatro", estado: "Pendiente", estadoPitch: "cancelado", fechaPitch: "2026-10-01T15:00:00Z" },
      ],
    }),
    all("evaluador"),
    OPTIONS
  );
  const kpi = (id: string) => model.kpis.find((item) => item.id === id);
  assert.equal(kpi("pendientes")?.value, 2);
  assert.equal(kpi("pendientes")?.hint, "1 de pitch ya realizado");
  assert.equal(kpi("completadas")?.value, 1);
  assert.equal(kpi("proximas")?.value, 1);
  assert.equal(kpi("pitch")?.value, 4);
  assert.equal(kpi("pitch")?.hint, "2 en curso");
  const sesiones = model.sections.find((section) => section.id === "sesiones");
  assert.ok(sesiones && sesiones.kind === "agenda");
  assert.deepEqual(sesiones.items.map((item) => item.id), ["sesion-a1"]);
  const vencimientos = model.sections.find((section) => section.kind === "alerts");
  assert.ok(vencimientos && vencimientos.kind === "alerts");
  assert.deepEqual(vencimientos.items.map((item) => [item.id, item.severity]), [["evaluacion-a2", "alta"], ["evaluacion-a1", "media"]]);
});

test("emprendedor: próximos pasos según sus retos, jornadas y pitch", () => {
  const model = buildRoleDashboard(
    "emprendedor",
    data({
      proyectos: [{ id: "p-1", titulo: "Mi café", etapa: "retos", estado: "activo", sector: null, createdAt: "2026-10-01T00:00:00Z" }],
      retos: [reto("r2", "requiere_ajustes", "2026-11-05", { nivel: "R2" }), reto("r1", "aprobado", "2026-10-05", { nivel: "R1" })],
      orientaciones: [jornada("j1", "2026-11-04", { miInscripcion: "Inscrito" })],
      pitch: [pitch("x", "programado", "2026-11-20T15:00:00Z", 2, { proyectoId: "p-1" })],
    }),
    all("emprendedor"),
    OPTIONS
  );
  const pasos = model.sections.find((section) => section.kind === "steps");
  assert.ok(pasos && pasos.kind === "steps");
  assert.deepEqual(pasos.items.map((item) => item.id), ["reto-r2", "jornada-j1", "pitch"]);
  const retos = model.sections.find((section) => section.kind === "checklist");
  assert.ok(retos && retos.kind === "checklist");
  assert.equal(retos.done, 1);
  assert.deepEqual(retos.items.map((item) => item.state), ["done", "current"]);
  assert.equal(model.kpis.length, 0);
});

test("emprendedor sin pendientes: está al día", () => {
  const model = buildRoleDashboard(
    "emprendedor",
    data({ proyectos: [{ id: "p-1", titulo: "Mi café", etapa: null, estado: "activo", sector: null, createdAt: "2026-10-01T00:00:00Z" }] }),
    all("emprendedor"),
    OPTIONS
  );
  const pasos = model.sections.find((section) => section.kind === "steps");
  assert.ok(pasos && pasos.kind === "steps");
  assert.equal(pasos.items[0].text, "Estás al día");
});

const evaluacion = (id: string, estadoPitch: string, asignados: number, calificados: number, extra: Record<string, unknown> = {}) => ({
  id, proyecto: id, emprendedor: null, fechaPitch: null, estadoPitch, asignados, calificados, votosAprobado: null, votosNoAprobado: null,
  puntaje: null, estado: calificados >= asignados && asignados >= 2 ? "Calificación completa" : "En revisión", miResultado: null, proyectoArchivado: false, ...extra,
});

test("evaluaciones: completas y pendientes se cuentan por asignación, no por pitch", () => {
  const totales = evaluacionTotales([
    evaluacion("a", "cerrado", 3, 3),
    evaluacion("b", "en_evaluacion", 3, 1),
    evaluacion("c", "confirmado", 2, 0),
    evaluacion("d", "cerrado", 2, 1),
    evaluacion("e", "cancelado", 3, 2),
    evaluacion("f", "en_evaluacion", 1, 1),
  ] as never);
  assert.deepEqual(totales, { asignadas: 11, calificadas: 6, pendientes: 4 });
});

test("coordinador: evaluaciones pendientes excluyen pitch cerrados, cancelados y archivados", () => {
  const model = buildRoleDashboard(
    "coordinador",
    data({ evaluaciones: [evaluacion("b", "en_evaluacion", 3, 1), evaluacion("d", "cerrado", 2, 1), evaluacion("x", "en_evaluacion", 3, 0, { proyectoArchivado: true })] }),
    all("coordinador"),
    OPTIONS
  );
  const kpi = model.kpis.find((item) => item.id === "evaluaciones-pendientes");
  assert.equal(kpi?.value, 2);
  assert.equal(kpi?.hint, "2 evaluaciones completas");
});

test("asistencias efectivas e inscripciones activas; jornadas canceladas no cuentan", () => {
  const model = buildRoleDashboard(
    "orientador",
    data({ orientaciones: [jornada("j1", "2026-10-10", { asistieron: 3, noAsistieron: 1, inscritos: 4 }), jornada("j2", "2026-10-12", { estado: "cancelada", asistieron: 0, inscritos: 0 })] }),
    all("orientador"),
    OPTIONS
  );
  const kpi = (id: string) => model.kpis.find((item) => item.id === id);
  assert.equal(kpi("jornadas")?.value, 1);
  assert.equal(kpi("asistencias")?.title, "Asistencias efectivas");
  assert.equal(kpi("asistencias")?.value, 3, "no suma los «No asistió»");
  assert.equal(kpi("asistencias")?.hint, "4 inscripciones activas");
});

test("retos: fecha de entrega a medianoche UTC se toma como fecha del calendario", () => {
  const model = buildRoleDashboard(
    "coordinador",
    data({ retos: [reto("hoy", "asignado", "2026-10-31T00:00:00+00:00"), reto("ayer", "asignado", "2026-10-30T00:00:00+00:00")] }),
    all("coordinador"),
    OPTIONS
  );
  assert.equal(model.kpis.find((item) => item.id === "retos-revision")?.hint, "1 entrega vencida");
});

test("retos, pitch y evaluaciones de proyectos archivados no se cuentan", () => {
  const model = buildRoleDashboard(
    "administrador",
    data({
      retos: [reto("r1", "aprobado", null), reto("r2", "asignado", null, { archivado: true })],
      pitch: [pitch("p1", "programado", null, 2), pitch("p2", "programado", null, 2, { proyectoArchivado: true })],
      evaluaciones: [evaluacion("v1", "cerrado", 2, 2), evaluacion("v2", "cerrado", 3, 3, { proyectoArchivado: true })],
    }),
    all("administrador"),
    OPTIONS
  );
  const kpi = (id: string) => model.kpis.find((item) => item.id === id);
  assert.equal(kpi("retos")?.value, 1);
  assert.equal(kpi("retos")?.hint, "1 aprobado");
  assert.equal(kpi("pitch")?.value, 1);
  assert.equal(kpi("evaluaciones")?.value, 2);
});

test("evaluador: un pitch cerrado sin su calificación ya no es pendiente; cancelados no cuentan como completados", () => {
  const model = buildRoleDashboard(
    "evaluador",
    data({
      evaluaciones: [
        { id: "a1", proyecto: "A", estado: "Pendiente", estadoPitch: "cerrado", fechaPitch: "2026-10-01T15:00:00Z" },
        { id: "a2", proyecto: "B", estado: "Pendiente", estadoPitch: "programado", fechaPitch: "2026-11-15T15:00:00Z" },
        { id: "a3", proyecto: "C", estado: "Completado", estadoPitch: "cancelado", fechaPitch: null },
        { id: "a4", proyecto: "D", estado: "Completado", estadoPitch: "cerrado", fechaPitch: null },
      ],
    }),
    all("evaluador"),
    OPTIONS
  );
  const kpi = (id: string) => model.kpis.find((item) => item.id === id);
  assert.equal(kpi("pendientes")?.value, 1);
  assert.equal(kpi("completadas")?.value, 1);
});
