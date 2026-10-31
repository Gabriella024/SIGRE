-- SIGRE · Orientaciones · PREFLIGHT / POSTFLIGHT de la visibilidad del Emprendedor (SOLO LECTURA) · STAGING.
-- Una sola consulta JSON. Ejecutar antes y después de supabase/proposals/orientaciones_visibilidad_emprendedor.sql:
--   ANTES:   version = "original",  listo_para_migrar = true
--   DESPUÉS: version = "corregida", listo_para_migrar = false
--   Idénticos antes y después: huella_politica, huella_politicas, huella_otras_funciones, acl_funcion,
--   huella_datos, conteos y huella_auth (la migración solo cambia el cuerpo de la función).

SELECT jsonb_pretty(jsonb_build_object(
    'staging', EXISTS (SELECT 1 FROM auth.users WHERE id = 'bbd440b7-717e-416c-a2e7-0a33ee1d1320'),
    'version', (SELECT CASE WHEN md5(prosrc) = 'ace1e8ee57262c1dc9c355a3cd2c0a2d' THEN 'original'
                            WHEN prosrc ILIKE '%orientacion_inscripciones%' AND prosrc ILIKE '%''programada''%' THEN 'corregida'
                            ELSE 'desconocida' END
                FROM pg_proc WHERE oid = 'public.sigre_puede_ver_orientacion_fila(uuid,uuid,timestamptz)'::regprocedure),
    'funcion', (SELECT jsonb_build_object('security_definer', prosecdef, 'stable', provolatile = 's',
                                          'search_path_vacio', proconfig @> ARRAY['search_path=""'],
                                          'propietario', pg_get_userbyid(proowner))
                FROM pg_proc WHERE oid = 'public.sigre_puede_ver_orientacion_fila(uuid,uuid,timestamptz)'::regprocedure),
    'acl_funcion', (SELECT md5(proacl::text) FROM pg_proc
                    WHERE oid = 'public.sigre_puede_ver_orientacion_fila(uuid,uuid,timestamptz)'::regprocedure),
    'huella_politica', (SELECT md5(qual) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'orientaciones'
                          AND policyname = 'sigre_orientaciones_select_autorizado'),
    'dependientes', (SELECT count(*) FROM pg_policies WHERE schemaname = 'public'
                       AND (coalesce(qual, '') || coalesce(with_check, '')) ILIKE '%sigre_puede_ver_orientacion_fila%'),
    'huella_politicas', (SELECT md5(coalesce(string_agg(p.tablename || p.policyname || p.cmd || p.roles::text
                                                        || coalesce(p.qual, '') || coalesce(p.with_check, ''),
                                                        '|' ORDER BY p.tablename, p.policyname), ''))
                         FROM pg_policies p WHERE p.schemaname = 'public'),
    'huella_otras_funciones', (SELECT md5(string_agg(p.oid::regprocedure::text || md5(p.prosrc) || coalesce(p.proacl::text, ''),
                                                     '|' ORDER BY p.oid::regprocedure::text))
                               FROM pg_proc p
                               WHERE p.pronamespace = 'public'::regnamespace
                                 AND p.oid <> 'public.sigre_puede_ver_orientacion_fila(uuid,uuid,timestamptz)'::regprocedure),
    'force_rls', (SELECT jsonb_object_agg(relname, relforcerowsecurity) FROM pg_class
                  WHERE oid IN ('public.orientaciones'::regclass, 'public.orientacion_inscripciones'::regclass,
                                'public.emprendedores'::regclass, 'public.asistencias'::regclass)),
    'conteos', jsonb_build_object(
        'orientaciones', (SELECT count(*) FROM public.orientaciones),
        'orientacion_inscripciones', (SELECT count(*) FROM public.orientacion_inscripciones),
        'asistencias', (SELECT count(*) FROM public.asistencias),
        'auditorias', (SELECT count(*) FROM public.auditorias),
        'usuarios', (SELECT count(*) FROM public.usuarios),
        'emprendedores', (SELECT count(*) FROM public.emprendedores),
        'sena_centros', (SELECT count(*) FROM public.sena_centros)),
    'huella_datos', (SELECT md5(string_agg(x, '|' ORDER BY x)) FROM (
        SELECT 'o' || to_jsonb(t)::text x FROM public.orientaciones t UNION ALL
        SELECT 'i' || to_jsonb(t)::text FROM public.orientacion_inscripciones t UNION ALL
        SELECT 'a' || to_jsonb(t)::text FROM public.asistencias t UNION ALL
        SELECT 'd' || to_jsonb(t)::text FROM public.auditorias t UNION ALL
        SELECT 'u' || to_jsonb(t)::text FROM public.usuarios t UNION ALL
        SELECT 'r' || to_jsonb(t)::text FROM public.usuario_roles t UNION ALL
        SELECT 'e' || to_jsonb(t)::text FROM public.emprendedores t UNION ALL
        SELECT 'c' || to_jsonb(t)::text FROM public.sena_centros t) s),
    'huella_auth', (SELECT md5(string_agg(id::text || coalesce(email, '') || coalesce(email_confirmed_at::text, '')
                                          || coalesce(updated_at::text, ''), '|' ORDER BY id)) FROM auth.users),
    'filas_prueba', (SELECT count(*) FROM public.orientaciones WHERE tema LIKE '\_\_prueba%'),
    'carlos_orientador', (SELECT id_orientador_fk FROM public.emprendedores WHERE id = '7a810c23-891d-429e-9526-2aa33936aafe'),
    'listo_para_migrar', (SELECT md5(prosrc) = 'ace1e8ee57262c1dc9c355a3cd2c0a2d' FROM pg_proc
                          WHERE oid = 'public.sigre_puede_ver_orientacion_fila(uuid,uuid,timestamptz)'::regprocedure)
                         AND NOT EXISTS (SELECT 1 FROM pg_class
                                         WHERE oid IN ('public.orientaciones'::regclass, 'public.orientacion_inscripciones'::regclass,
                                                       'public.emprendedores'::regclass, 'public.asistencias'::regclass)
                                           AND relforcerowsecurity)
)) AS flight;
