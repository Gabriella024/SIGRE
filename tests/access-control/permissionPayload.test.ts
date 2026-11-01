// Ejecutar con: node --import ./tests/support/register-alias.mjs --test tests/access-control/*.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  levelsForRole,
  toPermissionChanges,
  toPermissionPayload,
  toRolePermissionEntry,
} from "../../src/features/access-control/utils/accessControlUtils.ts";
import { ROLE_IDS, id, screenActionEntries, snapshotPermissions } from "./stagingPermissions.fixture.ts";

import type { AccessLevel, PermissionChange, RolePermissionEntry } from "../../src/features/access-control/types/types.ts";

const ROWS = snapshotPermissions();
const MATRIX_IDS = new Set(screenActionEntries().map((entry) => entry.id));
const ROLES = Object.entries(ROLE_IDS) as [keyof typeof ROLE_IDS, number][];
const ENABLED_BY_ROLE = { coordinador: 15, evaluador: 3, administrador: 65, emprendedor: 10, orientador: 22 };

type Snapshot = { enabled: boolean; level: string; status: string | null };

// Réplica del contrato de sigre_admin_guardar_permisos_rol: el envío es el conjunto completo de permisos habilitados.
function applyRpc(rows: readonly RolePermissionEntry[], roleId: number, payload: readonly PermissionChange[]) {
  const sent = new Map(payload.map((item) => [item.screenActionId, item.level]));
  const changed: { screenActionId: string; before: Snapshot; after: Snapshot }[] = [];
  const result = rows.map((row) => {
    if (row.roleId !== roleId) return row;
    const level = sent.get(row.screenActionId);
    const before = { enabled: row.enabled, level: row.level, status: row.status };
    let after = before;
    if (level === undefined && row.enabled) after = { enabled: false, level: row.level, status: "inactivo" };
    if (level !== undefined && (!row.enabled || row.status !== "activo" || row.level !== level)) {
      after = { enabled: true, level, status: "activo" };
    }
    if (after !== before) changed.push({ screenActionId: row.screenActionId, before, after });
    return { ...row, ...after };
  });
  return { rows: result, changed };
}

function save(roleId: number, draft: Record<string, AccessLevel>) {
  const original = levelsForRole(roleId, ROWS);
  const changes = toPermissionChanges(original, draft);
  const payload = toPermissionPayload(original, draft, MATRIX_IDS);
  return { original, changes, payload, ...applyRpc(ROWS, roleId, payload) };
}

const byKey = (payload: readonly PermissionChange[]) =>
  Object.fromEntries(payload.map((item) => [item.screenActionId, item.level]));

test("toRolePermissionEntry lee habilitado de la fila", () => {
  const base = { id: "x", id_rol_fk: 2, id_pantalla_accion_fk: id("panel/ver"), nivel_acceso: "SL", estado: "inactivo" };
  assert.equal(toRolePermissionEntry({ ...base, habilitado: false }).enabled, false);
  assert.equal(toRolePermissionEntry({ ...base, habilitado: null }).enabled, false);
  assert.equal(toRolePermissionEntry({ ...base, habilitado: true }).enabled, true);
});

for (const [name, roleId] of ROLES) {
  test(`${name}: la matriz muestra solo los permisos efectivos (${ENABLED_BY_ROLE[name]})`, () => {
    const levels = levelsForRole(roleId, ROWS);
    const effective = ROWS.filter(
      (row) => row.roleId === roleId && row.enabled && row.status === "activo" && row.level !== "SA"
    );
    assert.equal(Object.keys(levels).length, ENABLED_BY_ROLE[name]);
    assert.deepEqual(levels, Object.fromEntries(effective.map((row) => [row.screenActionId, row.level])));
  });

  test(`${name}: guardar sin cambios conserva toda la matriz`, () => {
    const { changes, payload, changed } = save(roleId, {});
    assert.equal(changes.length, 0);
    assert.equal(payload.length, ENABLED_BY_ROLE[name]);
    assert.deepEqual(changed, []);
  });

  test(`${name}: un cambio individual modifica una sola fila y conserva las demás`, () => {
    const original = levelsForRole(roleId, ROWS);
    const target = [...MATRIX_IDS].find((screenActionId) => !(screenActionId in original));
    if (!target) {
      const granted = Object.keys(original)[0];
      const { changes, changed } = save(roleId, { [granted]: "SA" });
      assert.equal(changes.length, 1);
      assert.deepEqual(changed.map((item) => item.screenActionId), [granted]);
      assert.equal(changed[0].after.enabled, false);
      return;
    }
    const { changes, payload, changed } = save(roleId, { [target]: "SL" });
    assert.equal(changes.length, 1);
    assert.equal(payload.length, ENABLED_BY_ROLE[name] + 1);
    assert.deepEqual(changed.map((item) => item.screenActionId), [target]);
    assert.deepEqual(changed[0].after, { enabled: true, level: "SL", status: "activo" });
  });

  test(`${name}: guardar no afecta a ningún otro rol`, () => {
    const original = levelsForRole(roleId, ROWS);
    const draft = Object.fromEntries(Object.keys(original).slice(0, 1).map((key) => [key, "SA" as AccessLevel]));
    const { rows } = save(roleId, draft);
    for (const [, otherId] of ROLES.filter(([, other]) => other !== roleId)) {
      assert.deepEqual(levelsForRole(otherId, rows), levelsForRole(otherId, ROWS));
      assert.deepEqual(rows.filter((row) => row.roleId === otherId), ROWS.filter((row) => row.roleId === otherId));
    }
  });
}

test("evaluador: conserva evaluaciones ver/crear/editar = LE y Panel → Ver aparece como SA", () => {
  const levels = levelsForRole(ROLE_IDS.evaluador, ROWS);
  assert.deepEqual(levels, {
    [id("evaluaciones/ver")]: "LE",
    [id("evaluaciones/crear")]: "LE",
    [id("evaluaciones/editar")]: "LE",
  });
  const panel = ROWS.find((row) => row.roleId === ROLE_IDS.evaluador && row.screenActionId === id("panel/ver"));
  assert.deepEqual({ enabled: panel?.enabled, level: panel?.level, status: panel?.status }, {
    enabled: false,
    level: "SL",
    status: "inactivo",
  });
  assert.equal(levels[id("panel/ver")] ?? "SA", "SA");
});

test("evaluador: activar Panel → Ver = SL envía exactamente cuatro permisos y cambia una fila", () => {
  const { changes, payload, changed } = save(ROLE_IDS.evaluador, { [id("panel/ver")]: "SL" });
  assert.equal(changes.length, 1);
  assert.deepEqual(byKey(payload), {
    [id("evaluaciones/ver")]: "LE",
    [id("evaluaciones/crear")]: "LE",
    [id("evaluaciones/editar")]: "LE",
    [id("panel/ver")]: "SL",
  });
  assert.equal(payload.length, 4);
  assert.deepEqual(changed, [
    {
      screenActionId: id("panel/ver"),
      before: { enabled: false, level: "SL", status: "inactivo" },
      after: { enabled: true, level: "SL", status: "activo" },
    },
  ]);
});

test("evaluador: el envío anterior (solo diferencias) habría deshabilitado Evaluación", () => {
  const original = levelsForRole(ROLE_IDS.evaluador, ROWS);
  const legacy = toPermissionChanges(original, { [id("panel/ver")]: "SL" });
  const { changed } = applyRpc(ROWS, ROLE_IDS.evaluador, legacy);
  assert.deepEqual(
    changed.filter((item) => !item.after.enabled).map((item) => item.screenActionId).sort(),
    [id("evaluaciones/ver"), id("evaluaciones/crear"), id("evaluaciones/editar")].sort()
  );
});

test("cambios múltiples: alta, cambio de nivel y baja en un solo guardado", () => {
  const { changes, payload, changed } = save(ROLE_IDS.evaluador, {
    [id("panel/ver")]: "SL",
    [id("evaluaciones/ver")]: "AT",
    [id("evaluaciones/editar")]: "SA",
  });
  assert.equal(changes.length, 3);
  assert.deepEqual(byKey(payload), {
    [id("evaluaciones/ver")]: "AT",
    [id("evaluaciones/crear")]: "LE",
    [id("panel/ver")]: "SL",
  });
  assert.deepEqual(
    Object.fromEntries(changed.map((item) => [item.screenActionId, item.after])),
    {
      [id("panel/ver")]: { enabled: true, level: "SL", status: "activo" },
      [id("evaluaciones/ver")]: { enabled: true, level: "AT", status: "activo" },
      [id("evaluaciones/editar")]: { enabled: false, level: "LE", status: "inactivo" },
    }
  );
});

test("contador: volver al valor original o marcar SA un permiso deshabilitado no cuenta como cambio", () => {
  const original = levelsForRole(ROLE_IDS.evaluador, ROWS);
  const draft: Record<string, AccessLevel> = {
    [id("evaluaciones/ver")]: "LE",
    [id("pitch/ver")]: "SA",
    [id("panel/ver")]: "SA",
  };
  assert.deepEqual(toPermissionChanges(original, draft), []);
  assert.equal(toPermissionPayload(original, draft, MATRIX_IDS).length, 3);
});

test("permisos deshabilitados o inactivos se tratan como SA", () => {
  const rows: RolePermissionEntry[] = [
    { id: "1", roleId: 9, screenActionId: "a", enabled: false, level: "AT", status: "activo" },
    { id: "2", roleId: 9, screenActionId: "b", enabled: true, level: "LE", status: "inactivo" },
    { id: "3", roleId: 9, screenActionId: "c", enabled: true, level: "SA", status: "activo" },
    { id: "4", roleId: 9, screenActionId: "d", enabled: true, level: "XX", status: "activo" },
    { id: "5", roleId: 9, screenActionId: "e", enabled: true, level: "SL", status: null },
    { id: "6", roleId: 9, screenActionId: "f", enabled: true, level: "LE", status: "activo" },
  ];
  assert.deepEqual(levelsForRole(9, rows), { f: "LE" });
});

test("el envío excluye pantallas/acciones que no están en la matriz", () => {
  const payload = toPermissionPayload({ a: "SL", ghost: "AT" }, { b: "LE", c: "SA" }, new Set(["a", "b", "c"]));
  assert.deepEqual(payload, [
    { screenActionId: "a", level: "SL" },
    { screenActionId: "b", level: "LE" },
  ]);
});
