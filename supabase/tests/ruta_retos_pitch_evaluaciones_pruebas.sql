-- SIGRE · PRUEBAS DE RETOS, PITCH, EVALUADORES Y EVALUACIONES (SIN EFECTOS PERSISTENTES)
-- Destino: STAGING, después de supabase/migrations/20261030120000_ruta_retos_pitch_evaluaciones.sql. Prohibido en PRODUCTION.
-- Crea usuarios, ficha, proyecto y retos desechables; usa el Administrador y el Orientador DEMO reales sin modificarlos.
-- Termina SIEMPRE con un ERROR "RESULTADO ..." que revierte toda la transacción.

DO $$
DECLARE
    v_admin      constant uuid := '0a2a7a08-7c33-49e1-bd94-d21313924231';
    v_laura      constant uuid := 'bbd440b7-717e-416c-a2e7-0a33ee1d1320';
    v_orientador constant uuid := '26443b44-abf8-450c-aef8-0d79dbcbc21e';
    v_carlos     constant uuid := '44ea681a-3679-4418-a8f1-dc5c9aeb9a5e';
    v_emp        uuid := gen_random_uuid();
    v_ev         uuid[] := ARRAY[gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid()];
    v_evid       uuid[] := ARRAY[]::uuid[];
    v_asig       uuid[] := ARRAY[]::uuid[];
    v_centro     uuid;
    v_ficha      uuid;
    v_proy       uuid;
    v_r1 uuid; v_r2 uuid; v_r3 uuid;
    v_c1 uuid; v_pitch uuid; v_txt text; v_aud bigint; i int;
    v_res        jsonb := '[]'::jsonb;
    v_fallos     int;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_laura) THEN RAISE EXCEPTION 'ABORTADO: este proyecto no es STAGING'; END IF;
    IF to_regprocedure('public.sigre_evaluador_registrar_calificacion(uuid,numeric,text,text)') IS NULL THEN
        RAISE EXCEPTION 'ABORTADO: la migración de la ruta no está aplicada';
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
    -- Ejecuta p_sql como el usuario y devuelve 'OK' o el SQLSTATE; el resultado escalar queda en pg_temp.ultimo.
    CREATE TEMP TABLE ultimo (v text) ON COMMIT DROP;
    CREATE FUNCTION pg_temp.como(p_usuario uuid, p_sql text, p_modo text DEFAULT 'authenticated') RETURNS text LANGUAGE plpgsql AS $f$
    DECLARE v text;
    BEGIN
        PERFORM pg_temp.ctx(p_modo, p_usuario);
        EXECUTE p_sql INTO v;
        PERFORM pg_temp.postgres();
        DELETE FROM pg_temp.ultimo; INSERT INTO pg_temp.ultimo VALUES (v);
        RETURN 'OK';
    EXCEPTION WHEN others THEN
        PERFORM pg_temp.postgres();
        RETURN SQLSTATE;
    END;
    $f$;
    CREATE FUNCTION pg_temp.val() RETURNS text LANGUAGE sql AS $f$ SELECT v FROM pg_temp.ultimo $f$;
    CREATE FUNCTION pg_temp.chk(p_nombre text, p_esperado text, p_obtenido text) RETURNS jsonb LANGUAGE sql AS $f$
        SELECT jsonb_build_array(jsonb_build_object('prueba', p_nombre, 'ok', p_esperado IS NOT DISTINCT FROM p_obtenido,
                                                    'esperado', p_esperado, 'obtenido', p_obtenido));
    $f$;

    SELECT count(*) INTO v_aud FROM public.auditorias;
    SELECT id_centro_sena_fk INTO v_centro FROM public.emprendedores WHERE usuario_id = v_carlos;

    -- Usuarios desechables: un emprendedor y cuatro evaluadores --------------------------------------
    INSERT INTO auth.users (id, email, aud, role) SELECT u, 'prueba.ruta.' || u || '@example.com', 'authenticated', 'authenticated'
    FROM unnest(v_ev || v_emp) u;
    INSERT INTO public.usuarios (id, primer_nombre, primer_apellido, tipo_documento, numero_documento, correo_electronico, estado, created_at, updated_at)
    SELECT u, 'Prueba', 'Ruta', 'CC', '79' || lpad((row_number() OVER ())::text, 8, '0'), 'prueba.ruta.' || u || '@example.com', 'activo', now(), now()
    FROM unnest(v_ev || v_emp) u
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.usuario_roles (id_usuario_fk, id_rol_fk, estado, created_at, updated_at) SELECT u, 2, 'activo', now(), now() FROM unnest(v_ev) u;
    INSERT INTO public.usuario_roles (id_usuario_fk, id_rol_fk, estado, created_at, updated_at) VALUES (v_emp, 4, 'activo', now(), now());
    INSERT INTO public.emprendedores (usuario_id, nombre_completo, id_centro_sena_fk, estado, id_orientador_fk, created_at, updated_at)
    VALUES (v_emp, 'Prueba Ruta', v_centro, 'activo', v_orientador, now(), now()) RETURNING id INTO v_ficha;
    INSERT INTO public.proyectos (id_emprendedor_fk, titulo, estado_proyecto, created_at, updated_at) VALUES (v_ficha, '__prueba_ruta', 'borrador', now(), now()) RETURNING id INTO v_proy;

    -- RETOS -------------------------------------------------------------------------------------------
    v_res := v_res || pg_temp.chk('admin crea R1', 'OK', pg_temp.como(v_admin, 'SELECT public.sigre_admin_guardar_reto(NULL, NULL, ''__prueba R1'', NULL, 1, ''en_curso'')'));
    v_r1 := pg_temp.val()::uuid;
    PERFORM pg_temp.como(v_admin, 'SELECT public.sigre_admin_guardar_reto(NULL, NULL, ''__prueba R2'', NULL, 2, ''en_curso'')'); v_r2 := pg_temp.val()::uuid;
    PERFORM pg_temp.como(v_admin, 'SELECT public.sigre_admin_guardar_reto(NULL, NULL, ''__prueba R3'', NULL, 3, ''programado'')'); v_r3 := pg_temp.val()::uuid;
    -- Los retos reales previos se ignoran en la secuencia de esta prueba: se cancelan dentro de la transacción.
    UPDATE public.retos SET estado = 'cancelado' WHERE id NOT IN (v_r1, v_r2, v_r3);
    v_res := v_res || pg_temp.chk('orientador no crea retos', '42501', pg_temp.como(v_orientador, 'SELECT public.sigre_admin_guardar_reto(NULL, NULL, ''x'', NULL, 1, ''en_curso'')'));
    v_res := v_res || pg_temp.chk('estado de reto no válido', '22023', pg_temp.como(v_admin, 'SELECT public.sigre_admin_guardar_reto(NULL, NULL, ''x'', NULL, 1, ''raro'')'));
    v_res := v_res || pg_temp.chk('conflicto de versión del reto', 'PT409',
        pg_temp.como(v_admin, format('SELECT public.sigre_admin_cambiar_estado_reto(%L, ''finalizado'', ''2000-01-01'')', v_r3)));
    v_res := v_res || pg_temp.chk('R2 antes de aprobar R1', '22023', pg_temp.como(v_orientador, format('SELECT public.sigre_admin_asignar_reto_proyecto(%L, %L, NULL)', v_r2, v_proy)));
    v_res := v_res || pg_temp.chk('orientador asigna R1', 'OK', pg_temp.como(v_orientador, format('SELECT public.sigre_admin_asignar_reto_proyecto(%L, %L, current_date + 7)', v_r1, v_proy)));
    v_c1 := pg_temp.val()::uuid;
    v_res := v_res || pg_temp.chk('R1 duplicado', '23505', pg_temp.como(v_orientador, format('SELECT public.sigre_admin_asignar_reto_proyecto(%L, %L, NULL)', v_r1, v_proy)));
    v_res := v_res || pg_temp.chk('Carlos no asigna retos', '42501', pg_temp.como(v_carlos, format('SELECT public.sigre_admin_asignar_reto_proyecto(%L, %L, NULL)', v_r3, v_proy)));
    v_res := v_res || pg_temp.chk('RLS emprendedor ve su reto', 'OK', pg_temp.como(v_emp, format('SELECT count(*) FROM public.cumplimiento_retos WHERE id = %L', v_c1)));
    v_res := v_res || pg_temp.chk('RLS emprendedor: 1 cumplimiento', '1', pg_temp.val());
    PERFORM pg_temp.como(v_carlos, format('SELECT count(*) FROM public.cumplimiento_retos WHERE id = %L', v_c1));
    v_res := v_res || pg_temp.chk('RLS otro emprendedor: 0', '0', pg_temp.val());
    PERFORM pg_temp.como(v_ev[1], format('SELECT count(*) FROM public.cumplimiento_retos WHERE id = %L', v_c1));
    v_res := v_res || pg_temp.chk('RLS evaluador sin retos: 0', '0', pg_temp.val());
    PERFORM pg_temp.como(v_emp, 'SELECT count(*) FROM public.retos WHERE titulo LIKE ''__prueba%''');
    v_res := v_res || pg_temp.chk('RLS emprendedor ve catálogo de retos', '3', pg_temp.val());
    v_res := v_res || pg_temp.chk('Carlos no registra avance ajeno', '42501', pg_temp.como(v_carlos, format('SELECT public.sigre_registrar_avance_reto(%L, ''https://x.example.com/a'', NULL)', v_c1)));
    v_res := v_res || pg_temp.chk('avance vacío', '22023', pg_temp.como(v_emp, format('SELECT public.sigre_registrar_avance_reto(%L, '' '', NULL)', v_c1)));
    v_res := v_res || pg_temp.chk('emprendedor entrega R1', 'OK', pg_temp.como(v_emp, format('SELECT public.sigre_registrar_avance_reto(%L, ''https://x.example.com/r1'', ''Primera versión'')', v_c1)));
    v_res := v_res || pg_temp.chk('emprendedor no se revisa', '42501', pg_temp.como(v_emp, format('SELECT public.sigre_revisar_reto(%L, ''aprobado'', NULL)', v_c1)));
    v_res := v_res || pg_temp.chk('ajustes sin observación', '22023', pg_temp.como(v_orientador, format('SELECT public.sigre_revisar_reto(%L, ''requiere_ajustes'', NULL)', v_c1)));
    v_res := v_res || pg_temp.chk('orientador solicita ajustes', 'OK', pg_temp.como(v_orientador, format('SELECT public.sigre_revisar_reto(%L, ''requiere_ajustes'', ''Mejorar el mercado'')', v_c1)));
    v_res := v_res || pg_temp.chk('estado requiere_ajustes', 'requiere_ajustes', (SELECT estado_cumplimiento FROM public.cumplimiento_retos WHERE id = v_c1));
    v_res := v_res || pg_temp.chk('revisar sin nueva entrega', '22023', pg_temp.como(v_orientador, format('SELECT public.sigre_revisar_reto(%L, ''aprobado'', NULL)', v_c1)));
    v_res := v_res || pg_temp.chk('emprendedor entrega ajuste', 'OK', pg_temp.como(v_emp, format('SELECT public.sigre_registrar_avance_reto(%L, ''https://x.example.com/r1v2'', ''Ajustado'')', v_c1)));
    v_res := v_res || pg_temp.chk('orientador aprueba R1', 'OK', pg_temp.como(v_orientador, format('SELECT public.sigre_revisar_reto(%L, ''aprobado'', NULL)', v_c1)));
    v_res := v_res || pg_temp.chk('dos sustentaciones trazadas', '2', (SELECT count(*)::text FROM public.sustentacion_retos WHERE id_cumplimiento_reto_fk = v_c1));
    v_res := v_res || pg_temp.chk('R2 tras aprobar R1', 'OK', pg_temp.como(v_orientador, format('SELECT public.sigre_admin_asignar_reto_proyecto(%L, %L, NULL)', v_r2, v_proy)));

    -- EVALUADORES -------------------------------------------------------------------------------------
    FOR i IN 1..4 LOOP
        v_txt := pg_temp.como(v_admin, format('SELECT public.sigre_admin_guardar_evaluador(NULL, %L, NULL, ''Finanzas'', ''SENA'', ''5 años'')', v_ev[i]));
        v_res := v_res || pg_temp.chk('admin registra evaluador ' || i, 'OK', v_txt);
        v_evid := v_evid || pg_temp.val()::uuid;
    END LOOP;
    v_res := v_res || pg_temp.chk('usuario sin rol Evaluador', '22023', pg_temp.como(v_admin, format('SELECT public.sigre_admin_guardar_evaluador(NULL, %L, NULL, NULL, NULL, NULL)', v_carlos)));
    v_res := v_res || pg_temp.chk('evaluador duplicado', '23505', pg_temp.como(v_admin, format('SELECT public.sigre_admin_guardar_evaluador(NULL, %L, NULL, NULL, NULL, NULL)', v_ev[1])));
    v_res := v_res || pg_temp.chk('orientador no gestiona evaluadores', '42501', pg_temp.como(v_orientador, format('SELECT public.sigre_admin_guardar_evaluador(NULL, %L, NULL, NULL, NULL, NULL)', v_ev[1])));

    -- PITCH -------------------------------------------------------------------------------------------
    v_res := v_res || pg_temp.chk('admin programa pitch', 'OK', pg_temp.como(v_admin, format('SELECT public.sigre_admin_guardar_pitch(NULL, NULL, %L, now() + interval ''3 days'', ''virtual'', ''https://meet.example.com/x'', NULL, NULL)', v_proy)));
    v_pitch := pg_temp.val()::uuid;
    v_res := v_res || pg_temp.chk('orientador no programa pitch', '42501', pg_temp.como(v_orientador, format('SELECT public.sigre_admin_guardar_pitch(NULL, NULL, %L, now(), ''virtual'', NULL, NULL, NULL)', v_proy)));
    v_res := v_res || pg_temp.chk('confirmar sin evaluadores', '22023', pg_temp.como(v_admin, format('SELECT public.sigre_admin_cambiar_estado_pitch(%L, ''confirmado'', (SELECT updated_at FROM public.pitch WHERE id = %L))', v_pitch, v_pitch)));
    FOR i IN 1..3 LOOP
        v_res := v_res || pg_temp.chk('asignar evaluador ' || i, 'OK', pg_temp.como(v_admin, format('SELECT public.sigre_admin_asignar_evaluador_pitch(%L, %L)', v_pitch, v_evid[i])));
        v_asig := v_asig || pg_temp.val()::uuid;
        IF i = 1 THEN
            v_res := v_res || pg_temp.chk('confirmar con 1 evaluador', '22023', pg_temp.como(v_admin, format('SELECT public.sigre_admin_cambiar_estado_pitch(%L, ''confirmado'', (SELECT updated_at FROM public.pitch WHERE id = %L))', v_pitch, v_pitch)));
        END IF;
    END LOOP;
    v_res := v_res || pg_temp.chk('cuarto evaluador: máximo 3', '22023', pg_temp.como(v_admin, format('SELECT public.sigre_admin_asignar_evaluador_pitch(%L, %L)', v_pitch, v_evid[4])));
    v_res := v_res || pg_temp.chk('evaluador repetido', '23505', pg_temp.como(v_admin, format('SELECT public.sigre_admin_asignar_evaluador_pitch(%L, %L)', v_pitch, v_evid[1])));
    v_res := v_res || pg_temp.chk('retirar evaluador 3', 'OK', pg_temp.como(v_admin, format('SELECT public.sigre_admin_retirar_evaluador_pitch(%L, (SELECT updated_at FROM public.asignacion_evaluadores WHERE id = %L))', v_asig[3], v_asig[3])));
    v_res := v_res || pg_temp.chk('reasignar evaluador 3', 'OK', pg_temp.como(v_admin, format('SELECT public.sigre_admin_asignar_evaluador_pitch(%L, %L)', v_pitch, v_evid[3])));
    v_res := v_res || pg_temp.chk('reasignación reutiliza la fila', v_asig[3]::text, pg_temp.val());
    v_res := v_res || pg_temp.chk('confirmar con 3', 'OK', pg_temp.como(v_admin, format('SELECT public.sigre_admin_cambiar_estado_pitch(%L, ''confirmado'', (SELECT updated_at FROM public.pitch WHERE id = %L))', v_pitch, v_pitch)));
    v_res := v_res || pg_temp.chk('calificar antes de evaluación', '22023', pg_temp.como(v_ev[1], format('SELECT public.sigre_evaluador_registrar_calificacion(%L, 80, ''aprobado'', NULL)', v_asig[1])));
    v_res := v_res || pg_temp.chk('iniciar evaluación', 'OK', pg_temp.como(v_admin, format('SELECT public.sigre_admin_cambiar_estado_pitch(%L, ''en_evaluacion'', (SELECT updated_at FROM public.pitch WHERE id = %L))', v_pitch, v_pitch)));
    v_res := v_res || pg_temp.chk('no retirar en evaluación', '22023', pg_temp.como(v_admin, format('SELECT public.sigre_admin_retirar_evaluador_pitch(%L, (SELECT updated_at FROM public.asignacion_evaluadores WHERE id = %L))', v_asig[2], v_asig[2])));

    -- RLS del Evaluador ------------------------------------------------------------------------------
    PERFORM pg_temp.como(v_ev[1], format('SELECT count(*) FROM public.pitch WHERE id = %L', v_pitch));
    v_res := v_res || pg_temp.chk('RLS evaluador asignado ve el pitch', '1', pg_temp.val());
    PERFORM pg_temp.como(v_ev[4], format('SELECT count(*) FROM public.pitch WHERE id = %L', v_pitch));
    v_res := v_res || pg_temp.chk('RLS evaluador no asignado: 0', '0', pg_temp.val());
    PERFORM pg_temp.como(v_ev[1], format('SELECT count(*) FROM public.asignacion_evaluadores WHERE id_pitch_fk = %L', v_pitch));
    v_res := v_res || pg_temp.chk('RLS evaluador ve solo su asignación', '1', pg_temp.val());
    PERFORM pg_temp.como(v_ev[1], format('SELECT count(*) FROM public.proyectos WHERE id = %L', v_proy));
    v_res := v_res || pg_temp.chk('RLS evaluador ve el proyecto asignado', '1', pg_temp.val());
    PERFORM pg_temp.como(v_ev[4], format('SELECT count(*) FROM public.proyectos WHERE id = %L', v_proy));
    v_res := v_res || pg_temp.chk('RLS evaluador no asignado no ve el proyecto', '0', pg_temp.val());
    PERFORM pg_temp.como(v_ev[1], 'SELECT count(*) FROM public.emprendedores');
    v_res := v_res || pg_temp.chk('RLS evaluador sin listado general de emprendedores', 'true', (pg_temp.val()::int <= 1)::text);

    -- EVALUACIONES ------------------------------------------------------------------------------------
    v_res := v_res || pg_temp.chk('puntaje fuera de rango', '22023', pg_temp.como(v_ev[1], format('SELECT public.sigre_evaluador_registrar_calificacion(%L, 150, ''aprobado'', NULL)', v_asig[1])));
    v_res := v_res || pg_temp.chk('evaluador 1 califica', 'OK', pg_temp.como(v_ev[1], format('SELECT public.sigre_evaluador_registrar_calificacion(%L, 70, ''aprobado'', ''Bien'')', v_asig[1])));
    v_res := v_res || pg_temp.chk('evaluador 1 corrige su calificación', 'OK', pg_temp.como(v_ev[1], format('SELECT public.sigre_evaluador_registrar_calificacion(%L, 85.5, ''aprobado'', ''Muy bien'')', v_asig[1])));
    v_res := v_res || pg_temp.chk('evaluador 1 no califica asignación ajena', '42501', pg_temp.como(v_ev[1], format('SELECT public.sigre_evaluador_registrar_calificacion(%L, 10, ''no_aprobado'', NULL)', v_asig[2])));
    v_res := v_res || pg_temp.chk('admin no califica', '42501', pg_temp.como(v_admin, format('SELECT public.sigre_evaluador_registrar_calificacion(%L, 10, ''aprobado'', NULL)', v_asig[2])));
    v_res := v_res || pg_temp.chk('cerrar con calificaciones pendientes', '22023', pg_temp.como(v_admin, format('SELECT public.sigre_admin_cambiar_estado_pitch(%L, ''cerrado'', (SELECT updated_at FROM public.pitch WHERE id = %L))', v_pitch, v_pitch)));
    PERFORM pg_temp.como(v_ev[2], format('SELECT public.sigre_evaluador_registrar_calificacion(%L, 90, ''aprobado'', NULL)', v_asig[2]));
    PERFORM pg_temp.como(v_ev[1], format('SELECT count(*) FROM public.calificaciones_pitch c JOIN public.asignacion_evaluadores a ON a.id = c.id_asignacion_evaluador_fk WHERE a.id_pitch_fk = %L', v_pitch));
    v_res := v_res || pg_temp.chk('RLS evaluador ve solo su calificación', '1', pg_temp.val());
    PERFORM pg_temp.como(v_emp, format('SELECT count(*) FROM public.calificaciones_pitch c JOIN public.asignacion_evaluadores a ON a.id = c.id_asignacion_evaluador_fk WHERE a.id_pitch_fk = %L', v_pitch));
    v_res := v_res || pg_temp.chk('RLS emprendedor no ve calificaciones abiertas', '0', pg_temp.val());
    PERFORM pg_temp.como(v_ev[3], format('SELECT public.sigre_evaluador_registrar_calificacion(%L, 40, ''no_aprobado'', ''Falta validar mercado'')', v_asig[3]));
    v_res := v_res || pg_temp.chk('cerrar pitch', 'OK', pg_temp.como(v_admin, format('SELECT public.sigre_admin_cambiar_estado_pitch(%L, ''cerrado'', (SELECT updated_at FROM public.pitch WHERE id = %L))', v_pitch, v_pitch)));
    v_res := v_res || pg_temp.chk('resultado registrado', '2 de 3 evaluadores aprobaron', (SELECT resultado_general FROM public.pitch WHERE id = v_pitch));
    PERFORM pg_temp.como(v_emp, format('SELECT count(*) FROM public.calificaciones_pitch c JOIN public.asignacion_evaluadores a ON a.id = c.id_asignacion_evaluador_fk WHERE a.id_pitch_fk = %L', v_pitch));
    v_res := v_res || pg_temp.chk('RLS emprendedor ve resultados cerrados', '3', pg_temp.val());
    v_res := v_res || pg_temp.chk('calificar tras cierre', '22023', pg_temp.como(v_ev[1], format('SELECT public.sigre_evaluador_registrar_calificacion(%L, 10, ''aprobado'', NULL)', v_asig[1])));
    v_res := v_res || pg_temp.chk('reabrir pitch cerrado', '22023', pg_temp.como(v_admin, format('SELECT public.sigre_admin_cambiar_estado_pitch(%L, ''programado'', (SELECT updated_at FROM public.pitch WHERE id = %L))', v_pitch, v_pitch)));
    v_res := v_res || pg_temp.chk('inactivar evaluador libre', 'OK', pg_temp.como(v_admin, format('SELECT public.sigre_admin_cambiar_estado_evaluador(%L, ''inactivo'', (SELECT updated_at FROM public.evaluadores WHERE id = %L))', v_evid[4], v_evid[4])));
    v_res := v_res || pg_temp.chk('anónimo sin acceso', '42501', pg_temp.como(NULL, format('SELECT public.sigre_admin_guardar_reto(NULL, NULL, ''x'', NULL, 1, ''en_curso'')'), 'anon'));
    v_res := v_res || pg_temp.chk('auditoría registrada', 'true', ((SELECT count(*) FROM public.auditorias) - v_aud >= 25)::text);

    SELECT count(*) FILTER (WHERE NOT (e->>'ok')::boolean) INTO v_fallos FROM jsonb_array_elements(v_res) e;
    RAISE EXCEPTION 'RESULTADO (transaccion revertida): % fallos de % pruebas. FALLOS: % · TODAS: %', v_fallos, jsonb_array_length(v_res),
        (SELECT coalesce(jsonb_agg(e), '[]') FROM jsonb_array_elements(v_res) e WHERE NOT (e->>'ok')::boolean), v_res;
END $$;
