# SIGRE · A5-11 en STAGING · APLICADA el 2026-10-30 (autorización independiente)

Migración: `supabase/migrations/20261026120000_a5_11_invitaciones_numero_documento.sql`.

## Estado antes de aplicarla (solo lectura, 2026-10-30)

`public.sigre_invitaciones` en STAGING **no** tiene:
- la columna `numero_documento`;
- la restricción `sigre_invitaciones_documento_valido`;
- el índice único parcial `sigre_invitaciones_documento_abierto_uk`.

Sí existe `sigre_invitaciones_correo_abierto_uk`, que impide abrir dos invitaciones para el mismo correo.

## Efecto que tenía antes de aplicarla

La Edge Function A5 versionada (`supabase/functions/sigre-admin-invitar-usuario/index.ts`) usa esa columna en dos
momentos:
- **Al verificar duplicados**, consulta `sigre_invitaciones.numero_documento`. Con la columna ausente, PostgREST
  responde error y A5 devuelve 500: «No se pudieron verificar duplicados».
- **Al registrar el seguimiento**, inserta `numero_documento`.

Con esa versión, una invitación habría fallado antes de crear la cuenta. **Corrección (2026-10-30):** en STAGING
está desplegada la versión original (`supabase/backups/sigre-admin-invitar-usuario/index.original.ts`, SHA-256
`18d0d37f…`), que no usa `sigre_invitaciones`. Por eso la falta de A5-11 no afectaba a las invitaciones de STAGING,
y A5-11 no tendrá efecto hasta que se despliegue la versión del repositorio, lo que requiere autorización.
`sigre_invitaciones` tiene 0 filas.

## Qué hace la migración

1. `ADD COLUMN IF NOT EXISTS numero_documento text`, que admite NULL. No modifica filas existentes.
2. Agrega la restricción `CHECK`: el documento es NULL o va sin espacios al inicio ni al final y no está vacío.
3. Aborta si hay documentos duplicados en invitaciones abiertas. Con 0 filas no puede ocurrir.
4. Crea el índice único parcial sobre el documento en invitaciones `pendiente` o `requiere_revision`. A5 lo usa
   para responder `DOCUMENTO_INVITACION_ABIERTA` (409).
5. Agrega un comentario a la columna.

Es una migración idempotente, que corre en una sola transacción y no borra ni cambia datos.

## Verificación previa

Debe reconstruir sin errores con `supabase/scripts/verificar_reconstruccion.mjs`, cosa que ya se comprobó: la
reconstrucción local incluye A5-11.

## Procedimiento seguido (autorizado el 2026-10-30)

1. En el SQL Editor de STAGING, ejecutar el archivo completo una sola vez.
2. Verificar en solo lectura que existen la columna, la restricción y el índice.
3. Registrar la versión: `supabase migration repair --status applied 20261026120000`.
4. Probar una invitación A5 con un correo controlado, después de resolver la activación de cuentas
   (`a5_activacion_usuarios_propuesta.md`).

**Reversión** (solo si no hay invitaciones con documento):
`DROP INDEX public.sigre_invitaciones_documento_abierto_uk;`,
`ALTER TABLE public.sigre_invitaciones DROP CONSTRAINT sigre_invitaciones_documento_valido, DROP COLUMN numero_documento;`.

## Resultado de la aplicación (2026-10-30)

- **Preflight:** proyecto SIGRE-STAGING; la columna, la restricción y el índice estaban ausentes; 0 invitaciones.
  Se tomaron huellas md5 de `usuarios` (8), `usuario_roles` (8), `roles` y de los id y correos de `auth.users` (8).
- **Archivo ejecutado:** idéntico al versionado en el commit `455b2c4`. SHA-256 `447889af…6426`, comprobado en el
  editor antes de ejecutar. Se ejecutó una sola vez, con resultado «Success».
- **Postflight:** 10/10.
  - Columna `numero_documento text` que admite NULL, restricción CHECK con `btrim`, índice único parcial y comentario.
  - RLS y FORCE sin cambios; 0 invitaciones.
  - Huellas de usuarios, roles asignados, roles y Auth idénticas a las del preflight.
- **Pruebas mínimas**, en un bloque que siempre se revierte (termina en `RAISE EXCEPTION`): 7/7.
  - Inserción con documento: correcta.
  - Documento duplicado en una invitación abierta: 23505 sobre `sigre_invitaciones_documento_abierto_uk`, el índice
    que A5 traduce a `DOCUMENTO_INVITACION_ABIERTA`.
  - Documento con espacios o vacío: 23514.
  - Documento nulo: permitido.
  - Consulta de duplicados de A5: 1 fila.
  - Volver a invitar después de cerrar la invitación anterior: permitido.
  - Después de las pruebas: 0 filas, sin restos.
- **Diferencia con el repositorio:** ninguna en la estructura. El encabezado del archivo todavía dice «PENDIENTE en
  STAGING»; se conserva para que el archivo siga siendo idéntico a lo aplicado.
- **Sin verificar de extremo a extremo:** la llamada a la Edge Function A5. Solo admite el origen
  `http://localhost:5173` (`SIGRE_ALLOWED_ORIGINS`) y requiere una sesión de administrador en ese origen. La prueba
  segura es invitar un correo que ya existe en `usuarios` (por ejemplo, un evaluador DEMO): A5 responde 409 antes
  de invitar, tanto en la versión del repositorio como en la original (la desplegada). Sin enviar invitaciones ni
  crear cuentas. Para ejercitar A5-11 hay que desplegar antes la versión del repositorio.
- **Registro para la CLI:** `supabase migration repair --status applied 20261026120000`.
