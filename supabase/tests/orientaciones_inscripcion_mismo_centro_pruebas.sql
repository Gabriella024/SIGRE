-- SIGRE · PRUEBAS DE INSCRIPCIÓN POR CENTRO (SIN EFECTOS PERSISTENTES)
-- Destino: STAGING (febelffifcqzvnttpued), DESPUÉS de aplicar
-- supabase/proposals/orientaciones_inscripcion_mismo_centro.sql. Prohibido en PRODUCTION.
-- Comprueba sigre_inscribir_en_jornada como PostgREST:
--   * Emprendedor (auto-inscripción) y Orientador (inscripción manual en su jornada): solo mismo centro; otro
--     centro o jornada sin centro → 42501.
--   * Administrador: puede inscribir entre centros (autorización expresa).
--   * Reglas previas intactas: duplicado 23505, cupo agotado 22023, jornada iniciada 22023, Orientador en
--     jornada ajena 42501, anónimo 42501.
-- Solo usa jornadas, un centro, inscripciones y auditorías desechables; cada inscripción se ejecuta en una
-- subtransacción revertida salvo las de preparación. No toca la jornada DEMO del Orientador ni datos de Laura.
-- Termina SIEMPRE con un ERROR "RESULTADO ..." que revierte toda la transacción, incluidas las funciones pg_temp.

DO $$
DECLARE
    -- PARÁMETROS ---------------------------------------------------------------------------------
    v_orientador    constant uuid := NULL; -- usuarios.id del Orientador DEMO
    v_emp2_usuario  constant uuid := NULL; -- usuarios.id de DEMO-Carlos
    v_emp2_ficha    constant uuid := NULL; -- emprendedores.id de DEMO-Carlos
    ------------------------------------------------------------------------------------------------
    v_admin         constant uuid := '0a2a7a08-7c33-49e1-bd94-d21313924231';
    v_laura         constant uuid := 'bbd440b7-717e-416c-a2e7-0a33ee1d1320';
    v_laura_ficha   constant uuid := '4f19797f-03fd-4e37-99f1-b85abbdafd30';
    v_hoy           constant date := (now() AT TIME ZONE 'America/Bogota')::date;
    v_centro        uuid;
    v_otro_centro   uuid;
    v_mismo         uuid;
    v_otro          uuid;
    v_sin_centro    uuid;
    v_orient_otro   uuid;
    v_ajena         uuid;
    v_cupo1         uuid;
    v_pasada        uuid;
    v_huella_real   text;
    v_txt           text;
    v_res           jsonb := '[]'::jsonb;
    v_fallos        int;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_laura) THEN
        RAISE EXCEPTION 'ABORTADO: este proyecto no es STAGING';
    END IF;
    IF v_orientador IS NULL OR v_emp2_usuario IS NULL OR v_emp2_ficha IS NULL THEN
        RAISE EXCEPTION 'ABORTADO: completar v_orientador, v_emp2_usuario y v_emp2_ficha';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE oid = 'public.sigre_inscribir_en_jornada(uuid,uuid)'::regprocedure
                     AND prosrc LIKE '%Inscripción entre centros SENA no autorizada%') THEN
        RAISE EXCEPTION 'ABORTADO: la migración de mismo centro no está aplicada';
    END IF;
    SELECT id_centro_sena_fk INTO v_centro FROM public.emprendedores
    WHERE id = v_emp2_ficha AND usuario_id = v_emp2_usuario AND estado = 'activo' AND deleted_at IS NULL;
    IF v_centro IS NULL THEN
        RAISE EXCEPTION 'ABORTADO: la ficha de DEMO-Carlos no está activa o no tiene centro';
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

    CREATE FUNCTION pg_temp.ctx(p_modo text, p_usuario uuid) RETURNS void LANGUAGE plpgsql AS $f$
    BEGIN
        IF p_modo = 'anon' THEN
            PERFORM set_config('role', 'anon', true);
            PERFORM set_config('request.jwt.claim.role', 'anon', true);
            PERFORM set_config('request.jwt.claims', '{"role":"anon"}', true);
            RETURN;
        END IF;
        PERFORM set_config('role', 'authenticated', true);
        PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
        PERFORM set_config('request.jwt.claim.sub', p_usuario::text, true);
        PERFORM set_config('request.jwt.claims',
            jsonb_build_object('sub', p_usuario, 'role', 'authenticated', 'aud', 'authenticated')::text, true);
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

    CREATE FUNCTION pg_temp.chk(p_prueba text, p_esperado text, p_r jsonb) RETURNS jsonb LANGUAGE sql AS $f$
        SELECT jsonb_build_array(jsonb_build_object(
            'prueba', p_prueba, 'esperado', p_esperado, 'obtenido', p_r ->> 'estado', 'mensaje', p_r ->> 'mensaje',
            'ok', p_r ->> 'estado' = ANY (string_to_array(p_esperado, '|'))))
    $f$;

    CREATE FUNCTION pg_temp.jornada(p_tema text, p_fecha date, p_centro uuid, p_orientador uuid, p_cupo int)
    RETURNS uuid LANGUAGE sql AS $f$
        INSERT INTO public.orientaciones (tema, fecha, hora_inicio, hora_fin, estado, cupo, id_centro_sena_fk, id_orientador_fk)
        VALUES ('__prueba_centro__ ' || p_tema, p_fecha, '08:00', '09:00', 'programada', p_cupo, p_centro, p_orientador)
        RETURNING id
    $f$;

    CREATE FUNCTION pg_temp.auto(p_jornada uuid) RETURNS text LANGUAGE sql AS $f$
        SELECT format('SELECT public.sigre_inscribir_en_jornada(p_orientacion_id => %L)', p_jornada)
    $f$;

    CREATE FUNCTION pg_temp.manual(p_jornada uuid, p_ficha uuid) RETURNS text LANGUAGE sql AS $f$
        SELECT format('SELECT public.sigre_inscribir_en_jornada(p_orientacion_id => %L, p_emprendedor_id => %L)', p_jornada, p_ficha)
    $f$;

    -- Preparación ------------------------------------------------------------------------------------
    INSERT INTO public.sena_centros (id_regional_fk, codigo, nombre, estado, created_at)
    SELECT id_regional_fk, '__PRUEBA-CENTRO__', 'Centro de prueba (desechable)', 'activo', now()
    FROM public.sena_centros WHERE id = v_centro
    RETURNING id INTO v_otro_centro;

    v_mismo       := pg_temp.jornada('mismo centro', v_hoy + 10, v_centro, v_orientador, 5);
    v_otro        := pg_temp.jornada('otro centro', v_hoy + 10, v_otro_centro, NULL, 5);
    v_sin_centro  := pg_temp.jornada('sin centro', v_hoy + 10, NULL, NULL, 5);
    v_orient_otro := pg_temp.jornada('orientador en otro centro', v_hoy + 10, v_otro_centro, v_orientador, 5);
    v_ajena       := pg_temp.jornada('ajena mismo centro', v_hoy + 10, v_centro, NULL, 5);
    v_cupo1       := pg_temp.jornada('cupo 1', v_hoy + 10, v_centro, NULL, 1);
    v_pasada      := pg_temp.jornada('pasada', v_hoy - 2, v_centro, NULL, 5);

    -- 1. Emprendedor (auto-inscripción) --------------------------------------------------------------
    v_res := v_res
        || pg_temp.chk('Carlos: mismo centro', 'OK', pg_temp.probar('auth', v_emp2_usuario, pg_temp.auto(v_mismo)))
        || pg_temp.chk('Carlos: otro centro', '42501', pg_temp.probar('auth', v_emp2_usuario, pg_temp.auto(v_otro)))
        || pg_temp.chk('Carlos: jornada sin centro', '42501', pg_temp.probar('auth', v_emp2_usuario, pg_temp.auto(v_sin_centro)))
        || pg_temp.chk('Laura: mismo centro', 'OK', pg_temp.probar('auth', v_laura, pg_temp.auto(v_mismo)));

    -- 2. Orientador (inscripción manual en su jornada) -------------------------------------------------
    v_res := v_res
        || pg_temp.chk('Orientador: su jornada, emprendedor del mismo centro', 'OK', pg_temp.probar('auth', v_orientador, pg_temp.manual(v_mismo, v_emp2_ficha)))
        || pg_temp.chk('Orientador: su jornada en otro centro', '42501', pg_temp.probar('auth', v_orientador, pg_temp.manual(v_orient_otro, v_emp2_ficha)))
        || pg_temp.chk('Orientador: jornada ajena (regla previa)', '42501', pg_temp.probar('auth', v_orientador, pg_temp.manual(v_ajena, v_emp2_ficha)));

    -- 3. Administrador (autorización expresa) ---------------------------------------------------------
    v_res := v_res
        || pg_temp.chk('Administrador: mismo centro', 'OK', pg_temp.probar('auth', v_admin, pg_temp.manual(v_mismo, v_emp2_ficha)))
        || pg_temp.chk('Administrador: otro centro', 'OK', pg_temp.probar('auth', v_admin, pg_temp.manual(v_otro, v_emp2_ficha)))
        || pg_temp.chk('Administrador: jornada sin centro', 'OK', pg_temp.probar('auth', v_admin, pg_temp.manual(v_sin_centro, v_emp2_ficha)));

    -- 4. Reglas previas intactas ----------------------------------------------------------------------
    v_res := v_res
        || pg_temp.chk('preparación: Carlos en mismo centro (Administrador)', 'OK', pg_temp.ejecutar('auth', v_admin, pg_temp.manual(v_mismo, v_emp2_ficha)))
        || pg_temp.chk('duplicado', '23505', pg_temp.probar('auth', v_emp2_usuario, pg_temp.auto(v_mismo)))
        || pg_temp.chk('preparación: Laura ocupa el cupo 1', 'OK', pg_temp.ejecutar('auth', v_admin, pg_temp.manual(v_cupo1, v_laura_ficha)))
        || pg_temp.chk('cupo agotado', '22023', pg_temp.probar('auth', v_emp2_usuario, pg_temp.auto(v_cupo1)))
        || pg_temp.chk('jornada ya iniciada', '22023', pg_temp.probar('auth', v_emp2_usuario, pg_temp.auto(v_pasada)))
        || pg_temp.chk('anónimo', '42501', pg_temp.probar('anon', NULL, pg_temp.auto(v_mismo)));

    -- 5. Datos reales intactos y contexto ---------------------------------------------------------------
    SELECT md5(coalesce(string_agg(x, '|' ORDER BY x), '')) INTO v_txt FROM (
        SELECT 'o' || to_jsonb(o)::text AS x FROM public.orientaciones o WHERE o.tema NOT LIKE '\_\_prueba\_centro\_\_%'
        UNION ALL SELECT 'i' || to_jsonb(i)::text FROM public.orientacion_inscripciones i
                  WHERE i.id_orientacion_fk NOT IN (SELECT id FROM public.orientaciones WHERE tema LIKE '\_\_prueba\_centro\_\_%')
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
