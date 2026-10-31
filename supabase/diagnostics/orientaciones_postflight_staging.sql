-- SIGRE · Orientaciones · POST-EJECUCIÓN (SOLO LECTURA) · Ejecutar en STAGING después de las dos migraciones.
-- Una sola consulta: devuelve un informe JSON. No modifica nada.
-- Esperado: "politicas_ok": true, "trigger_ok": true, "ok": true; "huella_politicas_otras_tablas" igual a la
-- de la pre-ejecución y "triggers_asistencias" = valor de la pre-ejecución + 1.

WITH pol AS (
    SELECT policyname, cmd, roles, permissive
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'orientacion_inscripciones'
),
trg AS (
    SELECT t.tgname, t.tgenabled, t.tgtype, p.prosecdef, pg_get_triggerdef(t.oid) AS definicion
    FROM pg_trigger t JOIN pg_proc p ON p.oid = t.tgfoid
    WHERE t.tgrelid = 'public.asistencias'::regclass AND t.tgname = 'sigre_asistencias_validar_inicio'
),
chequeo AS (
    SELECT
        (SELECT count(*) FROM pol) = 3
        AND NOT EXISTS (SELECT 1 FROM pol WHERE cmd <> 'SELECT' OR roles <> '{authenticated}' OR permissive <> 'PERMISSIVE')
        AND (SELECT array_agg(policyname::text ORDER BY policyname) FROM pol)
            = ARRAY['sigre_inscripciones_select_admin', 'sigre_inscripciones_select_orientador',
                    'sigre_inscripciones_select_propias'] AS politicas_ok,
        (SELECT count(*) FROM trg) = 1
        AND EXISTS (SELECT 1 FROM trg WHERE tgenabled = 'O' AND tgtype = (1 | 2 | 4 | 16) AND NOT prosecdef) AS trigger_ok
)
SELECT jsonb_pretty(jsonb_build_object(
    'politicas', (SELECT coalesce(jsonb_agg(to_jsonb(pol) ORDER BY policyname), '[]') FROM pol),
    'politicas_ok', (SELECT politicas_ok FROM chequeo),
    'rls_activo', (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.orientacion_inscripciones'::regclass),
    'trigger', (SELECT coalesce(jsonb_agg(jsonb_build_object(
                    'nombre', tgname, 'habilitado', tgenabled = 'O', 'before_insert_update_por_fila', tgtype = (1 | 2 | 4 | 16),
                    'security_definer', prosecdef, 'definicion', definicion)), '[]') FROM trg),
    'trigger_ok', (SELECT trigger_ok FROM chequeo),
    'triggers_asistencias', (SELECT count(*) FROM pg_trigger
                             WHERE tgrelid = 'public.asistencias'::regclass AND NOT tgisinternal),
    'huella_politicas_otras_tablas', (
        SELECT md5(coalesce(string_agg(p.tablename || p.policyname || p.cmd || p.roles::text
                                       || coalesce(p.qual, '') || coalesce(p.with_check, ''),
                                       '|' ORDER BY p.tablename, p.policyname), ''))
        FROM pg_policies p
        WHERE p.schemaname = 'public' AND p.tablename <> 'orientacion_inscripciones'),
    'ok', (SELECT politicas_ok AND trigger_ok FROM chequeo)
)) AS postflight;
