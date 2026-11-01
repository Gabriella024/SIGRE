import assert from "node:assert/strict";
import { test } from "node:test";

import { isEntrepreneurScoped } from "../../src/features/evaluations/utils/evaluationUtils.ts";

test("el Emprendedor sin otros roles ve la vista propia de evaluación", () => {
  assert.equal(isEntrepreneurScoped(["emprendedor"]), true);
});

test("cualquier rol de gestión o evaluación conserva la vista de gestión", () => {
  for (const role of ["administrador", "coordinador", "orientador", "evaluador"]) {
    assert.equal(isEntrepreneurScoped(["emprendedor", role]), false, role);
  }
});

test("sin rol emprendedor no aplica la vista propia", () => {
  assert.equal(isEntrepreneurScoped([]), false);
  assert.equal(isEntrepreneurScoped(["administrador"]), false);
});
