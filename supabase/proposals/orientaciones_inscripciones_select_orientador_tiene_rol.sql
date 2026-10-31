-- SIGRE · MIGRACIÓN ESTRUCTURAL (NO APLICADA) · Requiere autorización expresa antes de ejecutarse.
-- Destino exclusivo: STAGING (febelffifcqzvnttpued). Prohibido en PRODUCTION.
-- Defecto detectado por supabase/tests/orientaciones_rls_inscripciones_pruebas.sql (2026-10-29):
--   usuario_roles y roles solo son legibles por el Administrador (política "Admin acceso total"), así que el
--   JOIN directo de sigre_inscripciones_select_orientador nunca se cumple para el Orientador (0 filas).
-- Corrección: la condición de rol usa public.tiene_rol('orientador') (SECURITY DEFINER, STABLE), que valida
-- exactamente lo mismo (usuario, rol y asignación activos y no eliminados) sin depender de esas lecturas.
-- Solo altera la expresión USING de esa política. Nombre, comando, roles, otras políticas, GRANT y datos
-- no cambian. Cualquier guarda fallida aborta la transacción.

BEGIN;

CREATE TEMP TABLE _rls_antes ON COMMIT DROP AS
SELECT
    (SELECT md5(coalesce(string_agg(p.tablename || p.policyname || p.cmd || p.roles::text
                                    || coalesce(p.qual, '') || coalesce(p.with_check, ''),
                                    '|' ORDER BY p.tablename, p.policyname), ''))
     FROM pg_policies p
     WHERE p.schemaname = 'public'
       AND NOT (p.tablename = 'orientacion_inscripciones' AND p.policyname = 'sigre_inscripciones_select_orientador'))
        AS huella_otras_politicas,
    (SELECT relacl::text FROM pg_class WHERE oid = 'public.orientacion_inscripciones'::regclass) AS grants;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = 'bbd440b7-717e-416c-a2e7-0a33ee1d1320') THEN
        RAISE EXCEPTION 'ABORTADO: este proyecto no es STAGING';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies
                   WHERE schemaname = 'public' AND tablename = 'orientacion_inscripciones'
                     AND policyname = 'sigre_inscripciones_select_orientador'
                     AND cmd = 'SELECT' AND roles = '{authenticated}') THEN
        RAISE EXCEPTION 'ABORTADO: no existe la política sigre_inscripciones_select_orientador esperada';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_proc
                   WHERE oid = 'public.tiene_rol(text)'::regprocedure AND prosecdef AND provolatile = 's') THEN
        RAISE EXCEPTION 'ABORTADO: public.tiene_rol(text) no es SECURITY DEFINER STABLE';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_proc
                   WHERE oid = 'public.tiene_rol(text)'::regprocedure AND proconfig @> ARRAY['search_path=""']) THEN
        RAISE EXCEPTION 'ABORTADO: public.tiene_rol(text) no fija search_path vacío';
    END IF;
    IF NOT has_function_privilege('authenticated', 'public.tiene_rol(text)', 'EXECUTE') THEN
        RAISE EXCEPTION 'ABORTADO: authenticated no puede ejecutar public.tiene_rol(text)';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies
                   WHERE schemaname = 'public' AND tablename = 'orientacion_inscripciones'
                     AND policyname = 'sigre_inscripciones_select_orientador' AND qual ILIKE '%usuario_roles%') THEN
        RAISE EXCEPTION 'ABORTADO: la política del orientador ya no es la versión original (¿ya aplicada?)';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_proc
               WHERE oid = 'public.tiene_rol(text)'::regprocedure AND prosrc ILIKE '%orientacion_inscripciones%') THEN
        RAISE EXCEPTION 'ABORTADO: tiene_rol lee orientacion_inscripciones (riesgo de recursión)';
    END IF;
END;
$$;

ALTER POLICY sigre_inscripciones_select_orientador
    ON public.orientacion_inscripciones
    USING (
        orientacion_inscripciones.deleted_at IS NULL
        AND EXISTS (
            SELECT 1
            FROM public.orientaciones o
            WHERE o.id = orientacion_inscripciones.id_orientacion_fk
              AND o.id_orientador_fk = (SELECT auth.uid())
              AND o.deleted_at IS NULL
        )
        AND (SELECT public.tiene_rol('orientador'))
    );

DO $$
DECLARE
    a _rls_antes%ROWTYPE;
BEGIN
    SELECT * INTO STRICT a FROM _rls_antes;
    IF (SELECT count(*) FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'orientacion_inscripciones') <> 3
       OR NOT EXISTS (SELECT 1 FROM pg_policies
                      WHERE schemaname = 'public' AND tablename = 'orientacion_inscripciones'
                        AND policyname = 'sigre_inscripciones_select_orientador'
                        AND cmd = 'SELECT' AND roles = '{authenticated}' AND permissive = 'PERMISSIVE'
                        AND qual ILIKE '%tiene_rol%' AND qual NOT ILIKE '%usuario_roles%') THEN
        RAISE EXCEPTION 'ABORTADO: la política resultante no es la esperada';
    END IF;
    IF (SELECT md5(coalesce(string_agg(p.tablename || p.policyname || p.cmd || p.roles::text
                                       || coalesce(p.qual, '') || coalesce(p.with_check, ''),
                                       '|' ORDER BY p.tablename, p.policyname), ''))
        FROM pg_policies p
        WHERE p.schemaname = 'public'
          AND NOT (p.tablename = 'orientacion_inscripciones' AND p.policyname = 'sigre_inscripciones_select_orientador'))
          <> a.huella_otras_politicas
       OR (SELECT relacl::text FROM pg_class WHERE oid = 'public.orientacion_inscripciones'::regclass)
          IS DISTINCT FROM a.grants THEN
        RAISE EXCEPTION 'ABORTADO: cambiaron otras políticas o los GRANT';
    END IF;
END;
$$;

COMMIT;

-- Esperado: 3 filas; la del orientador contiene tiene_rol y no usuario_roles.
SELECT policyname, cmd, roles, qual ILIKE '%tiene_rol%' AS usa_tiene_rol
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'orientacion_inscripciones'
ORDER BY policyname;
