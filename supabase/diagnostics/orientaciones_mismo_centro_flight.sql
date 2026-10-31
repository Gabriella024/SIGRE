-- SIGRE · Orientaciones · PREFLIGHT / POSTFLIGHT de la inscripción por centro (SOLO LECTURA) · STAGING.
-- Una sola consulta JSON. Ejecutar antes y después de supabase/proposals/orientaciones_inscripcion_mismo_centro.sql:
--   ANTES:   version = "original",     listo_para_migrar = true
--   DESPUÉS: version = "mismo_centro", listo_para_migrar = false, md5_sin_bloque = 6143acbc…
--   Idénticos antes y después: acl_rpc, funcion, huella_politicas, huella_otras_funciones, huella_datos,
--   huella_auth, conteos (la migración solo cambia el cuerpo de sigre_inscribir_en_jornada).

SELECT jsonb_pretty(jsonb_build_object(
    'staging', EXISTS (SELECT 1 FROM auth.users WHERE id = 'bbd440b7-717e-416c-a2e7-0a33ee1d1320'),
    'version', (SELECT CASE WHEN md5(prosrc) = '6143acbc6ad25153d16500dc2d4ddf47' THEN 'original'
                            WHEN prosrc LIKE '%Inscripción entre centros SENA no autorizada%' THEN 'mismo_centro'
                            ELSE 'desconocida' END
                FROM pg_proc WHERE oid = 'public.sigre_inscribir_en_jornada(uuid,uuid)'::regprocedure),
    'md5_sin_bloque', (SELECT md5(replace(prosrc, E'\r\n  -- SIGRE: inscripción entre centros solo con autorización expresa (Administrador).\r\n'
                                   || '  IF NOT v_es_admin AND NOT EXISTS (SELECT 1 FROM public.emprendedores e WHERE e.id = v_emprendedor '
                                   || 'AND e.id_centro_sena_fk IS NOT NULL AND e.id_centro_sena_fk = v_jornada.id_centro_sena_fk) THEN '
                                   || 'RAISE EXCEPTION ''Inscripción entre centros SENA no autorizada'' USING ERRCODE=''42501''; END IF;', ''))
                       FROM pg_proc WHERE oid = 'public.sigre_inscribir_en_jornada(uuid,uuid)'::regprocedure),
    'funcion', (SELECT jsonb_build_object('security_definer', prosecdef, 'volatil', provolatile,
                                          'search_path_vacio', proconfig @> ARRAY['search_path=""'],
                                          'propietario', pg_get_userbyid(proowner))
                FROM pg_proc WHERE oid = 'public.sigre_inscribir_en_jornada(uuid,uuid)'::regprocedure),
    'acl_rpc', (SELECT md5(proacl::text) FROM pg_proc WHERE oid = 'public.sigre_inscribir_en_jornada(uuid,uuid)'::regprocedure),
    'exec', jsonb_build_object('authenticated', has_function_privilege('authenticated', 'public.sigre_inscribir_en_jornada(uuid,uuid)', 'EXECUTE'),
                               'anon', has_function_privilege('anon', 'public.sigre_inscribir_en_jornada(uuid,uuid)', 'EXECUTE')),
    'dependientes', jsonb_build_object(
        'politicas', (SELECT count(*) FROM pg_policies WHERE (coalesce(qual, '') || coalesce(with_check, '')) ILIKE '%sigre_inscribir_en_jornada%'),
        'funciones', (SELECT count(*) FROM pg_proc WHERE pronamespace = 'public'::regnamespace AND prosrc ILIKE '%sigre_inscribir_en_jornada%'
                        AND oid <> 'public.sigre_inscribir_en_jornada(uuid,uuid)'::regprocedure)),
    'huella_politicas', (SELECT md5(coalesce(string_agg(p.tablename || p.policyname || p.cmd || p.roles::text
                                                        || coalesce(p.qual, '') || coalesce(p.with_check, ''),
                                                        '|' ORDER BY p.tablename, p.policyname), ''))
                         FROM pg_policies p WHERE p.schemaname = 'public'),
    'huella_otras_funciones', (SELECT md5(string_agg(p.oid::regprocedure::text || md5(p.prosrc) || coalesce(p.proacl::text, ''),
                                                     '|' ORDER BY p.oid::regprocedure::text))
                               FROM pg_proc p
                               WHERE p.pronamespace = 'public'::regnamespace
                                 AND p.oid <> 'public.sigre_inscribir_en_jornada(uuid,uuid)'::regprocedure),
    'inscripciones_entre_centros', (SELECT count(*) FROM public.orientacion_inscripciones i
                                    JOIN public.orientaciones o ON o.id = i.id_orientacion_fk
                                    JOIN public.emprendedores e ON e.id = i.id_emprendedor_fk
                                    WHERE o.id_centro_sena_fk IS DISTINCT FROM e.id_centro_sena_fk),
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
    'listo_para_migrar', (SELECT md5(prosrc) = '6143acbc6ad25153d16500dc2d4ddf47'
                                 AND (length(prosrc) - length(replace(prosrc,
                                     'IF v_emprendedor IS NULL THEN RAISE EXCEPTION ''Emprendedor no disponible'' USING ERRCODE=''22023''; END IF;', '')))
                                     / length('IF v_emprendedor IS NULL THEN RAISE EXCEPTION ''Emprendedor no disponible'' USING ERRCODE=''22023''; END IF;') = 1
                          FROM pg_proc WHERE oid = 'public.sigre_inscribir_en_jornada(uuid,uuid)'::regprocedure)
)) AS flight;
