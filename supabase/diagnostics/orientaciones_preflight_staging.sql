-- SIGRE · Orientaciones · PRE-EJECUCIÓN (SOLO LECTURA) · Ejecutar en STAGING antes de las migraciones.
-- Una sola consulta: devuelve un informe JSON. No modifica nada.
-- Esperado: "listo_para_migrar": true. Guardar "huella_politicas_otras_tablas" y "triggers_asistencias"
-- para compararlos con la post-ejecución.

SELECT jsonb_pretty(jsonb_build_object(
    'proyecto', jsonb_build_object(
        'base_de_datos', current_database(),
        'usuario', current_user,
        'cuenta_auth_laura_staging', EXISTS (SELECT 1 FROM auth.users WHERE id = 'bbd440b7-717e-416c-a2e7-0a33ee1d1320'),
        'centro_demo_ccs', EXISTS (SELECT 1 FROM public.sena_centros WHERE codigo = 'DEMO-CCS'),
        'jornada_demo', EXISTS (SELECT 1 FROM public.orientaciones WHERE id = 'e2997c86-64c4-45ae-8046-ce3cd622e13e')),
    'orientacion_inscripciones', (
        SELECT jsonb_build_object(
            'rls_activo', c.relrowsecurity,
            'rls_forzado', c.relforcerowsecurity,
            'politicas', (SELECT count(*) FROM pg_policies
                          WHERE schemaname = 'public' AND tablename = 'orientacion_inscripciones'),
            'select_authenticated', has_table_privilege('authenticated', c.oid, 'SELECT'))
        FROM pg_class c WHERE c.oid = 'public.orientacion_inscripciones'::regclass),
    'trigger_existe', EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'sigre_asistencias_validar_inicio'),
    'funcion_existe', to_regprocedure('public.sigre_asistencias_validar_inicio()') IS NOT NULL,
    'triggers_asistencias', (SELECT count(*) FROM pg_trigger
                             WHERE tgrelid = 'public.asistencias'::regclass AND NOT tgisinternal),
    'huella_politicas_otras_tablas', (
        SELECT md5(coalesce(string_agg(p.tablename || p.policyname || p.cmd || p.roles::text
                                       || coalesce(p.qual, '') || coalesce(p.with_check, ''),
                                       '|' ORDER BY p.tablename, p.policyname), ''))
        FROM pg_policies p
        WHERE p.schemaname = 'public' AND p.tablename <> 'orientacion_inscripciones'),
    'listo_para_migrar', (
        EXISTS (SELECT 1 FROM auth.users WHERE id = 'bbd440b7-717e-416c-a2e7-0a33ee1d1320')
        AND (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.orientacion_inscripciones'::regclass)
        AND NOT EXISTS (SELECT 1 FROM pg_policies
                        WHERE schemaname = 'public' AND tablename = 'orientacion_inscripciones')
        AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'sigre_asistencias_validar_inicio')
        AND to_regprocedure('public.sigre_asistencias_validar_inicio()') IS NULL)
)) AS preflight;
