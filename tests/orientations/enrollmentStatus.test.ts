// Ejecutar con: node --test tests/orientations/*.test.ts (Node >= 22.18, sin dependencias).
import assert from "node:assert/strict";
import { test } from "node:test";

import { inscripcionesPorJornada, isActiveEnrollment } from "../../src/features/orientations/utils/enrollmentStatus.ts";

test("inscripción 'inscrito' está activa", () => {
  assert.equal(isActiveEnrollment("inscrito"), true);
  assert.equal(isActiveEnrollment(" Inscrito "), true);
});

test("inscripción 'cancelado' no está activa", () => {
  assert.equal(isActiveEnrollment("cancelado"), false);
  assert.equal(isActiveEnrollment("CANCELADO"), false);
});

test("estados ajenos al CHECK o ausentes no se consideran activos", () => {
  for (const estado of ["cancelada", "anulada", "pendiente", "", null]) {
    assert.equal(isActiveEnrollment(estado), false, String(estado));
  }
});

test("clasifica inscripciones por jornada: activa, cancelada y sin inscripción", () => {
  const estados = inscripcionesPorJornada([
    { orientacionId: "a", inscripcion: { estado: "inscrito" } },
    { orientacionId: "b", inscripcion: { estado: "cancelado" } },
    { orientacionId: "c", inscripcion: null },
  ]);
  assert.equal(estados.get("a"), "inscrito");
  assert.equal(estados.get("b"), "cancelado");
  assert.equal(estados.has("c"), false);
  assert.equal(estados.has("d"), false);
});

test("una inscripción existente no activa bloquea la reinscripción (se muestra como cancelada)", () => {
  const estados = inscripcionesPorJornada([{ orientacionId: "x", inscripcion: { estado: "anulada" } }]);
  assert.equal(estados.get("x"), "cancelado");
});
