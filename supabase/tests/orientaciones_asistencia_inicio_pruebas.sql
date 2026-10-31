-- SIGRE · PRUEBAS DE ASISTENCIA (SIN EFECTOS PERSISTENTES)
-- Destino: STAGING (febelffifcqzvnttpued). Prohibido en PRODUCTION.
-- Prueba el sistema tal como está (no cambia triggers, RPC ni reglas):
--   * sigre_asistencias_validar_inicio (INSERT/UPDATE): no se marca asistencia antes del inicio en America/Bogota.
--   * sigre_validar_edicion_asistencia_4c (UPDATE): exige auth.uid() = registrado_por_usuario_id, prohíbe cambiar
--     deleted_at, exige inscripción 'inscrito', Administrador u Orientador asignado con permiso, estado
--     asistio/no_asistio coherente con asistio y confirmado_at.
--   * sigre_proteger_relaciones_asistencia (UPDATE): solo el Administrador cambia jornada/emprendedor.
--   * RLS de asistencias: solo SELECT para authenticated (INSERT 42501; UPDATE afecta 0 filas).
--   * RPC sigre_registrar_asistencia: identidad, estado válido, jornada habilitada, autorización e inscripción.
-- Modos de ejecución simulados:
--   postgres  = escritura de servicio sin identidad (auth.uid() NULL)
--   servicio  = escritura de servicio con identidad (claims JWT, sin RLS), como un backend de confianza
--   auth      = petición PostgREST (SET ROLE authenticated + claims)
--   anon      = petición anónima
-- Solo usa jornadas, inscripciones, asistencias y auditorías desechables creadas aquí. No toca usuarios, roles,
-- fichas ni la jornada/inscripción/asistencia DEMO de Laura (se comprueba con huella).
-- Termina SIEMPRE con un ERROR "RESULTADO ..." que revierte toda la transacción, incluidas las funciones pg_temp.

DO $$
DECLARE
    -- PARÁMETROS ---------------------------------------------------------------------------------
    v_orientador    constant uuid := NULL; -- usuarios.id del Orientador DEMO
    v_emp2_usuario  constant uuid := NULL; -- usuarios.id de DEMO-Carlos
    v_emp2_ficha    constant uuid := NULL; -- emprendedores.id de DEMO-Carlos
    ------------------------------------------------------------------------------------------------
    v_admin       constant uuid := '0a2a7a08-7c33-49e1-bd94-d21313924231';
    v_laura       constant uuid := 'bbd440b7-717e-416c-a2e7-0a33ee1d1320';
    v_laura_ficha constant uuid := '4f19797f-03fd-4e37-99f1-b85abbdafd30';
    v_ahora       constant timestamp := now() AT TIME ZONE 'America/Bogota';
    v_hoy         constant date := (now() AT TIME ZONE 'America/Bogota')::date;
    v_futura      uuid;
    v_rpc         uuid;
    v_ajena       uuid;
    v_frontera_a  uuid;
    v_frontera_b  uuid;
    v_fila        uuid;
    v_r           jsonb;
    v_txt         text;
    v_huella_real text;
    v_res         jsonb := '[]'::jsonb;
    v_fallos      int;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_laura) THEN
        RAISE EXCEPTION 'ABORTADO: este proyecto no es STAGING';
    END IF;
    IF v_orientador IS NULL OR v_emp2_usuario IS NULL OR v_emp2_ficha IS NULL THEN
        RAISE EXCEPTION 'ABORTADO: completar v_orientador, v_emp2_usuario y v_emp2_ficha';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.usuario_roles ur JOIN public.roles r ON r.id = ur.id_rol_fk
                   WHERE ur.id_usuario_fk = v_orientador AND lower(r.nombre_rol) = 'orientador'
                     AND ur.estado = 'activo' AND ur.deleted_at IS NULL) THEN
        RAISE EXCEPTION 'ABORTADO: v_orientador no tiene rol orientador activo';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.emprendedores
                   WHERE id = v_emp2_ficha AND usuario_id = v_emp2_usuario AND deleted_at IS NULL AND estado = 'activo') THEN
        RAISE EXCEPTION 'ABORTADO: la ficha de DEMO-Carlos no corresponde a su usuario o no está activa';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = 'public.asistencias'::regclass
                     AND tgname = 'sigre_asistencias_validar_inicio')
       OR NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = 'public.asistencias'::regclass
                        AND tgname = 'trg_sigre_validar_columnas_asistencias') THEN
        RAISE EXCEPTION 'ABORTADO: faltan los triggers de asistencia esperados';
    END IF;

    SELECT md5(coalesce(string_agg(x, '|' ORDER BY x), '')) INTO v_huella_real FROM (
        SELECT 'o' || to_jsonb(o)::text AS x FROM public.orientaciones o
        UNION ALL SELECT 'i' || to_jsonb(i)::text FROM public.orientacion_inscripciones i
        UNION ALL SELECT 'a' || to_jsonb(a)::text FROM public.asistencias a
    ) t;

    -- Auxiliares temporales ---------------------------------------------------------------------------
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
        IF p_modo = 'postgres' THEN
            RETURN;
        ELSIF p_modo = 'anon' THEN
            PERFORM set_config('role', 'anon', true);
            PERFORM set_config('request.jwt.claim.role', 'anon', true);
            PERFORM set_config('request.jwt.claims', '{"role":"anon"}', true);
            RETURN;
        ELSIF p_modo = 'auth' THEN
            PERFORM set_config('role', 'authenticated', true);
        ELSIF p_modo <> 'servicio' THEN
            RAISE EXCEPTION 'modo desconocido: %', p_modo;
        END IF;
        PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
        PERFORM set_config('request.jwt.claim.sub', p_usuario::text, true);
        PERFORM set_config('request.jwt.claims',
            jsonb_build_object('sub', p_usuario, 'role', 'authenticated', 'aud', 'authenticated')::text, true);
    END;
    $f$;

    -- Ejecuta y conserva los efectos. Devuelve {estado: OK|SQLSTATE, filas, mensaje}.
    CREATE FUNCTION pg_temp.ejecutar(p_modo text, p_usuario uuid, p_sql text) RETURNS jsonb LANGUAGE plpgsql AS $f$
    DECLARE
        v jsonb;
        n bigint;
    BEGIN
        BEGIN
            PERFORM pg_temp.ctx(p_modo, p_usuario);
            EXECUTE p_sql;
            GET DIAGNOSTICS n = ROW_COUNT;
            v := jsonb_build_object('estado', 'OK', 'filas', n);
        EXCEPTION WHEN OTHERS THEN
            v := jsonb_build_object('estado', SQLSTATE, 'mensaje', SQLERRM);
        END;
        PERFORM pg_temp.restaurar();
        RETURN v;
    END;
    $f$;

    -- Caso aislado: ejecuta y SIEMPRE revierte. Devuelve {estado: OK|SQLSTATE, filas, mensaje}.
    CREATE FUNCTION pg_temp.probar(p_modo text, p_usuario uuid, p_sql text) RETURNS jsonb LANGUAGE plpgsql AS $f$
    DECLARE
        v jsonb;
        n bigint;
    BEGIN
        BEGIN
            PERFORM pg_temp.ctx(p_modo, p_usuario);
            EXECUTE p_sql;
            GET DIAGNOSTICS n = ROW_COUNT;
            RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = '__revertir__';
        EXCEPTION WHEN OTHERS THEN
            v := CASE WHEN SQLERRM = '__revertir__' THEN jsonb_build_object('estado', 'OK', 'filas', n)
                      ELSE jsonb_build_object('estado', SQLSTATE, 'mensaje', SQLERRM) END;
        END;
        PERFORM pg_temp.restaurar();
        RETURN v;
    END;
    $f$;

    -- Esperado: OK o SQLSTATE (admite "a|b"); con p_filas exige además ese número de filas afectadas.
    CREATE FUNCTION pg_temp.chk(p_prueba text, p_esperado text, p_r jsonb, p_filas bigint DEFAULT NULL)
    RETURNS jsonb LANGUAGE sql AS $f$
        SELECT jsonb_build_array(jsonb_build_object(
            'prueba', p_prueba, 'esperado', p_esperado || coalesce(' / filas ' || p_filas, ''),
            'obtenido', (p_r ->> 'estado') || coalesce(' / filas ' || (p_r ->> 'filas'), ''),
            'mensaje', p_r ->> 'mensaje',
            'ok', p_r ->> 'estado' = ANY (string_to_array(p_esperado, '|'))
                  AND (p_filas IS NULL OR (p_r ->> 'filas')::bigint = p_filas)))
    $f$;

    CREATE FUNCTION pg_temp.igual(p_valor text, p_esperado text) RETURNS jsonb LANGUAGE sql AS $f$
        SELECT CASE WHEN p_valor IS NOT DISTINCT FROM p_esperado THEN jsonb_build_object('estado', 'OK')
                    ELSE jsonb_build_object('estado', coalesce(p_valor, 'NULL')) END
    $f$;

    CREATE FUNCTION pg_temp.jornada(p_tema text, p_fecha date, p_inicio time, p_orientador uuid)
    RETURNS uuid LANGUAGE sql AS $f$
        INSERT INTO public.orientaciones (tema, fecha, hora_inicio, hora_fin, estado, cupo, id_orientador_fk)
        VALUES ('__prueba_asistencia__ ' || p_tema, p_fecha, p_inicio, p_inicio + interval '1 hour', 'programada', 5, p_orientador)
        RETURNING id
    $f$;

    CREATE FUNCTION pg_temp.inscribir(p_jornada uuid, p_ficha uuid) RETURNS text LANGUAGE sql AS $f$
        SELECT format('SELECT public.sigre_inscribir_en_jornada(p_orientacion_id => %L, p_emprendedor_id => %L)',
                      p_jornada, p_ficha)
    $f$;

    CREATE FUNCTION pg_temp.registrar(p_jornada uuid, p_ficha uuid, p_estado text, p_obs text DEFAULT NULL)
    RETURNS text LANGUAGE sql AS $f$
        SELECT format('SELECT public.sigre_registrar_asistencia(p_orientacion_id => %L, p_emprendedor_id => %L, '
                      'p_estado => %L, p_observacion => %L)', p_jornada, p_ficha, p_estado, p_obs)
    $f$;

    CREATE FUNCTION pg_temp.insertar(p_jornada uuid, p_ficha uuid, p_estado text) RETURNS text LANGUAGE sql AS $f$
        SELECT format('INSERT INTO public.asistencias (id_orientacion_fk, id_emprendedor_fk, estado_asistencia, asistio, '
                      'confirmado_at) VALUES (%L, %L, %L, %L, %s)', p_jornada, p_ficha, p_estado,
                      coalesce(p_estado = 'asistio', false), CASE WHEN p_estado IS NULL THEN 'NULL' ELSE 'now()' END)
    $f$;

    -- 0. Contexto: zona horaria y permisos efectivos -------------------------------------------------
    v_res := v_res || pg_temp.chk('Bogotá: America/Bogota es UTC-5', 'OK', pg_temp.igual(
                 ((now() AT TIME ZONE 'UTC') - (now() AT TIME ZONE 'America/Bogota'))::text, '05:00:00'));
    v_res := v_res || pg_temp.chk('orientador: rol orientador y permiso orientaciones/editar', 'OK', pg_temp.ejecutar('servicio', v_orientador,
                 'SELECT 1 WHERE public.tiene_rol(''orientador'') AND public.tiene_permiso(''orientaciones'', ''editar'')'), 1);

    -- 1. Preparación: jornadas futuras e inscripciones por RPC (solo se inscribe antes del inicio) -----
    v_futura := pg_temp.jornada('futura asignada', v_hoy + 7, '08:00', v_orientador);
    v_rpc    := pg_temp.jornada('a iniciar asignada', v_hoy + 7, '10:00', v_orientador);
    v_ajena  := pg_temp.jornada('a iniciar ajena', v_hoy + 7, '12:00', NULL);
    v_res := v_res
        || pg_temp.chk('preparación: Laura en futura', 'OK', pg_temp.ejecutar('auth', v_admin, pg_temp.inscribir(v_futura, v_laura_ficha)))
        || pg_temp.chk('preparación: Carlos en futura', 'OK', pg_temp.ejecutar('auth', v_admin, pg_temp.inscribir(v_futura, v_emp2_ficha)))
        || pg_temp.chk('preparación: Laura en a iniciar', 'OK', pg_temp.ejecutar('auth', v_admin, pg_temp.inscribir(v_rpc, v_laura_ficha)))
        || pg_temp.chk('preparación: Carlos en a iniciar', 'OK', pg_temp.ejecutar('auth', v_admin, pg_temp.inscribir(v_rpc, v_emp2_ficha)))
        || pg_temp.chk('preparación: Laura en ajena', 'OK', pg_temp.ejecutar('auth', v_admin, pg_temp.inscribir(v_ajena, v_laura_ficha)));

    -- 2. Antes del inicio: todo marcado de asistencia se rechaza (22023) ------------------------------
    v_res := v_res
        || pg_temp.chk('antes del inicio: RPC admin asistio', '22023', pg_temp.probar('auth', v_admin, pg_temp.registrar(v_futura, v_laura_ficha, 'asistio')))
        || pg_temp.chk('antes del inicio: RPC admin no_asistio', '22023', pg_temp.probar('auth', v_admin, pg_temp.registrar(v_futura, v_laura_ficha, 'no_asistio')))
        || pg_temp.chk('antes del inicio: RPC orientador asistio', '22023', pg_temp.probar('auth', v_orientador, pg_temp.registrar(v_futura, v_emp2_ficha, 'asistio')))
        || pg_temp.chk('antes del inicio: RPC orientador no_asistio', '22023', pg_temp.probar('auth', v_orientador, pg_temp.registrar(v_futura, v_emp2_ficha, 'no_asistio')))
        || pg_temp.chk('antes del inicio: INSERT directo asistio', '22023', pg_temp.probar('postgres', NULL, pg_temp.insertar(v_futura, v_laura_ficha, 'asistio')))
        || pg_temp.chk('antes del inicio: INSERT directo no_asistio', '22023', pg_temp.probar('postgres', NULL, pg_temp.insertar(v_futura, v_laura_ficha, 'no_asistio')))
        || pg_temp.chk('antes del inicio: INSERT directo asistio=true sin estado', '22023', pg_temp.probar('postgres', NULL,
               format('INSERT INTO public.asistencias (id_orientacion_fk, id_emprendedor_fk, asistio) VALUES (%L, %L, true)', v_futura, v_laura_ficha)))
        || pg_temp.chk('antes del inicio: INSERT directo pendiente (sin estado)', 'OK', pg_temp.probar('postgres', NULL, pg_temp.insertar(v_futura, v_laura_ficha, NULL)), 1)
        || pg_temp.chk('RPC: estado inválido', '22023', pg_temp.probar('auth', v_admin, pg_temp.registrar(v_futura, v_laura_ficha, 'presente')))
        || pg_temp.chk('RPC: estado NULL', '22023', pg_temp.probar('auth', v_admin, pg_temp.registrar(v_futura, v_laura_ficha, NULL)));
    SELECT count(*)::text INTO v_txt FROM public.asistencias WHERE id_orientacion_fk = v_futura;
    v_res := v_res || pg_temp.chk('antes del inicio: ninguna asistencia creada', 'OK', pg_temp.igual(v_txt, '0'));

    -- 3. Inicio de jornada: se trasladan al pasado (escritura de servicio como Administrador) -----------
    v_res := v_res || pg_temp.chk('preparación: jornadas a iniciar pasan a ayer', 'OK', pg_temp.ejecutar('servicio', v_admin,
                 format('UPDATE public.orientaciones SET fecha = %L WHERE id IN (%L, %L)', v_hoy - 1, v_rpc, v_ajena)), 2);

    -- 4. Después del inicio: registro permitido a Administrador y Orientador asignado ----------------
    v_res := v_res || pg_temp.chk('después del inicio: RPC admin asistio (Laura)', 'OK',
                 pg_temp.ejecutar('auth', v_admin, pg_temp.registrar(v_rpc, v_laura_ficha, 'asistio', 'prueba')));
    SELECT id, concat_ws('|', estado_asistencia, asistio, registrado_por_usuario_id = v_admin, confirmado_at IS NOT NULL, observacion)
    INTO v_fila, v_txt FROM public.asistencias WHERE id_orientacion_fk = v_rpc AND id_emprendedor_fk = v_laura_ficha;
    v_res := v_res || pg_temp.chk('después del inicio: fila coherente (estado, asistio, responsable, confirmado_at)', 'OK',
                 pg_temp.igual(v_txt, 'asistio|t|t|t|prueba'));

    v_res := v_res || pg_temp.chk('después del inicio: RPC admin actualiza observación', 'OK',
                 pg_temp.ejecutar('auth', v_admin, pg_temp.registrar(v_rpc, v_laura_ficha, 'asistio', 'observación corregida')));
    SELECT concat_ws('|', count(*), max(observacion), bool_and(id = v_fila)) INTO v_txt
    FROM public.asistencias WHERE id_orientacion_fk = v_rpc AND id_emprendedor_fk = v_laura_ficha;
    v_res := v_res || pg_temp.chk('después del inicio: misma fila con observación corregida', 'OK',
                 pg_temp.igual(v_txt, '1|observación corregida|t'));

    v_res := v_res || pg_temp.chk('después del inicio: RPC orientador no_asistio (Carlos)', 'OK',
                 pg_temp.ejecutar('auth', v_orientador, pg_temp.registrar(v_rpc, v_emp2_ficha, 'no_asistio', 'sin excusa')));
    v_res := v_res || pg_temp.chk('después del inicio: RPC orientador cambia Laura a no_asistio', 'OK',
                 pg_temp.ejecutar('auth', v_orientador, pg_temp.registrar(v_rpc, v_laura_ficha, 'no_asistio', 'llegó tarde')));
    SELECT string_agg(concat_ws(':', estado_asistencia, asistio, registrado_por_usuario_id = v_orientador),
                      ',' ORDER BY id_emprendedor_fk = v_laura_ficha DESC)
    INTO v_txt FROM public.asistencias WHERE id_orientacion_fk = v_rpc;
    v_res := v_res || pg_temp.chk('después del inicio: estados no_asistio y responsable Orientador', 'OK',
                 pg_temp.igual(v_txt, 'no_asistio:f:t,no_asistio:f:t'));
    SELECT count(*)::text INTO v_txt FROM public.auditorias
    WHERE tabla_afectada = 'asistencias' AND valor_nuevo ->> 'id_orientacion_fk' = v_rpc::text;
    v_res := v_res || pg_temp.chk('después del inicio: 4 auditorías de asistencia (2 creadas, 2 actualizadas)', 'OK', pg_temp.igual(v_txt, '4'));

    -- 5. Negativas por RPC después del inicio --------------------------------------------------------
    v_res := v_res
        || pg_temp.chk('RPC orientador en jornada ajena', '42501', pg_temp.probar('auth', v_orientador, pg_temp.registrar(v_ajena, v_laura_ficha, 'asistio')))
        || pg_temp.chk('RPC emprendedor (Carlos)', '42501', pg_temp.probar('auth', v_emp2_usuario, pg_temp.registrar(v_rpc, v_emp2_ficha, 'asistio')))
        || pg_temp.chk('RPC Laura sobre sí misma', '42501', pg_temp.probar('auth', v_laura, pg_temp.registrar(v_rpc, v_laura_ficha, 'asistio')))
        || pg_temp.chk('RPC anónimo', '42501', pg_temp.probar('anon', NULL, pg_temp.registrar(v_rpc, v_laura_ficha, 'asistio')))
        || pg_temp.chk('RPC sin identidad', '42501', pg_temp.probar('postgres', NULL, pg_temp.registrar(v_rpc, v_laura_ficha, 'asistio')))
        || pg_temp.chk('RPC sin inscripción (Carlos en ajena)', '22023', pg_temp.probar('auth', v_admin, pg_temp.registrar(v_ajena, v_emp2_ficha, 'asistio')));

    BEGIN
        UPDATE public.orientacion_inscripciones SET estado = 'cancelado'
        WHERE id_orientacion_fk = v_ajena AND id_emprendedor_fk = v_laura_ficha;
        v_r := pg_temp.ejecutar('auth', v_admin, pg_temp.registrar(v_ajena, v_laura_ficha, 'asistio'));
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = '__revertir__';
    EXCEPTION WHEN raise_exception THEN
        IF SQLERRM <> '__revertir__' THEN RAISE; END IF;
    END;
    v_res := v_res || pg_temp.chk('RPC con inscripción cancelada', '22023', v_r);

    BEGIN
        PERFORM pg_temp.ctx('servicio', v_admin);
        UPDATE public.orientaciones SET estado = 'finalizada' WHERE id = v_rpc;
        PERFORM pg_temp.restaurar();
        v_r := pg_temp.ejecutar('auth', v_admin, pg_temp.registrar(v_rpc, v_emp2_ficha, 'asistio'));
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = '__revertir__';
    EXCEPTION WHEN raise_exception THEN
        IF SQLERRM <> '__revertir__' THEN RAISE; END IF;
    END;
    PERFORM pg_temp.restaurar();
    v_res := v_res || pg_temp.chk('RPC en jornada finalizada', '22023', v_r);

    BEGIN
        PERFORM pg_temp.ctx('servicio', v_admin);
        UPDATE public.orientaciones SET deleted_at = now() WHERE id = v_rpc;
        PERFORM pg_temp.restaurar();
        v_r := pg_temp.ejecutar('auth', v_admin, pg_temp.registrar(v_rpc, v_emp2_ficha, 'asistio'));
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = '__revertir__';
    EXCEPTION WHEN raise_exception THEN
        IF SQLERRM <> '__revertir__' THEN RAISE; END IF;
    END;
    PERFORM pg_temp.restaurar();
    v_res := v_res || pg_temp.chk('RPC en jornada eliminada', '22023', v_r);

    -- 6. Escritura directa sobre la asistencia de Laura (fila v_fila, responsable actual: Orientador) --
    v_res := v_res
        || pg_temp.chk('UPDATE directo sin identidad', '42501', pg_temp.probar('postgres', NULL,
               format('UPDATE public.asistencias SET observacion = ''x'' WHERE id = %L', v_fila)))
        || pg_temp.chk('UPDATE autenticado como Administrador (RLS sin política UPDATE)', 'OK', pg_temp.probar('auth', v_admin,
               format('UPDATE public.asistencias SET observacion = ''x'' WHERE id = %L', v_fila)), 0)
        || pg_temp.chk('INSERT autenticado como Administrador (RLS)', '42501', pg_temp.probar('auth', v_admin,
               pg_temp.insertar(v_ajena, v_emp2_ficha, 'asistio')))
        || pg_temp.chk('UPDATE servicio admin sin asumir la responsabilidad', '42501', pg_temp.probar('servicio', v_admin,
               format('UPDATE public.asistencias SET observacion = ''x'' WHERE id = %L', v_fila)))
        || pg_temp.chk('UPDATE servicio admin válido (asume responsabilidad)', 'OK', pg_temp.probar('servicio', v_admin,
               format('UPDATE public.asistencias SET estado_asistencia = ''asistio'', asistio = true, observacion = ''x'', '
                      'registrado_por_usuario_id = %L, confirmado_at = now() WHERE id = %L', v_admin, v_fila)), 1)
        || pg_temp.chk('UPDATE servicio Orientador asignado válido', 'OK', pg_temp.probar('servicio', v_orientador,
               format('UPDATE public.asistencias SET observacion = ''x'', registrado_por_usuario_id = %L, confirmado_at = now() '
                      'WHERE id = %L', v_orientador, v_fila)), 1)
        || pg_temp.chk('UPDATE servicio emprendedor (Carlos)', '42501', pg_temp.probar('servicio', v_emp2_usuario,
               format('UPDATE public.asistencias SET observacion = ''x'', registrado_por_usuario_id = %L WHERE id = %L',
                      v_emp2_usuario, v_fila)))
        || pg_temp.chk('UPDATE servicio admin: estado NULL', '22023', pg_temp.probar('servicio', v_admin,
               format('UPDATE public.asistencias SET estado_asistencia = NULL, asistio = false, registrado_por_usuario_id = %L, '
                      'confirmado_at = now() WHERE id = %L', v_admin, v_fila)))
        || pg_temp.chk('UPDATE servicio admin: estado incoherente con asistio', '22023', pg_temp.probar('servicio', v_admin,
               format('UPDATE public.asistencias SET asistio = true, registrado_por_usuario_id = %L, confirmado_at = now() '
                      'WHERE id = %L', v_admin, v_fila)))
        || pg_temp.chk('UPDATE servicio admin: confirmado_at NULL', '22023', pg_temp.probar('servicio', v_admin,
               format('UPDATE public.asistencias SET registrado_por_usuario_id = %L, confirmado_at = NULL WHERE id = %L',
                      v_admin, v_fila)))
        || pg_temp.chk('UPDATE servicio admin: archivar (deleted_at)', '42501', pg_temp.probar('servicio', v_admin,
               format('UPDATE public.asistencias SET deleted_at = now(), registrado_por_usuario_id = %L, confirmado_at = now() '
                      'WHERE id = %L', v_admin, v_fila)))
        || pg_temp.chk('UPDATE servicio admin: mover a otra jornada iniciada', '42501', pg_temp.probar('servicio', v_admin,
               format('UPDATE public.asistencias SET id_orientacion_fk = %L, registrado_por_usuario_id = %L, confirmado_at = now() '
                      'WHERE id = %L', v_ajena, v_admin, v_fila)))
        || pg_temp.chk('UPDATE servicio Orientador: mover a otra jornada', '42501', pg_temp.probar('servicio', v_orientador,
               format('UPDATE public.asistencias SET id_orientacion_fk = %L, registrado_por_usuario_id = %L, confirmado_at = now() '
                      'WHERE id = %L', v_ajena, v_orientador, v_fila)))
        || pg_temp.chk('INSERT directo duplicado (misma jornada y emprendedor)', '23505', pg_temp.probar('postgres', NULL,
               pg_temp.insertar(v_rpc, v_laura_ficha, 'asistio')));

    -- 7. Jornada reprogramada a futuro con asistencia ya registrada ---------------------------------
    v_res := v_res || pg_temp.chk('preparación: jornada reprogramada a futuro', 'OK', pg_temp.ejecutar('servicio', v_admin,
                 format('UPDATE public.orientaciones SET fecha = %L WHERE id = %L', v_hoy + 7, v_rpc)), 1);
    v_res := v_res
        || pg_temp.chk('reprogramada: RPC mismo estado, nueva observación', 'OK', pg_temp.probar('auth', v_admin,
               pg_temp.registrar(v_rpc, v_laura_ficha, 'no_asistio', 'reprogramada')))
        || pg_temp.chk('reprogramada: RPC cambiar a asistio', '22023', pg_temp.probar('auth', v_admin,
               pg_temp.registrar(v_rpc, v_laura_ficha, 'asistio')));

    -- 8. Frontera horaria America/Bogota -------------------------------------------------------------
    IF v_ahora::time BETWEEN '00:05' AND '22:50' THEN
        v_frontera_a := pg_temp.jornada('inicio hace 2 min', v_hoy, (v_ahora - interval '2 minutes')::time, NULL);
        v_frontera_b := pg_temp.jornada('inicio en 5 min', v_hoy, (v_ahora + interval '5 minutes')::time, v_orientador);
        v_res := v_res
            || pg_temp.chk('Bogotá: INSERT directo, inicio hace 2 minutos', 'OK', pg_temp.probar('postgres', NULL,
                   pg_temp.insertar(v_frontera_a, v_laura_ficha, 'asistio')), 1)
            || pg_temp.chk('Bogotá: INSERT directo, inicio dentro de 5 minutos', '22023', pg_temp.probar('postgres', NULL,
                   pg_temp.insertar(v_frontera_b, v_laura_ficha, 'asistio')))
            || pg_temp.chk('Bogotá: inscripción permitida antes del inicio', 'OK', pg_temp.ejecutar('auth', v_admin,
                   pg_temp.inscribir(v_frontera_b, v_emp2_ficha)))
            || pg_temp.chk('Bogotá: RPC orientador, inicio dentro de 5 minutos', '22023', pg_temp.probar('auth', v_orientador,
                   pg_temp.registrar(v_frontera_b, v_emp2_ficha, 'asistio')));
    ELSE
        v_res := v_res || pg_temp.chk('Bogotá: frontera omitida (22:50-00:05)', 'omitida', jsonb_build_object('estado', 'omitida'));
    END IF;

    -- 9. Datos reales intactos y contexto restablecido -----------------------------------------------
    SELECT md5(coalesce(string_agg(x, '|' ORDER BY x), '')) INTO v_txt FROM (
        SELECT 'o' || to_jsonb(o)::text AS x FROM public.orientaciones o WHERE o.tema NOT LIKE '\_\_prueba\_asistencia\_\_%'
        UNION ALL SELECT 'i' || to_jsonb(i)::text FROM public.orientacion_inscripciones i
                  WHERE i.id_orientacion_fk NOT IN (SELECT id FROM public.orientaciones WHERE tema LIKE '\_\_prueba\_asistencia\_\_%')
        UNION ALL SELECT 'a' || to_jsonb(a)::text FROM public.asistencias a
                  WHERE a.id_orientacion_fk NOT IN (SELECT id FROM public.orientaciones WHERE tema LIKE '\_\_prueba\_asistencia\_\_%')
    ) t;
    v_res := v_res || pg_temp.chk('datos reales (Laura y jornadas DEMO) sin cambios', 'OK', pg_temp.igual(v_txt, v_huella_real));
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
