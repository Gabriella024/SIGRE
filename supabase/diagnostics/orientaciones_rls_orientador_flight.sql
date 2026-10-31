-- SIGRE · Orientaciones · PREFLIGHT / POSTFLIGHT de la corrección RLS del Orientador (SOLO LECTURA) · STAGING.
-- Una sola consulta JSON. Ejecutar antes y después de
-- supabase/proposals/orientaciones_inscripciones_select_orientador_tiene_rol.sql y comparar:
--   ANTES:   politica_orientador = "original",  listo_para_migrar = true
--   DESPUÉS: politica_orientador = "corregida", listo_para_migrar = false
--   Idénticos antes y después: huella_otras_politicas, huella_admin, huella_propias, grants_inscripciones,
--   huella_datos, conteos (la migración no toca datos ni otras políticas).

SELECT jsonb_pretty(jsonb_build_object(
    'staging', EXISTS (SELECT 1 FROM auth.users WHERE id = 'bbd440b7-717e-416c-a2e7-0a33ee1d1320'),
    'politicas_inscripciones', (SELECT count(*) FROM pg_policies
                                WHERE schemaname = 'public' AND tablename = 'orientacion_inscripciones'),
    'politica_orientador', (SELECT CASE WHEN qual ILIKE '%tiene_rol%' AND qual NOT ILIKE '%usuario_roles%' THEN 'corregida'
                                        WHEN qual ILIKE '%usuario_roles%' THEN 'original' ELSE 'desconocida' END
                            FROM pg_policies WHERE schemaname = 'public' AND tablename = 'orientacion_inscripciones'
                              AND policyname = 'sigre_inscripciones_select_orientador'),
    'orientador_limitado_a_sus_jornadas', (SELECT qual ILIKE '%id_orientador_fk = ( SELECT auth.uid()%'
                                           FROM pg_policies WHERE schemaname = 'public' AND tablename = 'orientacion_inscripciones'
                                             AND policyname = 'sigre_inscripciones_select_orientador'),
    'huella_admin', (SELECT md5(cmd || roles::text || coalesce(qual, '')) FROM pg_policies
                     WHERE schemaname = 'public' AND tablename = 'orientacion_inscripciones' AND policyname = 'sigre_inscripciones_select_admin'),
    'huella_propias', (SELECT md5(cmd || roles::text || coalesce(qual, '')) FROM pg_policies
                       WHERE schemaname = 'public' AND tablename = 'orientacion_inscripciones' AND policyname = 'sigre_inscripciones_select_propias'),
    'huella_otras_politicas', (SELECT md5(coalesce(string_agg(p.tablename || p.policyname || p.cmd || p.roles::text
                                                              || coalesce(p.qual, '') || coalesce(p.with_check, ''),
                                                              '|' ORDER BY p.tablename, p.policyname), ''))
                               FROM pg_policies p
                               WHERE p.schemaname = 'public'
                                 AND NOT (p.tablename = 'orientacion_inscripciones'
                                          AND p.policyname = 'sigre_inscripciones_select_orientador')),
    'grants_inscripciones', (SELECT md5(relacl::text) FROM pg_class WHERE oid = 'public.orientacion_inscripciones'::regclass),
    'tiene_rol', (SELECT jsonb_build_object('security_definer', prosecdef, 'stable', provolatile = 's',
                                            'search_path_vacio', proconfig @> ARRAY['search_path=""'],
                                            'exec_authenticated', has_function_privilege('authenticated', oid, 'EXECUTE'),
                                            'valida_auth_uid', prosrc ILIKE '%auth.uid()%',
                                            'valida_activo_y_deleted_at', prosrc ILIKE '%u.estado = ''activo''%'
                                                AND prosrc ILIKE '%ur.deleted_at IS NULL%' AND prosrc ILIKE '%u.deleted_at IS NULL%',
                                            'lee_inscripciones', prosrc ILIKE '%orientacion_inscripciones%')
                  FROM pg_proc WHERE oid = 'public.tiene_rol(text)'::regprocedure),
    'conteos', jsonb_build_object(
        'orientaciones', (SELECT count(*) FROM public.orientaciones),
        'orientacion_inscripciones', (SELECT count(*) FROM public.orientacion_inscripciones),
        'asistencias', (SELECT count(*) FROM public.asistencias),
        'auditorias', (SELECT count(*) FROM public.auditorias),
        'usuarios', (SELECT count(*) FROM public.usuarios),
        'usuario_roles', (SELECT count(*) FROM public.usuario_roles),
        'emprendedores', (SELECT count(*) FROM public.emprendedores),
        'auth_users', (SELECT count(*) FROM auth.users)),
    'huella_datos', (SELECT md5(string_agg(x, '|' ORDER BY x)) FROM (
        SELECT 'o' || to_jsonb(t)::text x FROM public.orientaciones t UNION ALL
        SELECT 'i' || to_jsonb(t)::text FROM public.orientacion_inscripciones t UNION ALL
        SELECT 'a' || to_jsonb(t)::text FROM public.asistencias t UNION ALL
        SELECT 'd' || to_jsonb(t)::text FROM public.auditorias t UNION ALL
        SELECT 'u' || to_jsonb(t)::text FROM public.usuarios t UNION ALL
        SELECT 'r' || to_jsonb(t)::text FROM public.usuario_roles t UNION ALL
        SELECT 'e' || to_jsonb(t)::text FROM public.emprendedores t) s),
    'huella_auth', (SELECT md5(string_agg(id::text || coalesce(email, '') || coalesce(email_confirmed_at::text, '')
                                          || coalesce(updated_at::text, ''), '|' ORDER BY id)) FROM auth.users),
    'filas_prueba', (SELECT count(*) FROM public.orientaciones WHERE tema LIKE '\_\_prueba%'),
    'listo_para_migrar', (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'orientacion_inscripciones') = 3
                         AND EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'orientacion_inscripciones'
                                       AND policyname = 'sigre_inscripciones_select_orientador' AND qual ILIKE '%usuario_roles%')
                         AND has_function_privilege('authenticated', 'public.tiene_rol(text)', 'EXECUTE')
)) AS flight;
