-- SIGRE · PRUEBAS DE AUTORIZACIÓN · orientacion_inscripciones (SIN EFECTOS PERSISTENTES)
-- Destino: STAGING (febelffifcqzvnttpued), DESPUÉS de aplicar
-- supabase/proposals/orientaciones_inscripciones_select_rls.sql. Prohibido en PRODUCTION.
-- Requisitos: Orientador DEMO y segundo Emprendedor DEMO creados (supabase/proposals/orientaciones_demo_usuarios.sql
-- y la ficha del segundo emprendedor desde la UI). Rellenar los UUID de la sección PARÁMETROS.
-- Funcionamiento:
--   * Simula cada usuario como lo hace PostgREST en Supabase: SET ROLE authenticated/anon y los claims
--     request.jwt.claims (sub, role, aud) y request.jwt.claim.sub / request.jwt.claim.role, que son los que
--     leen auth.uid(), auth.role() y auth.jwt(). Las auxiliares restablecen rol y claims también ante errores.
--   * Crea jornadas desechables (asignada al Orientador DEMO, ajena, cupo 1 y control de cupo 2) e inscribe
--     mediante la RPC sigre_inscribir_en_jornada como Administrador.
--   * Exige SQLSTATE exactos: duplicado 23505, cupo lleno v_sqlstate_cupo (22023, contrato del frontend en
--     enrollmentService.ts), RPC de inscritos en jornada ajena 42501. Cada fallo conserva SQLSTATE y mensaje.
--   * Acceso no autorizado por RPC (42501): Orientador en jornada ajena (inscribir/asistencia), segundo
--     emprendedor (inscritos, inscribir a Laura, asistencia), anon y usuario sin perfil. Cada intento
--     se ejecuta en una subtransacción revertida. Las RPC se llaman con argumentos nombrados, igual que
--     el frontend (p_orientacion_id, p_emprendedor_id, p_estado, p_observacion).
--   * No modifica usuarios ni roles existentes (incluidos los DEMO). Solo crea y altera filas desechables.
--   * Termina SIEMPRE con un ERROR "RESULTADO ..." que revierte toda la transacción, incluidas las
--     funciones auxiliares pg_temp.

DO $$
DECLARE
    -- PARÁMETROS ---------------------------------------------------------------------------------
    v_orientador    constant uuid := NULL; -- usuarios.id de demo.orientador@example.com
    v_emp2_usuario  constant uuid := NULL; -- usuarios.id de demo.emprendedor2@example.com
    v_emp2_ficha    constant uuid := NULL; -- emprendedores.id de la ficha de DEMO-Carlos
    v_evaluador     constant uuid := NULL; -- opcional: usuarios.id de un evaluador DEMO
    v_sqlstate_cupo constant text := '22023'; -- SQLSTATE exigido cuando el cupo está lleno
    ------------------------------------------------------------------------------------------------
    v_admin       constant uuid := '0a2a7a08-7c33-49e1-bd94-d21313924231';
    v_laura       constant uuid := 'bbd440b7-717e-416c-a2e7-0a33ee1d1320';
    v_laura_ficha constant uuid := '4f19797f-03fd-4e37-99f1-b85abbdafd30';
    v_e513        constant uuid := '6bc62741-335e-4240-a6b0-416716865308';
    v_sin_perfil  constant uuid := gen_random_uuid();
    v_futuro      constant date := (now() AT TIME ZONE 'America/Bogota')::date + 30;
    v_asignada    uuid;
    v_ajena       uuid;
    v_cupo1       uuid;
    v_cupo2       uuid;
    v_filtro      text;
    v_laura_previas bigint;
    v_n           bigint;
    v_res         jsonb := '[]'::jsonb;
    v_fallos      int;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_laura) THEN
        RAISE EXCEPTION 'ABORTADO: este proyecto no es STAGING';
    END IF;
    IF v_orientador IS NULL OR v_emp2_usuario IS NULL OR v_emp2_ficha IS NULL THEN
        RAISE EXCEPTION 'ABORTADO: completar los UUID del Orientador DEMO y del segundo Emprendedor DEMO';
    END IF;
    IF v_orientador IN (v_admin, v_laura, v_e513) OR v_emp2_usuario IN (v_admin, v_laura, v_e513, v_orientador) THEN
        RAISE EXCEPTION 'ABORTADO: los usuarios DEMO deben ser cuentas nuevas e independientes';
    END IF;
    IF (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'orientacion_inscripciones'
          AND policyname LIKE 'sigre_inscripciones_select_%') <> 3 THEN
        RAISE EXCEPTION 'ABORTADO: la migración RLS no está aplicada';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.usuario_roles ur JOIN public.roles r ON r.id = ur.id_rol_fk
                   WHERE ur.id_usuario_fk = v_orientador AND lower(r.nombre_rol) = 'orientador'
                     AND ur.estado = 'activo' AND ur.deleted_at IS NULL)
       OR EXISTS (SELECT 1 FROM public.usuario_roles ur JOIN public.roles r ON r.id = ur.id_rol_fk
                  WHERE ur.id_usuario_fk IN (v_orientador, v_emp2_usuario) AND lower(r.nombre_rol) = 'administrador') THEN
        RAISE EXCEPTION 'ABORTADO: el Orientador DEMO no tiene rol orientador activo o algún DEMO es administrador';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.emprendedores
                   WHERE id = v_emp2_ficha AND usuario_id = v_emp2_usuario AND deleted_at IS NULL) THEN
        RAISE EXCEPTION 'ABORTADO: la ficha del segundo emprendedor no corresponde a su usuario';
    END IF;

    -- Auxiliares temporales (desaparecen con el rollback final) ------------------------------------
    CREATE FUNCTION pg_temp.restaurar() RETURNS void LANGUAGE plpgsql AS $f$
    BEGIN
        PERFORM set_config('request.jwt.claims', '', true);
        PERFORM set_config('request.jwt.claim.sub', '', true);
        PERFORM set_config('request.jwt.claim.role', '', true);
        EXECUTE 'RESET ROLE';
    END;
    $f$;

    CREATE FUNCTION pg_temp.como(p_usuario text) RETURNS void LANGUAGE plpgsql AS $f$
    DECLARE
        v_rol text := CASE WHEN p_usuario = 'anon' THEN 'anon' ELSE 'authenticated' END;
    BEGIN
        PERFORM set_config('role', v_rol, true);
        PERFORM set_config('request.jwt.claim.role', v_rol, true);
        IF v_rol = 'anon' THEN
            PERFORM set_config('request.jwt.claims', '{"role":"anon"}', true);
            PERFORM set_config('request.jwt.claim.sub', '', true);
        ELSE
            PERFORM set_config('request.jwt.claims',
                jsonb_build_object('sub', p_usuario, 'role', v_rol, 'aud', 'authenticated')::text, true);
            PERFORM set_config('request.jwt.claim.sub', p_usuario, true);
        END IF;
    END;
    $f$;

    -- Ejecuta p_sql como p_usuario y conserva sus efectos. Devuelve {estado: OK|SQLSTATE, mensaje}.
    CREATE FUNCTION pg_temp.ejecutar_como(p_usuario text, p_sql text) RETURNS jsonb LANGUAGE plpgsql AS $f$
    DECLARE
        v jsonb;
    BEGIN
        BEGIN
            PERFORM pg_temp.como(p_usuario);
            EXECUTE p_sql;
            v := jsonb_build_object('estado', 'OK');
        EXCEPTION WHEN OTHERS THEN
            v := jsonb_build_object('estado', SQLSTATE, 'mensaje', SQLERRM);
        END;
        PERFORM pg_temp.restaurar();
        RETURN v;
    END;
    $f$;

    -- Cuenta como p_usuario. Devuelve {estado: OK, valor} o {estado: SQLSTATE, mensaje}.
    CREATE FUNCTION pg_temp.contar_como(p_usuario text, p_sql text) RETURNS jsonb LANGUAGE plpgsql AS $f$
    DECLARE
        v_n bigint;
        v   jsonb;
    BEGIN
        BEGIN
            PERFORM pg_temp.como(p_usuario);
            EXECUTE p_sql INTO v_n;
            v := jsonb_build_object('estado', 'OK', 'valor', v_n);
        EXCEPTION WHEN OTHERS THEN
            v := jsonb_build_object('estado', SQLSTATE, 'mensaje', SQLERRM);
        END;
        PERFORM pg_temp.restaurar();
        RETURN v;
    END;
    $f$;

    -- Caso aislado: ejecuta como p_usuario y SIEMPRE revierte. Devuelve {estado: OK|SQLSTATE, mensaje}.
    CREATE FUNCTION pg_temp.probar(p_usuario text, p_sql text) RETURNS jsonb LANGUAGE plpgsql AS $f$
    DECLARE
        v jsonb;
    BEGIN
        BEGIN
            PERFORM pg_temp.como(p_usuario);
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

    -- Resultado esperado: un SQLSTATE/OK (admite alternativas "a|b") o, con p_valor, un conteo exacto.
    CREATE FUNCTION pg_temp.chk(p_prueba text, p_esperado text, p_r jsonb, p_valor boolean DEFAULT false)
    RETURNS jsonb LANGUAGE sql AS $f$
        SELECT jsonb_build_array(jsonb_build_object(
            'prueba', p_prueba, 'esperado', p_esperado,
            'obtenido', CASE WHEN p_valor AND p_r ->> 'estado' = 'OK' THEN p_r ->> 'valor' ELSE p_r ->> 'estado' END,
            'mensaje', p_r ->> 'mensaje',
            'ok', CASE WHEN p_valor THEN p_r ->> 'estado' = 'OK' AND p_r ->> 'valor' = p_esperado
                       ELSE p_r ->> 'estado' = ANY (string_to_array(p_esperado, '|')) END))
    $f$;

    CREATE FUNCTION pg_temp.inscribir(p_jornada uuid, p_ficha uuid) RETURNS text LANGUAGE sql AS $f$
        SELECT format('SELECT public.sigre_inscribir_en_jornada(p_orientacion_id => %L, p_emprendedor_id => %L)',
                      p_jornada, p_ficha)
    $f$;

    CREATE FUNCTION pg_temp.asistencia(p_jornada uuid, p_ficha uuid) RETURNS text LANGUAGE sql AS $f$
        SELECT format('SELECT public.sigre_registrar_asistencia(p_orientacion_id => %L, p_emprendedor_id => %L, '
                      'p_estado => ''no_asistio'', p_observacion => NULL)', p_jornada, p_ficha)
    $f$;

    -- Datos desechables ------------------------------------------------------------------------------
    INSERT INTO public.orientaciones (tema, fecha, hora_inicio, hora_fin, estado, cupo, id_orientador_fk)
    VALUES ('__prueba_rls__ asignada', v_futuro, '08:00', '09:00', 'programada', 5, v_orientador)
    RETURNING id INTO v_asignada;
    INSERT INTO public.orientaciones (tema, fecha, hora_inicio, hora_fin, estado, cupo)
    VALUES ('__prueba_rls__ ajena', v_futuro, '10:00', '11:00', 'programada', 5)
    RETURNING id INTO v_ajena;
    INSERT INTO public.orientaciones (tema, fecha, hora_inicio, hora_fin, estado, cupo)
    VALUES ('__prueba_rls__ cupo 1', v_futuro, '12:00', '13:00', 'programada', 1)
    RETURNING id INTO v_cupo1;
    INSERT INTO public.orientaciones (tema, fecha, hora_inicio, hora_fin, estado, cupo)
    VALUES ('__prueba_rls__ control cupo 2', v_futuro, '14:00', '15:00', 'programada', 2)
    RETURNING id INTO v_cupo2;

    v_res := v_res || pg_temp.chk('setup: Laura en asignada', 'OK', pg_temp.ejecutar_como(v_admin::text, pg_temp.inscribir(v_asignada, v_laura_ficha)));
    v_res := v_res || pg_temp.chk('setup: emprendedor2 en asignada', 'OK', pg_temp.ejecutar_como(v_admin::text, pg_temp.inscribir(v_asignada, v_emp2_ficha)));
    v_res := v_res || pg_temp.chk('setup: Laura en ajena', 'OK', pg_temp.ejecutar_como(v_admin::text, pg_temp.inscribir(v_ajena, v_laura_ficha)));
    v_res := v_res || pg_temp.chk('setup: emprendedor2 en ajena', 'OK', pg_temp.ejecutar_como(v_admin::text, pg_temp.inscribir(v_ajena, v_emp2_ficha)));

    v_filtro := format('FROM public.orientacion_inscripciones WHERE id_orientacion_fk IN (%L, %L)', v_asignada, v_ajena);
    SELECT count(*) INTO v_laura_previas
    FROM public.orientacion_inscripciones
    WHERE id_emprendedor_fk = v_laura_ficha AND deleted_at IS NULL AND id_orientacion_fk NOT IN (v_asignada, v_ajena);

    -- Dependencias RLS de las políticas: cada usuario ve sus propias filas -------------------------
    v_res := v_res || pg_temp.chk('orientador: auth.uid() simulado', '1', pg_temp.contar_como(v_orientador::text,
                 format('SELECT count(*) FROM (SELECT 1 WHERE auth.uid() = %L) x', v_orientador)), true);
    -- usuario_roles y roles solo son legibles por el Administrador; el rol se valida con tiene_rol().
    v_res := v_res || pg_temp.chk('orientador: tiene_rol(orientador)', '1', pg_temp.contar_como(v_orientador::text,
                 'SELECT count(*) FROM (SELECT 1 WHERE public.tiene_rol(''orientador'')) x'), true);
    v_res := v_res || pg_temp.chk('orientador: usuario_roles no legible directamente', '0', pg_temp.contar_como(v_orientador::text,
                 'SELECT count(*) FROM public.usuario_roles'), true);
    v_res := v_res || pg_temp.chk('orientador: lee su usuario', '1', pg_temp.contar_como(v_orientador::text,
                 'SELECT count(*) FROM public.usuarios WHERE id = auth.uid()'), true);
    v_res := v_res || pg_temp.chk('orientador: lee su jornada asignada', '1', pg_temp.contar_como(v_orientador::text,
                 format('SELECT count(*) FROM public.orientaciones WHERE id = %L AND id_orientador_fk = auth.uid()', v_asignada)), true);
    v_res := v_res || pg_temp.chk('laura: lee su ficha y su usuario', '1', pg_temp.contar_como(v_laura::text,
                 'SELECT count(*) FROM public.emprendedores e JOIN public.usuarios u ON u.id = e.usuario_id
                  WHERE e.usuario_id = auth.uid()'), true);
    v_res := v_res || pg_temp.chk('admin: lee su rol administrador', '1', pg_temp.contar_como(v_admin::text,
                 'SELECT count(*) FROM public.usuario_roles ur JOIN public.roles r ON r.id = ur.id_rol_fk
                  WHERE ur.id_usuario_fk = auth.uid() AND lower(r.nombre_rol) = ''administrador'''), true);

    -- Lectura directa por rol (jornadas desechables) ------------------------------------------------
    v_res := v_res || pg_temp.chk('admin: todas', '4', pg_temp.contar_como(v_admin::text, 'SELECT count(*) ' || v_filtro), true);
    v_res := v_res || pg_temp.chk('orientador: jornada asignada', '2', pg_temp.contar_como(v_orientador::text,
                 format('SELECT count(*) FROM public.orientacion_inscripciones WHERE id_orientacion_fk = %L', v_asignada)), true);
    v_res := v_res || pg_temp.chk('orientador: jornada ajena', '0', pg_temp.contar_como(v_orientador::text,
                 format('SELECT count(*) FROM public.orientacion_inscripciones WHERE id_orientacion_fk = %L', v_ajena)), true);
    v_res := v_res || pg_temp.chk('laura: propias en desechables', '2', pg_temp.contar_como(v_laura::text,
                 'SELECT count(*) ' || v_filtro || format(' AND id_emprendedor_fk = %L', v_laura_ficha)), true);
    v_res := v_res || pg_temp.chk('laura: ajenas en desechables', '0', pg_temp.contar_como(v_laura::text,
                 'SELECT count(*) ' || v_filtro || format(' AND id_emprendedor_fk <> %L', v_laura_ficha)), true);
    v_res := v_res || pg_temp.chk('laura: total visible solo propio', (v_laura_previas + 2)::text, pg_temp.contar_como(v_laura::text,
                 'SELECT count(*) FROM public.orientacion_inscripciones'), true);
    v_res := v_res || pg_temp.chk('emprendedor2: propias', '2', pg_temp.contar_como(v_emp2_usuario::text,
                 'SELECT count(*) ' || v_filtro || format(' AND id_emprendedor_fk = %L', v_emp2_ficha)), true);
    v_res := v_res || pg_temp.chk('emprendedor2: de Laura', '0', pg_temp.contar_como(v_emp2_usuario::text,
                 format('SELECT count(*) FROM public.orientacion_inscripciones WHERE id_emprendedor_fk = %L', v_laura_ficha)), true);
    v_res := v_res || pg_temp.chk('E513 (solo lectura): desechables', '0', pg_temp.contar_como(v_e513::text, 'SELECT count(*) ' || v_filtro), true);
    v_res := v_res || pg_temp.chk('sin perfil: total', '0', pg_temp.contar_como(v_sin_perfil::text,
                 'SELECT count(*) FROM public.orientacion_inscripciones'), true);
    v_res := v_res || pg_temp.chk('anon: total', '0', pg_temp.contar_como('anon', 'SELECT count(*) FROM public.orientacion_inscripciones'), true);
    IF v_evaluador IS NOT NULL THEN
        v_res := v_res || pg_temp.chk('evaluador: total', '0', pg_temp.contar_como(v_evaluador::text,
                     'SELECT count(*) FROM public.orientacion_inscripciones'), true);
    END IF;

    -- RPC de inscritos: alcance del Orientador ------------------------------------------------------
    v_res := v_res || pg_temp.chk('orientador: RPC inscritos asignada', '2', pg_temp.contar_como(v_orientador::text,
                 format('SELECT count(*) FROM public.sigre_listar_inscritos_asistencia(p_orientacion_id => %L)', v_asignada)), true);
    v_res := v_res || pg_temp.chk('orientador: RPC inscritos ajena', '42501', pg_temp.contar_como(v_orientador::text,
                 format('SELECT count(*) FROM public.sigre_listar_inscritos_asistencia(p_orientacion_id => %L)', v_ajena)));

    -- Acceso no autorizado por RPC (cada intento se revierte si llegara a escribir) -----------------
    v_res := v_res || pg_temp.chk('orientador: inscribir en jornada ajena', '42501',
                 pg_temp.probar(v_orientador::text, pg_temp.inscribir(v_ajena, v_emp2_ficha)));
    v_res := v_res || pg_temp.chk('orientador: asistencia en jornada ajena', '42501',
                 pg_temp.probar(v_orientador::text, pg_temp.asistencia(v_ajena, v_laura_ficha)));
    v_res := v_res || pg_temp.chk('emprendedor2: RPC inscritos', '42501', pg_temp.contar_como(v_emp2_usuario::text,
                 format('SELECT count(*) FROM public.sigre_listar_inscritos_asistencia(p_orientacion_id => %L)', v_asignada)));
    v_res := v_res || pg_temp.chk('emprendedor2: inscribir a Laura', '42501',
                 pg_temp.probar(v_emp2_usuario::text, pg_temp.inscribir(v_cupo2, v_laura_ficha)));
    v_res := v_res || pg_temp.chk('emprendedor2: registrar asistencia', '42501',
                 pg_temp.probar(v_emp2_usuario::text, pg_temp.asistencia(v_asignada, v_laura_ficha)));
    v_res := v_res || pg_temp.chk('anon: RPC inscritos', '42501', pg_temp.contar_como('anon',
                 format('SELECT count(*) FROM public.sigre_listar_inscritos_asistencia(p_orientacion_id => %L)', v_asignada)));
    v_res := v_res || pg_temp.chk('anon: inscribir', '42501',
                 pg_temp.probar('anon', pg_temp.inscribir(v_cupo2, v_emp2_ficha)));
    v_res := v_res || pg_temp.chk('sin perfil: inscribir', '42501',
                 pg_temp.probar(v_sin_perfil::text, pg_temp.inscribir(v_cupo2, v_emp2_ficha)));

    -- Duplicado y cupo máximo -------------------------------------------------------------------------
    v_res := v_res || pg_temp.chk('duplicado: Laura otra vez en asignada', '23505',
                 pg_temp.ejecutar_como(v_admin::text, pg_temp.inscribir(v_asignada, v_laura_ficha)));
    SELECT count(*) INTO v_n FROM public.orientacion_inscripciones
    WHERE id_orientacion_fk = v_asignada AND id_emprendedor_fk = v_laura_ficha AND deleted_at IS NULL;
    v_res := v_res || pg_temp.chk('duplicado: Laura una sola vez', '1', jsonb_build_object('estado', 'OK', 'valor', v_n), true);

    v_res := v_res || pg_temp.chk('cupo 1: Laura (primera plaza)', 'OK', pg_temp.ejecutar_como(v_admin::text, pg_temp.inscribir(v_cupo1, v_laura_ficha)));
    v_res := v_res || pg_temp.chk('control cupo 2: Laura', 'OK', pg_temp.ejecutar_como(v_admin::text, pg_temp.inscribir(v_cupo2, v_laura_ficha)));
    v_res := v_res || pg_temp.chk('control cupo 2: emprendedor2 admitido', 'OK', pg_temp.ejecutar_como(v_admin::text, pg_temp.inscribir(v_cupo2, v_emp2_ficha)));
    v_res := v_res || pg_temp.chk('cupo 1 lleno: emprendedor2 rechazado con SQLSTATE exacto', v_sqlstate_cupo,
                 pg_temp.ejecutar_como(v_admin::text, pg_temp.inscribir(v_cupo1, v_emp2_ficha)));
    SELECT count(*) INTO v_n FROM public.orientacion_inscripciones WHERE id_orientacion_fk = v_cupo1 AND deleted_at IS NULL;
    v_res := v_res || pg_temp.chk('cupo 1 lleno: exactamente 1 inscripción activa', '1', jsonb_build_object('estado', 'OK', 'valor', v_n), true);

    -- Borrados lógicos de filas desechables (revertidos) -------------------------------------------
    BEGIN
        -- sigre_validar_columnas_edicion solo admite escritura directa del Administrador (auth.uid()).
        PERFORM set_config('request.jwt.claims',
            jsonb_build_object('sub', v_admin, 'role', 'authenticated', 'aud', 'authenticated')::text, true);
        PERFORM set_config('request.jwt.claim.sub', v_admin::text, true);
        UPDATE public.orientaciones SET deleted_at = now() WHERE id = v_asignada;
        PERFORM pg_temp.restaurar();
        v_res := v_res || pg_temp.chk('orientador: jornada asignada eliminada', '0', pg_temp.contar_como(v_orientador::text,
                     format('SELECT count(*) FROM public.orientacion_inscripciones WHERE id_orientacion_fk = %L', v_asignada)), true);
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = '__revertir__';
    EXCEPTION WHEN raise_exception THEN
        IF SQLERRM <> '__revertir__' THEN RAISE; END IF;
    END;

    BEGIN
        UPDATE public.orientacion_inscripciones SET deleted_at = now()
        WHERE id_orientacion_fk = v_ajena AND id_emprendedor_fk = v_laura_ficha;
        v_res := v_res || pg_temp.chk('admin: inscripción eliminada oculta', '0', pg_temp.contar_como(v_admin::text,
                     format('SELECT count(*) FROM public.orientacion_inscripciones WHERE id_orientacion_fk = %L AND id_emprendedor_fk = %L',
                            v_ajena, v_laura_ficha)), true);
        v_res := v_res || pg_temp.chk('laura: inscripción eliminada oculta', '1', pg_temp.contar_como(v_laura::text,
                     'SELECT count(*) ' || v_filtro), true);
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = '__revertir__';
    EXCEPTION WHEN raise_exception THEN
        IF SQLERRM <> '__revertir__' THEN RAISE; END IF;
    END;

    -- Contexto de seguridad restablecido tras todas las simulaciones --------------------------------
    v_res := v_res || pg_temp.chk('contexto restablecido (rol y claims)', 'OK', jsonb_build_object('estado',
                 CASE WHEN current_user = session_user
                       AND coalesce(current_setting('request.jwt.claims', true), '') = ''
                       AND coalesce(current_setting('request.jwt.claim.sub', true), '') = ''
                      THEN 'OK' ELSE current_user || ' / ' || coalesce(current_setting('request.jwt.claims', true), '') END));

    SELECT count(*) INTO v_fallos FROM jsonb_array_elements(v_res) e WHERE NOT (e ->> 'ok')::boolean;
    RAISE EXCEPTION 'RESULTADO (transaccion revertida): % fallos de % pruebas. FALLOS: % · TODAS: %',
        v_fallos, jsonb_array_length(v_res),
        coalesce((SELECT jsonb_agg(e) FROM jsonb_array_elements(v_res) e WHERE NOT (e ->> 'ok')::boolean), '[]'::jsonb)::text,
        v_res::text;
END;
$$;
