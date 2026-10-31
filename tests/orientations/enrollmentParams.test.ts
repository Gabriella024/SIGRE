// Ejecutar con: node --test tests/orientations/*.test.ts (Node >= 22.18, sin dependencias).
import assert from "node:assert/strict";
import { test } from "node:test";

import { inscripcionRpcParams } from "../../src/features/orientations/utils/enrollmentParams.ts";
import { buildOrientationCapabilities } from "../../src/features/orientations/utils/orientationCapabilities.ts";

const JORNADA = "cb90f1f8-0000-4000-8000-000000000001";
const EMPRENDEDOR = "7a810c23-0000-4000-8000-000000000002";
const TODOS = { crear: true, editar: true };

test("autoinscripción no envía p_emprendedor_id", () => {
  const params = inscripcionRpcParams({ modo: "autoinscripcion", orientacionId: JORNADA });
  assert.deepEqual(params, { p_orientacion_id: JORNADA });
  assert.equal(Object.hasOwn(params, "p_emprendedor_id"), false);
});

test("inscripción manual envía p_emprendedor_id", () => {
  assert.deepEqual(inscripcionRpcParams({ modo: "manual", orientacionId: JORNADA, emprendedorId: EMPRENDEDOR }), {
    p_orientacion_id: JORNADA,
    p_emprendedor_id: EMPRENDEDOR,
  });
});

test("el Emprendedor solo tiene la autoinscripción, no la vía manual", () => {
  const caps = buildOrientationCapabilities(["emprendedor"], TODOS);
  assert.equal(caps.view, "emprendedor");
  assert.equal(caps.enroll, true);
  assert.equal(caps.enrollEntrepreneurs, false);
});

test("Administrador y Orientador conservan la inscripción manual y no se autoinscriben", () => {
  for (const rol of ["administrador", "orientador"] as const) {
    const caps = buildOrientationCapabilities([rol], TODOS);
    assert.equal(caps.enrollEntrepreneurs, true, rol);
    assert.equal(caps.enroll, false, rol);
  }
});

test("sin regresiones en el resto de capacidades por rol", () => {
  const admin = buildOrientationCapabilities(["administrador"], TODOS);
  assert.deepEqual([admin.createJornada, admin.editJornada, admin.assignOrientador, admin.manageAttendance], [true, true, true, true]);

  const orientadorSinEditar = buildOrientationCapabilities(["orientador"], { crear: false, editar: false });
  assert.equal(orientadorSinEditar.enrollEntrepreneurs, false);
  assert.equal(orientadorSinEditar.manageAttendance, false);

  const coordinador = buildOrientationCapabilities(["coordinador"], TODOS);
  assert.deepEqual([coordinador.enrollEntrepreneurs, coordinador.enroll, coordinador.createJornada], [false, false, false]);

  assert.equal(buildOrientationCapabilities(["emprendedor", "administrador"], TODOS).view, "administrador");
  assert.equal(buildOrientationCapabilities([], TODOS).view, null);
});
