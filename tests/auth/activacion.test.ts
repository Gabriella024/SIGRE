// Ejecutar con: node --test tests/auth/*.test.ts (Node >= 22.18, sin dependencias nuevas).
import assert from "node:assert/strict";
import { test } from "node:test";

import { parseAuthRedirect } from "../../src/lib/authRedirect.ts";
import { activacionSchema } from "../../src/features/auth/schemas/activacionSchema.ts";

test("enlace de invitación con token habilita la activación", () => {
  assert.deepEqual(parseAuthRedirect("#access_token=x&refresh_token=y&type=invite"), { tipo: "invite", error: null });
});

test("enlace de recuperación habilita el restablecimiento", () => {
  assert.deepEqual(parseAuthRedirect("#access_token=x&type=recovery"), { tipo: "recovery", error: null });
});

test("sin token o con otro tipo no habilita la activación", () => {
  assert.deepEqual(parseAuthRedirect(""), { tipo: null, error: null });
  assert.deepEqual(parseAuthRedirect("#type=invite"), { tipo: null, error: null });
  assert.deepEqual(parseAuthRedirect("#access_token=x&type=magiclink"), { tipo: null, error: null });
});

test("enlace vencido muestra un mensaje claro (hash o query)", () => {
  const vencido = parseAuthRedirect("#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid");
  assert.equal(vencido.tipo, null);
  assert.match(vencido.error ?? "", /expiró/);
  assert.match(parseAuthRedirect("", "?error=access_denied&error_description=x").error ?? "", /no es válido/);
});

test("la contraseña exige 8 caracteres, letra, número y confirmación igual", () => {
  assert.equal(activacionSchema.safeParse({ password: "Sigre2026", confirmacion: "Sigre2026" }).success, true);
  assert.equal(activacionSchema.safeParse({ password: "corta1", confirmacion: "corta1" }).success, false);
  assert.equal(activacionSchema.safeParse({ password: "solotexto", confirmacion: "solotexto" }).success, false);
  assert.equal(activacionSchema.safeParse({ password: "12345678", confirmacion: "12345678" }).success, false);
  assert.equal(activacionSchema.safeParse({ password: "Sigre2026", confirmacion: "Sigre2027" }).success, false);
});
