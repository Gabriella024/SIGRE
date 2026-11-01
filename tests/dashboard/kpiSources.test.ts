// Ejecutar con: node --import ./tests/support/register-alias.mjs --test tests/dashboard/*.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";

import { toComplianceReportRow, toOrientationReportRow } from "../../src/features/informes/utils/informesUtils.ts";
import { toEvaluacion, toEvaluationResult } from "../../src/features/evaluations/utils/evaluationUtils.ts";
import { toPitch } from "../../src/features/pitch/utils/pitchUtils.ts";

const ARCHIVADO = "2026-10-28T20:21:47Z";

test("inscritos: solo inscripciones en estado 'inscrito' y no archivadas", () => {
  const row = toOrientationReportRow({
    id: "j1", tema: "Jornada", fecha: "2026-10-30", hora_inicio: "10:00:00", hora_fin: "11:00:00", modalidad: "presencial",
    lugar_link: null, audiencia_esperada: null, estado: "programada", id_orientador_fk: null, cupo: 5, orientador: null,
    orientacion_inscripciones: [
      { id: "i1", estado: "inscrito", deleted_at: null },
      { id: "i2", estado: "cancelado", deleted_at: null },
      { id: "i3", estado: "inscrito", deleted_at: ARCHIVADO },
      { id: "i4", estado: " Inscrito ", deleted_at: null },
    ],
    asistencias: [
      { estado_asistencia: "asistio", deleted_at: null },
      { estado_asistencia: "no_asistio", deleted_at: null },
      { estado_asistencia: "asistio", deleted_at: ARCHIVADO },
    ],
  } as never);
  assert.equal(row.inscritos, 2);
  assert.equal(row.asistieron, 1);
  assert.equal(row.noAsistieron, 1);
});

test("cumplimiento de reto: se marca archivado si el proyecto o el reto están archivados", () => {
  const base = { id: "c1", fecha_entrega: "2026-11-06T00:00:00+00:00", estado_cumplimiento: "asignado", observacion: null, archivo_evidencia: null, sustentacion_retos: [] };
  const vivo = toComplianceReportRow({ ...base, reto: { titulo: "R", orden: 1, deleted_at: null }, proyecto: { titulo: "P", deleted_at: null, emprendedor: null } } as never);
  const sinProyecto = toComplianceReportRow({ ...base, reto: { titulo: "R", orden: 1, deleted_at: null }, proyecto: { titulo: "P", deleted_at: ARCHIVADO, emprendedor: null } } as never);
  const sinReto = toComplianceReportRow({ ...base, reto: { titulo: "R", orden: 1, deleted_at: ARCHIVADO }, proyecto: { titulo: "P", deleted_at: null, emprendedor: null } } as never);
  assert.deepEqual([vivo.archivado, sinProyecto.archivado, sinReto.archivado], [false, true, true]);
});

test("resultados consolidados: asignaciones archivadas no cuentan y se marca proyecto archivado", () => {
  const calificacion = { id: "k", puntaje: 80, resultado: "aprobado", observacion: null };
  const result = toEvaluationResult({
    id: "p1", fecha_hora: "2026-11-20T15:00:00Z", estado: "en_evaluacion",
    proyecto: { titulo: "P", deleted_at: ARCHIVADO, emprendedor: null },
    asignacion_evaluadores: [
      { id: "a1", deleted_at: null, evaluador: null, calificaciones_pitch: calificacion },
      { id: "a2", deleted_at: null, evaluador: null, calificaciones_pitch: null },
      { id: "a3", deleted_at: ARCHIVADO, evaluador: null, calificaciones_pitch: calificacion },
    ],
  } as never);
  assert.equal(result.asignados, 2);
  assert.equal(result.calificados, 1);
  assert.equal(result.resultado, "En revisión");
  assert.equal(result.proyectoArchivado, true);
});

test("mi evaluación: completada solo si existe calificación", () => {
  const pitch = { id: "p1", fecha_hora: null, estado: "en_evaluacion", modalidad: null, proyecto: { titulo: "P", deleted_at: null, emprendedor: null } };
  const pendiente = toEvaluacion({ id: "a1", estado: "activo", pitch, calificaciones_pitch: null } as never);
  const completa = toEvaluacion({ id: "a2", estado: "activo", pitch, calificaciones_pitch: { id: "k", puntaje: 70, resultado: "aprobado", observacion: null } } as never);
  assert.deepEqual([pendiente.estado, completa.estado, completa.proyectoArchivado], ["Pendiente", "Completado", false]);
});

test("pitch: evaluadores archivados no cuentan y se marca proyecto archivado", () => {
  const asignacion = (id: string, deleted_at: string | null) => ({ id, estado: "activo", fecha_asignacion: null, updated_at: null, deleted_at, id_evaluador_fk: id, evaluador: null });
  const pitch = toPitch({
    id: "p1", fecha_hora: null, modalidad: null, lugar_link: null, estado: "confirmado", observacion: null, updated_at: null, id_proyecto_fk: "x",
    proyecto: { titulo: "P", deleted_at: ARCHIVADO, emprendedor: null },
    asignacion_evaluadores: [asignacion("a1", null), asignacion("a2", ARCHIVADO)],
  } as never);
  assert.equal(pitch.totalEvaluadores, 1);
  assert.equal(pitch.proyectoArchivado, true);
});
