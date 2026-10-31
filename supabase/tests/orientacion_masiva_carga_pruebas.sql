-- SIGRE · PRUEBAS DE ORIENTACIÓN MASIVA (SIN EFECTOS PERSISTENTES)
-- Destino: STAGING, DESPUÉS de aplicar supabase/migrations/20261030090000_orientacion_masiva_carga_prospectos.sql.
-- Prohibido en PRODUCTION. Usa una jornada desechable asignada al Orientador DEMO y documentos ficticios.
-- Termina SIEMPRE con un ERROR "RESULTADO ..." que revierte toda la transacción.

DO $$
DECLARE
    v_admin       constant uuid := '0a2a7a08-7c33-49e1-bd94-d21313924231';
    v_laura       constant uuid := 'bbd440b7-717e-416c-a2e7-0a33ee1d1320';
    v_orientador  constant uuid := '26443b44-abf8-450c-aef8-0d79dbcbc21e';
    v_carlos      constant uuid := '44ea681a-3679-4418-a8f1-dc5c9aeb9a5e';
    v_carlos_fic  constant uuid := '7a810c23-891d-429e-9526-2aa33936aafe';
    v_ajena       constant uuid := 'e2997c86-64c4-45ae-8046-ce3cd622e13e';
    v_jornada     uuid;
    v_centro      uuid;
    v_doc_carlos  text;
    v_r           jsonb;
    v_r2          jsonb;
    v_token       uuid;
    v_txt         text;
    v_n           bigint;
    v_emp_antes   bigint;
    v_aud_antes   bigint;
    v_bulk        jsonb;
    v_res         jsonb := '[]'::jsonb;
    v_fallos      int;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_laura) THEN
        RAISE EXCEPTION 'ABORTADO: este proyecto no es STAGING';
    END IF;
    IF to_regprocedure('public.sigre_registrar_carga_asistentes(uuid,text,jsonb,jsonb)') IS NULL THEN
        RAISE EXCEPTION 'ABORTADO: la migración de orientación masiva no está aplicada';
    END IF;

    CREATE FUNCTION pg_temp.ctx(p_modo text, p_usuario uuid) RETURNS void LANGUAGE plpgsql AS $f$
    BEGIN
        PERFORM set_config('role', p_modo, true);
        PERFORM set_config('request.jwt.claim.role', p_modo, true);
        PERFORM set_config('request.jwt.claim.sub', coalesce(p_usuario::text, ''), true);
        PERFORM set_config('request.jwt.claims', jsonb_build_object('role', p_modo, 'sub', p_usuario)::text, true);
    END;
    $f$;
    CREATE FUNCTION pg_temp.postgres() RETURNS void LANGUAGE plpgsql AS $f$
    BEGIN
        PERFORM set_config('request.jwt.claims', '', true);
        PERFORM set_config('request.jwt.claim.sub', '', true);
        PERFORM set_config('request.jwt.claim.role', '', true);
        EXECUTE 'RESET ROLE';
    END;
    $f$;
    CREATE FUNCTION pg_temp.chk(p_nombre text, p_esperado text, p_obtenido text) RETURNS jsonb LANGUAGE sql AS $f$
        SELECT jsonb_build_array(jsonb_build_object('prueba', p_nombre, 'ok', p_esperado IS NOT DISTINCT FROM p_obtenido,
                                                    'esperado', p_esperado, 'obtenido', p_obtenido));
    $f$;
    CREATE FUNCTION pg_temp.cargar(p_modo text, p_usuario uuid, p_jornada uuid, p_asistentes jsonb, p_rechazados jsonb)
    RETURNS text LANGUAGE plpgsql AS $f$
    DECLARE v jsonb;
    BEGIN
        PERFORM pg_temp.ctx(p_modo, p_usuario);
        v := public.sigre_registrar_carga_asistentes(p_jornada, 'prueba.xlsx', p_asistentes, p_rechazados);
        PERFORM pg_temp.postgres();
        RETURN 'OK';
    EXCEPTION WHEN others THEN
        PERFORM pg_temp.postgres();
        RETURN SQLSTATE;
    END;
    $f$;
    CREATE FUNCTION pg_temp.contar(p_modo text, p_usuario uuid, p_sql text) RETURNS text LANGUAGE plpgsql AS $f$
    DECLARE v bigint;
    BEGIN
        PERFORM pg_temp.ctx(p_modo, p_usuario);
        EXECUTE p_sql INTO v;
        PERFORM pg_temp.postgres();
        RETURN v::text;
    EXCEPTION WHEN others THEN
        PERFORM pg_temp.postgres();
        RETURN SQLSTATE;
    END;
    $f$;

    SELECT id_centro_sena_fk INTO v_centro FROM public.emprendedores WHERE id = v_carlos_fic;
    SELECT numero_documento INTO v_doc_carlos FROM public.usuarios WHERE id = v_carlos;
    SELECT count(*) INTO v_emp_antes FROM public.emprendedores;
    SELECT count(*) INTO v_aud_antes FROM public.auditorias WHERE accion = 'CARGA_MASIVA_REGISTRADA';

    INSERT INTO public.orientaciones (tema, fecha, hora_inicio, hora_fin, modalidad, estado, id_orientador_fk, id_centro_sena_fk)
    VALUES ('__prueba_masiva', (now() AT TIME ZONE 'America/Bogota')::date + 1, '08:00', '09:00', 'presencial', 'programada', v_orientador, v_centro)
    RETURNING id INTO v_jornada;

    -- 1. Carga como Administrador ------------------------------------------------------------------
    PERFORM pg_temp.ctx('authenticated', v_admin);
    v_r := public.sigre_registrar_carga_asistentes(v_jornada, 'prueba.xlsx', jsonb_build_array(
        jsonb_build_object('fila', 2, 'tipo_documento', 'CC', 'numero_documento', '8000000001', 'nombres', 'Ana', 'apellidos', 'Prueba',
                           'correo', 'ana.prueba@example.com', 'municipio', 'Barranquilla', 'fecha_nacimiento', '2000-01-02', 'edad', '26'),
        jsonb_build_object('fila', 3, 'tipo_documento', 'CC', 'numero_documento', '8000000002', 'nombres', 'Beto', 'apellidos', 'Prueba', 'correo', ''),
        jsonb_build_object('fila', 4, 'tipo_documento', 'CC', 'numero_documento', v_doc_carlos, 'nombres', 'Carlos', 'apellidos', 'Prueba'),
        jsonb_build_object('fila', 5, 'tipo_documento', 'CC', 'numero_documento', '8000000001', 'nombres', 'Ana', 'apellidos', 'Copia'),
        jsonb_build_object('fila', 6, 'tipo_documento', 'CC', 'numero_documento', 'ab', 'nombres', 'Mal', 'apellidos', 'Doc')),
      jsonb_build_array(jsonb_build_object('fila', 7, 'estado', 'error', 'mensaje', 'Correo no válido'),
                        jsonb_build_object('fila', 8, 'estado', 'duplicada', 'mensaje', 'Repetida')));
    PERFORM pg_temp.postgres();

    v_res := v_res || pg_temp.chk('admin: resumen', '{"errores": 2, "validas": 2, "inscritos": 1, "duplicadas": 2, "existentes": 1, "prospectos": 1, "invitaciones": 1}', (v_r->'resumen')::text);
    v_res := v_res || pg_temp.chk('admin: estados por fila', 'registrada,registrada,existente,rechazada,rechazada',
        (SELECT string_agg(e->>'estado', ',' ORDER BY (e->>'fila')::int) FROM jsonb_array_elements(v_r->'resultados') e));
    v_res := v_res || pg_temp.chk('admin: registros trazados (7 filas)', '7',
        (SELECT count(*)::text FROM public.registros_carga_masiva WHERE id_carga_fk = (v_r->>'id_carga')::uuid));
    v_res := v_res || pg_temp.chk('admin: lote con cantidades', 'procesada 7 2 2 2 1',
        (SELECT concat_ws(' ', estado_carga, total_fila, fila_valida, fila_error, fila_duplicada, fila_existente) FROM public.cargas WHERE id = (v_r->>'id_carga')::uuid));
    v_res := v_res || pg_temp.chk('Carlos autoinscrito origen masivo', 'masivo',
        (SELECT origen FROM public.orientacion_inscripciones WHERE id_orientacion_fk = v_jornada AND id_emprendedor_fk = v_carlos_fic));
    v_res := v_res || pg_temp.chk('prospecto creado e invitado', 'invitado 2000-01-02',
        (SELECT estado || ' ' || fecha_nacimiento FROM public.prospectos WHERE numero_documento = '8000000001'));
    v_res := v_res || pg_temp.chk('sin correo: sin prospecto', '0', (SELECT count(*)::text FROM public.prospectos WHERE numero_documento = '8000000002'));
    v_res := v_res || pg_temp.chk('no crea emprendedores', v_emp_antes::text, (SELECT count(*)::text FROM public.emprendedores));
    v_res := v_res || pg_temp.chk('auditoría de la carga', (v_aud_antes + 1)::text,
        (SELECT count(*)::text FROM public.auditorias WHERE accion = 'CARGA_MASIVA_REGISTRADA'));

    -- 2. Segunda carga del mismo aprendiz: existente y sin invitación duplicada ---------------------
    PERFORM pg_temp.ctx('authenticated', v_admin);
    v_r2 := public.sigre_registrar_carga_asistentes(v_jornada, 'prueba2.xlsx', jsonb_build_array(
        jsonb_build_object('fila', 2, 'tipo_documento', 'CC', 'numero_documento', '8000000001', 'nombres', 'Ana', 'apellidos', 'Prueba', 'correo', 'ana.prueba@example.com')), '[]');
    PERFORM pg_temp.postgres();
    v_res := v_res || pg_temp.chk('recarga: existente', 'existente', v_r2->'resultados'->0->>'estado');
    v_res := v_res || pg_temp.chk('recarga: una sola invitación activa', '1',
        (SELECT count(*)::text FROM public.invitaciones_ruta i JOIN public.prospectos p ON p.id = i.id_prospecto_fk WHERE p.numero_documento = '8000000001'));

    -- 3. Autorización --------------------------------------------------------------------------------
    v_res := v_res || pg_temp.chk('orientador asignado: permitido', 'OK', pg_temp.cargar('authenticated', v_orientador, v_jornada,
        jsonb_build_array(jsonb_build_object('fila', 2, 'tipo_documento', 'CC', 'numero_documento', '8000000003', 'nombres', 'Ciro', 'apellidos', 'Prueba')), '[]'));
    v_res := v_res || pg_temp.chk('orientador en jornada ajena: 42501', '42501', pg_temp.cargar('authenticated', v_orientador, v_ajena, '[]', '[]'));
    v_res := v_res || pg_temp.chk('emprendedor: 42501', '42501', pg_temp.cargar('authenticated', v_carlos, v_jornada, '[]', '[]'));
    v_res := v_res || pg_temp.chk('anónimo: 42501', '42501', pg_temp.cargar('anon', NULL, v_jornada, '[]', '[]'));
    v_res := v_res || pg_temp.chk('jornada inexistente: P0002', 'P0002', pg_temp.cargar('authenticated', v_admin, gen_random_uuid(), '[]', '[]'));

    -- 4. RLS -----------------------------------------------------------------------------------------
    v_res := v_res || pg_temp.chk('RLS orientador ve sus prospectos', '1', pg_temp.contar('authenticated', v_orientador,
        format('SELECT count(*) FROM public.prospectos WHERE id_orientacion_origen_fk = %L', v_jornada)));
    v_res := v_res || pg_temp.chk('RLS orientador ve sus cargas', '3', pg_temp.contar('authenticated', v_orientador,
        format('SELECT count(*) FROM public.cargas WHERE id_orientacion_fk = %L', v_jornada)));
    v_res := v_res || pg_temp.chk('RLS orientador no ve invitaciones', '0', pg_temp.contar('authenticated', v_orientador, 'SELECT count(*) FROM public.invitaciones_ruta'));
    v_res := v_res || pg_temp.chk('RLS emprendedor no ve prospectos', '0', pg_temp.contar('authenticated', v_carlos, 'SELECT count(*) FROM public.prospectos'));
    v_res := v_res || pg_temp.chk('RLS emprendedor no ve registros', '0', pg_temp.contar('authenticated', v_carlos, 'SELECT count(*) FROM public.registros_carga_masiva'));
    v_res := v_res || pg_temp.chk('RLS anónimo sin acceso a prospectos', '42501', pg_temp.contar('anon', NULL, 'SELECT count(*) FROM public.prospectos'));

    -- 5. Decisión voluntaria del aprendiz ------------------------------------------------------------
    SELECT i.token INTO v_token FROM public.invitaciones_ruta i JOIN public.prospectos p ON p.id = i.id_prospecto_fk WHERE p.numero_documento = '8000000001';
    PERFORM pg_temp.ctx('anon', NULL);
    v_txt := public.sigre_consultar_invitacion_ruta(v_token)->>'estado';
    PERFORM pg_temp.postgres();
    v_res := v_res || pg_temp.chk('anónimo consulta su invitación', 'pendiente', v_txt);
    PERFORM pg_temp.ctx('anon', NULL);
    v_txt := public.sigre_responder_invitacion_ruta(v_token, true)->>'estado';
    PERFORM pg_temp.postgres();
    v_res := v_res || pg_temp.chk('anónimo acepta', 'aceptada', v_txt);
    v_res := v_res || pg_temp.chk('prospecto acepta', 'acepto', (SELECT estado FROM public.prospectos WHERE numero_documento = '8000000001'));
    BEGIN
        PERFORM pg_temp.ctx('anon', NULL);
        PERFORM public.sigre_responder_invitacion_ruta(v_token, false);
        v_txt := 'OK';
    EXCEPTION WHEN others THEN v_txt := SQLSTATE;
    END;
    PERFORM pg_temp.postgres();
    v_res := v_res || pg_temp.chk('segunda respuesta rechazada', '22023', v_txt);
    BEGIN
        PERFORM pg_temp.ctx('anon', NULL);
        PERFORM public.sigre_responder_invitacion_ruta(gen_random_uuid(), true);
        v_txt := 'OK';
    EXCEPTION WHEN others THEN v_txt := SQLSTATE;
    END;
    PERFORM pg_temp.postgres();
    v_res := v_res || pg_temp.chk('token inexistente', 'P0002', v_txt);

    -- 6. Volumen: 150 participantes sin pérdida -------------------------------------------------------
    SELECT jsonb_agg(jsonb_build_object('fila', g + 1, 'tipo_documento', 'TI', 'numero_documento', (8100000000 + g)::text,
                                        'nombres', 'Aprendiz' || g, 'apellidos', 'Prueba', 'correo', 'aprendiz' || g || '@example.com'))
    INTO v_bulk FROM generate_series(1, 150) g;
    PERFORM pg_temp.ctx('authenticated', v_admin);
    v_r := public.sigre_registrar_carga_asistentes(v_jornada, 'masiva150.xlsx', v_bulk, '[]');
    PERFORM pg_temp.postgres();
    v_res := v_res || pg_temp.chk('150 filas: válidas', '150', v_r->'resumen'->>'validas');
    v_res := v_res || pg_temp.chk('150 filas: registros', '150',
        (SELECT count(*)::text FROM public.registros_carga_masiva WHERE id_carga_fk = (v_r->>'id_carga')::uuid));
    v_res := v_res || pg_temp.chk('150 filas: invitaciones en cola', '150',
        (SELECT count(*)::text FROM public.invitaciones_ruta WHERE id_carga_fk = (v_r->>'id_carga')::uuid AND estado = 'pendiente'));

    SELECT count(*) FILTER (WHERE NOT (e->>'ok')::boolean) INTO v_fallos FROM jsonb_array_elements(v_res) e;
    RAISE EXCEPTION 'RESULTADO (transaccion revertida): % fallos de % pruebas. FALLOS: % · TODAS: %', v_fallos, jsonb_array_length(v_res),
        (SELECT coalesce(jsonb_agg(e), '[]') FROM jsonb_array_elements(v_res) e WHERE NOT (e->>'ok')::boolean), v_res;
END $$;
