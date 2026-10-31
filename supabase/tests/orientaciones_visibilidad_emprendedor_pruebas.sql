-- SIGRE · PRUEBAS DE VISIBILIDAD DE JORNADAS (SIN EFECTOS PERSISTENTES)
-- Destino: STAGING (febelffifcqzvnttpued), DESPUÉS de aplicar
-- supabase/proposals/orientaciones_visibilidad_emprendedor.sql. Prohibido en PRODUCTION.
-- Comprueba, con la política real sigre_orientaciones_select_autorizado (lectura directa como PostgREST):
--   * Emprendedor activo: ve jornadas 'programada' futuras de su centro, las que tienen su inscripción y las que
--     tienen su asistencia; no ve jornadas de otro centro, sin centro, pasadas, finalizadas ni eliminadas.
--   * Emprendedor inactivo: deja de ver las disponibles; conserva las inscritas.
--   * Administrador, Orientador, anónimo y usuario sin perfil: sin cambios.
--   * Aislamiento: inscripciones y asistencias de otros emprendedores siguen invisibles.
--   * Flujo: el Emprendedor puede inscribirse a sí mismo por RPC en una jornada disponible.
-- Solo usa jornadas, un centro, inscripciones y auditorías desechables. No toca la jornada DEMO del
-- Orientador, ni la jornada, inscripción o asistencia de Laura (se comprueba con huella).
-- Termina SIEMPRE con un ERROR "RESULTADO ..." que revierte toda la transacción, incluidas las funciones pg_temp.

DO $$
DECLARE
    -- PARÁMETROS ---------------------------------------------------------------------------------
    v_orientador    constant uuid := NULL; -- usuarios.id del Orientador DEMO
    v_emp2_usuario  constant uuid := NULL; -- usuarios.id de DEMO-Carlos
    v_emp2_ficha    constant uuid := NULL; -- emprendedores.id de DEMO-Carlos
    ------------------------------------------------------------------------------------------------
    v_admin          constant uuid := '0a2a7a08-7c33-49e1-bd94-d21313924231';
    v_laura          constant uuid := 'bbd440b7-717e-416c-a2e7-0a33ee1d1320';
    v_laura_ficha    constant uuid := '4f19797f-03fd-4e37-99f1-b85abbdafd30';
    v_jornada_laura  constant uuid := 'e2997c86-64c4-45ae-8046-ce3cd622e13e';
    v_e513           constant uuid := '6bc62741-335e-4240-a6b0-416716865308';
    v_sin_perfil     constant uuid := gen_random_uuid();
    v_hoy            constant date := (now() AT TIME ZONE 'America/Bogota')::date;
    v_centro         uuid;
    v_otro_centro    uuid;
    v_disp           uuid;
    v_otro           uuid;
    v_sin_centro     uuid;
    v_pasada         uuid;
    v_finalizada     uuid;
    v_eliminada      uuid;
    v_inscrita       uuid;
    v_inscrita_otro  uuid;
    v_huella_real    text;
    v_txt            text;
    v_r              jsonb;
    v_res            jsonb := '[]'::jsonb;
    v_fallos         int;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_laura) THEN
        RAISE EXCEPTION 'ABORTADO: este proyecto no es STAGING';
    END IF;
    IF v_orientador IS NULL OR v_emp2_usuario IS NULL OR v_emp2_ficha IS NULL THEN
        RAISE EXCEPTION 'ABORTADO: completar v_orientador, v_emp2_usuario y v_emp2_ficha';
    END IF;
    SELECT id_centro_sena_fk INTO v_centro FROM public.emprendedores
    WHERE id = v_emp2_ficha AND usuario_id = v_emp2_usuario AND estado = 'activo' AND deleted_at IS NULL;
    IF v_centro IS NULL THEN
        RAISE EXCEPTION 'ABORTADO: la ficha de DEMO-Carlos no está activa o no tiene centro';
    END IF;
    IF (SELECT id_centro_sena_fk FROM public.emprendedores WHERE id = v_laura_ficha) IS DISTINCT FROM v_centro THEN
        RAISE EXCEPTION 'ABORTADO: se esperaba que Laura y DEMO-Carlos compartieran centro';
    END IF;

    SELECT md5(coalesce(string_agg(x, '|' ORDER BY x), '')) INTO v_huella_real FROM (
        SELECT 'o' || to_jsonb(o)::text AS x FROM public.orientaciones o
        UNION ALL SELECT 'i' || to_jsonb(i)::text FROM public.orientacion_inscripciones i
        UNION ALL SELECT 'a' || to_jsonb(a)::text FROM public.asistencias a
    ) t;

    -- Auxiliares temporales -------------------------------------------------------------------------
    CREATE FUNCTION pg_temp.restaurar() RETURNS void LANGUAGE plpgsql AS $f$
    BEGIN
        PERFORM set_config('request.jwt.claims', '', true);
        PERFORM set_config('request.jwt.claim.sub', '', true);
        PERFORM set_config('request.jwt.claim.role', '', true);
        EXECUTE 'RESET ROLE';
    END;
    $f$;

    -- modo: auth (PostgREST), anon, servicio (identidad sin RLS, para preparación como Administrador).
    CREATE FUNCTION pg_temp.ctx(p_modo text, p_usuario uuid) RETURNS void LANGUAGE plpgsql AS $f$
    BEGIN
        IF p_modo = 'anon' THEN
            PERFORM set_config('role', 'anon', true);
            PERFORM set_config('request.jwt.claim.role', 'anon', true);
            PERFORM set_config('request.jwt.claims', '{"role":"anon"}', true);
            RETURN;
        END IF;
        IF p_modo = 'auth' THEN
            PERFORM set_config('role', 'authenticated', true);
        END IF;
        PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
        PERFORM set_config('request.jwt.claim.sub', p_usuario::text, true);
        PERFORM set_config('request.jwt.claims',
            jsonb_build_object('sub', p_usuario, 'role', 'authenticated', 'aud', 'authenticated')::text, true);
    END;
    $f$;

    CREATE FUNCTION pg_temp.contar(p_modo text, p_usuario uuid, p_sql text) RETURNS jsonb LANGUAGE plpgsql AS $f$
    DECLARE
        n bigint;
        v jsonb;
    BEGIN
        BEGIN
            PERFORM pg_temp.ctx(p_modo, p_usuario);
            EXECUTE p_sql INTO n;
            v := jsonb_build_object('estado', 'OK', 'valor', n);
        EXCEPTION WHEN OTHERS THEN
            v := jsonb_build_object('estado', SQLSTATE, 'mensaje', SQLERRM);
        END;
        PERFORM pg_temp.restaurar();
        RETURN v;
    END;
    $f$;

    CREATE FUNCTION pg_temp.ejecutar(p_modo text, p_usuario uuid, p_sql text) RETURNS jsonb LANGUAGE plpgsql AS $f$
    DECLARE
        v jsonb;
    BEGIN
        BEGIN
            PERFORM pg_temp.ctx(p_modo, p_usuario);
            EXECUTE p_sql;
            v := jsonb_build_object('estado', 'OK');
        EXCEPTION WHEN OTHERS THEN
            v := jsonb_build_object('estado', SQLSTATE, 'mensaje', SQLERRM);
        END;
        PERFORM pg_temp.restaurar();
        RETURN v;
    END;
    $f$;

    CREATE FUNCTION pg_temp.probar(p_modo text, p_usuario uuid, p_sql text) RETURNS jsonb LANGUAGE plpgsql AS $f$
    DECLARE
        v jsonb;
    BEGIN
        BEGIN
            PERFORM pg_temp.ctx(p_modo, p_usuario);
            EXECUTE p_sql;
            RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = '__revertir__';
        EXCEPTION WHEN OTHERS THEN
            v := CASE WHEN SQLERRM = '__revertir__' THEN jsonb_build_object('estado', 'OK')
                      ELSE jsonb_build_object('estado', SQLSTATE, 'mensaje', SQLERRM) END;
        END;
        PERFORM pg_temp.restaurar();
        RETURN v;
    END;
    $f$;

    -- Esperado: valor exacto (conteos) o estado (OK/SQLSTATE); admite alternativas "a|b".
    CREATE FUNCTION pg_temp.chk(p_prueba text, p_esperado text, p_r jsonb) RETURNS jsonb LANGUAGE sql AS $f$
        SELECT jsonb_build_array(jsonb_build_object(
            'prueba', p_prueba, 'esperado', p_esperado,
            'obtenido', coalesce(p_r ->> 'valor', p_r ->> 'estado'), 'mensaje', p_r ->> 'mensaje',
            'ok', coalesce(p_r ->> 'valor', p_r ->> 'estado') = ANY (string_to_array(p_esperado, '|'))))
    $f$;

    CREATE FUNCTION pg_temp.ve(p_jornada uuid) RETURNS text LANGUAGE sql AS $f$
        SELECT format('SELECT count(*) FROM public.orientaciones WHERE id = %L', p_jornada)
    $f$;

    CREATE FUNCTION pg_temp.jornada(p_tema text, p_fecha date, p_estado text, p_centro uuid, p_orientador uuid)
    RETURNS uuid LANGUAGE sql AS $f$
        INSERT INTO public.orientaciones (tema, fecha, hora_inicio, hora_fin, estado, cupo, id_centro_sena_fk, id_orientador_fk)
        VALUES ('__prueba_visibilidad__ ' || p_tema, p_fecha, '08:00', '09:00', p_estado, 5, p_centro, p_orientador)
        RETURNING id
    $f$;

    CREATE FUNCTION pg_temp.inscribir(p_jornada uuid, p_ficha uuid) RETURNS text LANGUAGE sql AS $f$
        SELECT format('SELECT public.sigre_inscribir_en_jornada(p_orientacion_id => %L, p_emprendedor_id => %L)', p_jornada, p_ficha)
    $f$;

    -- Preparación (todo desechable) -----------------------------------------------------------------
    INSERT INTO public.sena_centros (id_regional_fk, codigo, nombre, estado, created_at)
    SELECT id_regional_fk, '__PRUEBA-OTRO__', 'Centro de prueba (desechable)', 'activo', now()
    FROM public.sena_centros WHERE id = v_centro
    RETURNING id INTO v_otro_centro;

    v_disp          := pg_temp.jornada('disponible', v_hoy + 10, 'programada', v_centro, v_orientador);
    v_otro          := pg_temp.jornada('otro centro', v_hoy + 10, 'programada', v_otro_centro, NULL);
    v_sin_centro    := pg_temp.jornada('sin centro', v_hoy + 10, 'programada', NULL, NULL);
    v_pasada        := pg_temp.jornada('pasada', v_hoy - 3, 'programada', v_centro, NULL);
    v_finalizada    := pg_temp.jornada('finalizada', v_hoy + 10, 'finalizada', v_centro, NULL);
    v_eliminada     := pg_temp.jornada('eliminada', v_hoy + 10, 'programada', v_centro, NULL);
    v_inscrita      := pg_temp.jornada('inscrita ya iniciada', v_hoy + 10, 'programada', v_centro, NULL);
    v_inscrita_otro := pg_temp.jornada('inscrita otro centro', v_hoy + 10, 'programada', v_otro_centro, NULL);

    v_res := v_res
        || pg_temp.chk('preparación: Carlos en jornada a iniciar', 'OK', pg_temp.ejecutar('auth', v_admin, pg_temp.inscribir(v_inscrita, v_emp2_ficha)))
        || pg_temp.chk('preparación: Carlos en jornada de otro centro', 'OK', pg_temp.ejecutar('auth', v_admin, pg_temp.inscribir(v_inscrita_otro, v_emp2_ficha)))
        || pg_temp.chk('preparación: Laura en disponible', 'OK', pg_temp.ejecutar('auth', v_admin, pg_temp.inscribir(v_disp, v_laura_ficha)))
        || pg_temp.chk('preparación: eliminar jornada (servicio Administrador)', 'OK', pg_temp.ejecutar('servicio', v_admin,
               format('UPDATE public.orientaciones SET deleted_at = now() WHERE id = %L', v_eliminada)))
        || pg_temp.chk('preparación: jornada inscrita ya iniciada (servicio Administrador)', 'OK', pg_temp.ejecutar('servicio', v_admin,
               format('UPDATE public.orientaciones SET fecha = %L WHERE id = %L', v_hoy - 3, v_inscrita)));

    -- 1. Emprendedor activo (DEMO-Carlos) -------------------------------------------------------------
    v_res := v_res
        || pg_temp.chk('Carlos: disponible de su centro', '1', pg_temp.contar('auth', v_emp2_usuario, pg_temp.ve(v_disp)))
        || pg_temp.chk('Carlos: programada de otro centro', '0', pg_temp.contar('auth', v_emp2_usuario, pg_temp.ve(v_otro)))
        || pg_temp.chk('Carlos: programada sin centro', '0', pg_temp.contar('auth', v_emp2_usuario, pg_temp.ve(v_sin_centro)))
        || pg_temp.chk('Carlos: pasada de su centro', '0', pg_temp.contar('auth', v_emp2_usuario, pg_temp.ve(v_pasada)))
        || pg_temp.chk('Carlos: finalizada de su centro', '0', pg_temp.contar('auth', v_emp2_usuario, pg_temp.ve(v_finalizada)))
        || pg_temp.chk('Carlos: eliminada de su centro', '0', pg_temp.contar('auth', v_emp2_usuario, pg_temp.ve(v_eliminada)))
        || pg_temp.chk('Carlos: inscrita ya iniciada', '1', pg_temp.contar('auth', v_emp2_usuario, pg_temp.ve(v_inscrita)))
        || pg_temp.chk('Carlos: inscrita de otro centro', '1', pg_temp.contar('auth', v_emp2_usuario, pg_temp.ve(v_inscrita_otro)))
        || pg_temp.chk('Carlos: jornada original de Laura', '0', pg_temp.contar('auth', v_emp2_usuario, pg_temp.ve(v_jornada_laura)))
        || pg_temp.chk('Carlos: "Jornadas disponibles" (programadas desde hoy, desechables)', '2', pg_temp.contar('auth', v_emp2_usuario,
               format('SELECT count(*) FROM public.orientaciones WHERE estado = ''programada'' AND fecha >= %L '
                      'AND tema LIKE ''\_\_prueba\_visibilidad\_\_%%''', v_hoy)))
        || pg_temp.chk('Carlos: solo sus inscripciones (2)', '2', pg_temp.contar('auth', v_emp2_usuario,
               'SELECT count(*) FROM public.orientacion_inscripciones i JOIN public.orientaciones o ON o.id = i.id_orientacion_fk '
               'WHERE o.tema LIKE ''\_\_prueba\_visibilidad\_\_%'''))
        || pg_temp.chk('Carlos: inscripción de Laura en la disponible', '0', pg_temp.contar('auth', v_emp2_usuario,
               format('SELECT count(*) FROM public.orientacion_inscripciones WHERE id_emprendedor_fk = %L', v_laura_ficha)))
        || pg_temp.chk('Carlos: asistencias ajenas', '0', pg_temp.contar('auth', v_emp2_usuario,
               format('SELECT count(*) FROM public.asistencias WHERE id_emprendedor_fk <> %L', v_emp2_ficha)))
        || pg_temp.chk('Carlos: se inscribe a sí mismo en la disponible (RPC)', 'OK', pg_temp.probar('auth', v_emp2_usuario,
               format('SELECT public.sigre_inscribir_en_jornada(p_orientacion_id => %L)', v_disp)));

    -- 2. Emprendedor inactivo: pierde las disponibles, conserva las inscritas --------------------------
    BEGIN
        v_r := pg_temp.ejecutar('servicio', v_admin,
                   format('UPDATE public.emprendedores SET estado = ''inactivo'' WHERE id = %L', v_emp2_ficha));
        v_res := v_res || pg_temp.chk('preparación: Carlos inactivo (servicio Administrador)', 'OK', v_r)
            || pg_temp.chk('Carlos inactivo: disponible de su centro', '0', pg_temp.contar('auth', v_emp2_usuario, pg_temp.ve(v_disp)))
            || pg_temp.chk('Carlos inactivo: inscrita ya iniciada', '1', pg_temp.contar('auth', v_emp2_usuario, pg_temp.ve(v_inscrita)));
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = '__revertir__';
    EXCEPTION WHEN raise_exception THEN
        IF SQLERRM <> '__revertir__' THEN RAISE; END IF;
    END;
    PERFORM pg_temp.restaurar();

    -- 3. Otros emprendedores y roles ------------------------------------------------------------------
    v_res := v_res
        || pg_temp.chk('Laura: disponible de su centro', '1', pg_temp.contar('auth', v_laura, pg_temp.ve(v_disp)))
        || pg_temp.chk('Laura: su jornada original (asistencia)', '1', pg_temp.contar('auth', v_laura, pg_temp.ve(v_jornada_laura)))
        || pg_temp.chk('Laura: inscrita de Carlos ya iniciada', '0', pg_temp.contar('auth', v_laura, pg_temp.ve(v_inscrita)))
        || pg_temp.chk('Laura: inscrita de Carlos de otro centro', '0', pg_temp.contar('auth', v_laura, pg_temp.ve(v_inscrita_otro)))
        || pg_temp.chk('E513 (ficha sin centro): disponible', '0', pg_temp.contar('auth', v_e513, pg_temp.ve(v_disp)))
        || pg_temp.chk('Orientador: su jornada', '1', pg_temp.contar('auth', v_orientador, pg_temp.ve(v_disp)))
        || pg_temp.chk('Orientador: jornada ajena', '0', pg_temp.contar('auth', v_orientador, pg_temp.ve(v_otro)))
        || pg_temp.chk('Administrador: disponible y otro centro', '2', pg_temp.contar('auth', v_admin,
               format('SELECT count(*) FROM public.orientaciones WHERE id IN (%L, %L)', v_disp, v_otro)))
        || pg_temp.chk('anónimo: desechables', '0|42501', pg_temp.contar('anon', NULL,
               'SELECT count(*) FROM public.orientaciones WHERE tema LIKE ''\_\_prueba\_visibilidad\_\_%'''))
        || pg_temp.chk('sin perfil: desechables', '0', pg_temp.contar('auth', v_sin_perfil,
               'SELECT count(*) FROM public.orientaciones WHERE tema LIKE ''\_\_prueba\_visibilidad\_\_%'''));

    -- 4. Inscripción en otro centro: depende de si orientaciones_inscripcion_mismo_centro.sql está aplicada ---
    IF EXISTS (SELECT 1 FROM pg_proc WHERE oid = 'public.sigre_inscribir_en_jornada(uuid,uuid)'::regprocedure
                 AND prosrc LIKE '%Inscripción entre centros SENA no autorizada%') THEN
        v_res := v_res || pg_temp.chk('regla de centro: la RPC rechaza inscribirse en otro centro', '42501',
                     pg_temp.probar('auth', v_emp2_usuario, format('SELECT public.sigre_inscribir_en_jornada(p_orientacion_id => %L)', v_otro)));
    ELSE
        v_res := v_res || pg_temp.chk('regla actual: la RPC permite inscribirse en otro centro si se conoce el id', 'OK',
                     pg_temp.probar('auth', v_emp2_usuario, format('SELECT public.sigre_inscribir_en_jornada(p_orientacion_id => %L)', v_otro)));
    END IF;

    -- 5. Datos reales intactos y contexto ---------------------------------------------------------------
    SELECT md5(coalesce(string_agg(x, '|' ORDER BY x), '')) INTO v_txt FROM (
        SELECT 'o' || to_jsonb(o)::text AS x FROM public.orientaciones o WHERE o.tema NOT LIKE '\_\_prueba\_visibilidad\_\_%'
        UNION ALL SELECT 'i' || to_jsonb(i)::text FROM public.orientacion_inscripciones i
                  WHERE i.id_orientacion_fk NOT IN (SELECT id FROM public.orientaciones WHERE tema LIKE '\_\_prueba\_visibilidad\_\_%')
        UNION ALL SELECT 'a' || to_jsonb(a)::text FROM public.asistencias a
    ) t;
    v_res := v_res || pg_temp.chk('datos reales sin cambios', 'OK', jsonb_build_object('estado',
                 CASE WHEN v_txt = v_huella_real THEN 'OK' ELSE 'DISTINTA' END));
    v_res := v_res || pg_temp.chk('contexto restablecido (rol y claims)', 'OK', jsonb_build_object('estado',
                 CASE WHEN current_user = session_user
                       AND coalesce(current_setting('request.jwt.claims', true), '') = ''
                       AND coalesce(current_setting('request.jwt.claim.sub', true), '') = ''
                      THEN 'OK' ELSE current_user END));

    SELECT count(*) INTO v_fallos FROM jsonb_array_elements(v_res) e WHERE NOT (e ->> 'ok')::boolean;
    RAISE EXCEPTION 'RESULTADO (transaccion revertida): % fallos de % pruebas. FALLOS: % · TODAS: %',
        v_fallos, jsonb_array_length(v_res),
        coalesce((SELECT jsonb_agg(e) FROM jsonb_array_elements(v_res) e WHERE NOT (e ->> 'ok')::boolean), '[]'::jsonb)::text,
        v_res::text;
END;
$$;
