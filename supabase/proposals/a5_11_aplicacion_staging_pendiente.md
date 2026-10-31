# SIGRE · A5-11 en STAGING · Pendiente de autorización independiente (NO APLICADA)

Migración: `supabase/migrations/20261026120000_a5_11_invitaciones_numero_documento.sql`.

## Estado verificado (solo lectura, 2026-10-30)

`public.sigre_invitaciones` en STAGING **no** tiene:
- la columna `numero_documento`;
- la restricción `sigre_invitaciones_documento_valido`;
- el índice único parcial `sigre_invitaciones_documento_abierto_uk`.

Sí existe `sigre_invitaciones_correo_abierto_uk`, que impide abrir dos invitaciones para el mismo correo.

## Efecto actual

La Edge Function A5 versionada (`supabase/functions/sigre-admin-invitar-usuario/index.ts`) usa esa columna en dos
momentos:
- **Al verificar duplicados**, consulta `sigre_invitaciones.numero_documento`. Con la columna ausente, PostgREST
  responde error y A5 devuelve 500: «No se pudieron verificar duplicados».
- **Al registrar el seguimiento**, inserta `numero_documento`.

Hoy, por lo tanto, una invitación A5 en STAGING falla antes de crear la cuenta. No crea usuarios a medias.
`sigre_invitaciones` tiene 0 filas.

## Qué hace la migración

1. `ADD COLUMN IF NOT EXISTS numero_documento text`, que admite NULL. No modifica filas existentes.
2. Agrega la restricción `CHECK`: el documento es NULL o va sin espacios al inicio ni al final y no está vacío.
3. Aborta si hay documentos duplicados en invitaciones abiertas. Con 0 filas no puede ocurrir.
4. Crea el índice único parcial sobre el documento en invitaciones `pendiente` o `requiere_revision`. A5 lo usa
   para responder `DOCUMENTO_INVITACION_ABIERTA` (409).
5. Agrega un comentario a la columna.

Es una migración idempotente, que corre en una sola transacción y no borra ni cambia datos.

## Verificación previa a ejecutarla

Debe reconstruir sin errores con `supabase/scripts/verificar_reconstruccion.mjs`, cosa que ya se comprobó: la
reconstrucción local incluye A5-11.

## Para aplicarla (requiere autorización expresa)

1. En el SQL Editor de STAGING, ejecutar el archivo completo una sola vez.
2. Verificar en solo lectura que existen la columna, la restricción y el índice.
3. Registrar la versión: `supabase migration repair --status applied 20261026120000`.
4. Probar una invitación A5 con un correo controlado, después de resolver la activación de cuentas
   (`a5_activacion_usuarios_propuesta.md`).

**Reversión** (solo si no hay invitaciones con documento):
`DROP INDEX public.sigre_invitaciones_documento_abierto_uk;`,
`ALTER TABLE public.sigre_invitaciones DROP CONSTRAINT sigre_invitaciones_documento_valido, DROP COLUMN numero_documento;`.
