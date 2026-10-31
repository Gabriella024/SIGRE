-- SIGRE · Orientaciones · Diagnóstico RLS de orientacion_inscripciones y asistencias (SOLO LECTURA)
-- Destino: STAGING (febelffifcqzvnttpued). Prohibido en PRODUCTION.
-- El SQL Editor solo muestra el resultado de la última sentencia ejecutada, por eso hay tres partes:
--   PARTE A: seleccionar y ejecutar solo la PARTE A -> devuelve una fila con el informe JSON.
--   PARTE B: seleccionar y ejecutar solo la PARTE B -> termina SIEMPRE con un ERROR cuyo texto es el
--            resultado. El error aborta la transacción, así que el cambio de rol y los claims simulados
--            se descartan. La parte B no contiene INSERT, UPDATE, DELETE ni DDL.
--   PARTE C: ejecutar sola después de la B -> confirma sesión restaurada y datos sin cambios.

-- ============================== PARTE A ==============================
SELECT jsonb_pretty(jsonb_build_object(
    'rls', (SELECT jsonb_object_agg(c.relname, jsonb_build_object(
                'activo', c.relrowsecurity, 'forzado', c.relforcerowsecurity))
            FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public'
              AND c.relname IN ('orientaciones', 'orientacion_inscripciones', 'asistencias', 'emprendedores',
                                'usuario_roles', 'roles', 'usuarios')),
    'politicas', (SELECT jsonb_agg(jsonb_build_object(
                      'tabla', tablename, 'nombre', policyname, 'cmd', cmd, 'permisiva', permissive,
                      'roles', roles, 'using', qual, 'with_check', with_check)
                      ORDER BY tablename, cmd, policyname)
                  FROM pg_policies
                  WHERE schemaname = 'public'
                    AND tablename IN ('orientaciones', 'orientacion_inscripciones', 'asistencias',
                                      'emprendedores', 'usuario_roles', 'roles')),
    'grants', (SELECT jsonb_agg(jsonb_build_object('tabla', t.tabla, 'rol', r.rol,
                   'select', has_table_privilege(r.rol, 'public.' || t.tabla, 'SELECT'),
                   'insert', has_table_privilege(r.rol, 'public.' || t.tabla, 'INSERT'),
                   'update', has_table_privilege(r.rol, 'public.' || t.tabla, 'UPDATE'),
                   'delete', has_table_privilege(r.rol, 'public.' || t.tabla, 'DELETE')))
               FROM (VALUES ('orientacion_inscripciones'), ('asistencias'), ('orientaciones')) t(tabla)
               CROSS JOIN (VALUES ('anon'), ('authenticated')) r(rol)),
    'funciones_en_politicas', (
        WITH expr AS (
            SELECT coalesce(qual, '') || ' ' || coalesce(with_check, '') AS texto
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename IN ('orientaciones', 'orientacion_inscripciones', 'asistencias')
        ), nombres AS (
            SELECT DISTINCT (regexp_matches(texto, '([a-z_][a-z0-9_]*)\(', 'g'))[1] AS nombre FROM expr
        )
        SELECT jsonb_agg(jsonb_build_object(
                   'firma', p.oid::regprocedure::text, 'security_definer', p.prosecdef,
                   'config', p.proconfig, 'definicion', pg_get_functiondef(p.oid)))
        FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace JOIN nombres x ON x.nombre = p.proname
        WHERE n.nspname = 'public' AND p.prokind = 'f'),
    'rpc_modulo', (SELECT jsonb_agg(jsonb_build_object(
                       'firma', p.oid::regprocedure::text, 'security_definer', p.prosecdef,
                       'config', p.proconfig, 'permisos', p.proacl::text,
                       'definicion', pg_get_functiondef(p.oid)))
                   FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                   WHERE n.nspname = 'public'
                     AND p.proname IN ('sigre_listar_inscritos_asistencia', 'sigre_inscribir_en_jornada',
                                       'sigre_registrar_asistencia')),
    'triggers', (SELECT jsonb_agg(jsonb_build_object('tabla', c.relname, 'trigger', t.tgname,
                     'definicion', pg_get_triggerdef(t.oid)))
                 FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
                 JOIN pg_namespace n ON n.oid = c.relnamespace
                 WHERE n.nspname = 'public' AND NOT t.tgisinternal
                   AND c.relname IN ('orientacion_inscripciones', 'asistencias', 'orientaciones')),
    'columnas_horario', (SELECT jsonb_object_agg(column_name, data_type)
                         FROM information_schema.columns
                         WHERE table_schema = 'public' AND table_name = 'orientaciones'
                           AND column_name IN ('fecha', 'hora_inicio', 'hora_fin')),
    'zona_servidor', current_setting('TimeZone'),
    'demo', jsonb_build_object(
        'inscripciones', (SELECT jsonb_agg(to_jsonb(i)) FROM public.orientacion_inscripciones i
                          WHERE i.id_orientacion_fk = 'e2997c86-64c4-45ae-8046-ce3cd622e13e'),
        'asistencias', (SELECT jsonb_agg(to_jsonb(a)) FROM public.asistencias a
                        WHERE a.id_orientacion_fk = 'e2997c86-64c4-45ae-8046-ce3cd622e13e'))
)) AS informe;

-- ============================== PARTE B ==============================
-- Requiere las políticas sigre_inscripciones_select_* instaladas. Solo lectura: sin INSERT/UPDATE/DELETE/DDL.
-- Simulación: set_config('role', r, true) es SET LOCAL ROLE; PostgreSQL lo admite en un bloque DO (solo lo prohíbe
-- en funciones SECURITY DEFINER) si session_user es miembro de anon/authenticated. Los claims se fijan como PostgREST:
-- request.jwt.claims (sub, role, aud) y request.jwt.claim.sub/role, que leen auth.uid() y auth.role().
-- Cada usuario y cada consulta corren en su propio subbloque: un error de permisos o de tipos queda registrado en su
-- campo y no oculta el resto. No invoca RPC del módulo; solo SELECT sobre tablas y funciones de lectura del sistema
-- (set_config/current_setting, auth.uid/auth.role, pg_has_role, has_table_privilege, md5, jsonb_*).
-- Informe:
--   dependencias            -> RLS, políticas de lectura y GRANT de las tablas que consultan las políticas.
--   funciones_en_politicas  -> funciones no nativas que las políticas de lectura de esas tablas ejecutan implícitamente
--                              (volatilidad 'v' = puede tener efectos; el XID de "reversion" detectaría cualquier escritura).
--   usuarios[].efectivo_rls -> RESULTADO DE LA PRUEBA: lo que el usuario ve realmente bajo RLS (ids y conteos), más
--                              la visibilidad de sus filas en usuarios, usuario_roles, roles, emprendedores y orientaciones.
--   usuarios[].regla_negocio-> ids que la regla de negocio le asigna, calculados como propietario. Solo es una
--                              referencia para comparar; no prueba la RLS.
--   reversion               -> rol y claims restaurados, huella de datos sin cambios y ningún XID asignado.
-- Termina SIEMPRE con ERROR "RESULTADO ...": la transacción se aborta y no persiste nada.
DO $$
DECLARE
    v_jornada           constant uuid := 'e2997c86-64c4-45ae-8046-ce3cd622e13e';
    v_orientador_demo   constant uuid := NULL; -- demo.orientador@example.com
    v_emprendedor2_demo constant uuid := NULL; -- demo.emprendedor2@example.com
    v_evaluador_demo    constant uuid := NULL; -- opcional: usuario DEMO con rol evaluador
    v_nombres constant text[] := ARRAY['admin', 'laura', 'e513', 'sin_perfil', 'anon',
                                       'orientador_demo', 'emprendedor2_demo', 'evaluador_demo'];
    v_uids constant uuid[] := ARRAY['0a2a7a08-7c33-49e1-bd94-d21313924231', 'bbd440b7-717e-416c-a2e7-0a33ee1d1320',
                                    '6bc62741-335e-4240-a6b0-416716865308', gen_random_uuid(), NULL,
                                    v_orientador_demo, v_emprendedor2_demo, v_evaluador_demo]::uuid[];
    v_consultas constant text[] := ARRAY[
        ['inscripciones', $q$SELECT jsonb_build_object(
                                 'n', count(*),
                                 'ids', coalesce(jsonb_agg(id ORDER BY id), '[]'),
                                 'ids_jornada_demo', coalesce(jsonb_agg(id ORDER BY id) FILTER (WHERE id_orientacion_fk = $1), '[]'))
                             FROM public.orientacion_inscripciones $q$],
        ['dep_usuarios_fila_propia', $q$SELECT to_jsonb(count(*)) FROM public.usuarios WHERE id = $2 $q$],
        ['dep_usuario_roles_propios', $q$SELECT coalesce(jsonb_agg(jsonb_build_object('id_rol', id_rol_fk, 'estado', estado)
                                                                 ORDER BY id_rol_fk), '[]')
                                         FROM public.usuario_roles WHERE id_usuario_fk = $2 $q$],
        ['dep_roles_visibles', $q$SELECT coalesce(jsonb_agg(lower(nombre_rol) ORDER BY id), '[]') FROM public.roles $q$],
        ['dep_ficha_emprendedor_propia', $q$SELECT coalesce(jsonb_agg(id ORDER BY id), '[]')
                                            FROM public.emprendedores WHERE usuario_id = $2 $q$],
        ['dep_jornada_demo_visible', $q$SELECT to_jsonb(count(*) > 0) FROM public.orientaciones WHERE id = $1 $q$],
        ['info_asistencias_visibles', $q$SELECT to_jsonb(count(*)) FROM public.asistencias $q$]];
    v_huella_sql constant text := $q$SELECT jsonb_build_object(
        'orientacion_inscripciones', (SELECT md5(coalesce(string_agg(to_jsonb(t)::text, '|' ORDER BY t.id::text), '')) FROM public.orientacion_inscripciones t),
        'asistencias',               (SELECT md5(coalesce(string_agg(to_jsonb(t)::text, '|' ORDER BY t.id::text), '')) FROM public.asistencias t),
        'orientaciones',             (SELECT md5(coalesce(string_agg(to_jsonb(t)::text, '|' ORDER BY t.id::text), '')) FROM public.orientaciones t),
        'emprendedores',             (SELECT md5(coalesce(string_agg(to_jsonb(t)::text, '|' ORDER BY t.id::text), '')) FROM public.emprendedores t),
        'usuarios',                  (SELECT md5(coalesce(string_agg(to_jsonb(t)::text, '|' ORDER BY t.id::text), '')) FROM public.usuarios t),
        'usuario_roles',             (SELECT md5(coalesce(string_agg(to_jsonb(t)::text, '|' ORDER BY t.id::text), '')) FROM public.usuario_roles t),
        'roles',                     (SELECT md5(coalesce(string_agg(to_jsonb(t)::text, '|' ORDER BY t.id::text), '')) FROM public.roles t)) $q$;
    v_role0       constant text := current_setting('role');
    v_claims0     constant text := coalesce(current_setting('request.jwt.claims', true), '');
    v_claim_sub0  constant text := coalesce(current_setting('request.jwt.claim.sub', true), '');
    v_claim_role0 constant text := coalesce(current_setting('request.jwt.claim.role', true), '');
    v_rls0        constant text := current_setting('row_security');
    v_usuario0    constant text := current_user;
    v_nombre      text;
    v_uid         uuid;
    v_rol         text;
    v_roles       text[];
    v_val         jsonb;
    v_ctx         jsonb;
    v_ctx_ok      boolean;
    v_efectivo    jsonb;
    v_regla       jsonb;
    v_perfil      jsonb;
    v_sim_error   text;
    v_coincide    boolean;
    v_solo_rls    jsonb;
    v_solo_regla  jsonb;
    v_politicas   int;
    v_simulacion  jsonb;
    v_dependencias jsonb;
    v_funciones   jsonb;
    v_huella0     jsonb;
    v_huella1     jsonb;
    v_reversion   jsonb;
    v_fatal       text;
    v_usuarios    jsonb := '[]'::jsonb;
    v_ctx_todos   boolean := true;
    v_coinc_todos boolean := true;
    v_sin_cambios boolean;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = 'bbd440b7-717e-416c-a2e7-0a33ee1d1320') THEN
        RAISE EXCEPTION 'ABORTADO: este proyecto no es STAGING';
    END IF;

    BEGIN
        IF NOT EXISTS (SELECT 1 FROM public.orientaciones WHERE id = v_jornada AND deleted_at IS NULL) THEN
            RAISE EXCEPTION 'no existe la jornada DEMO %', v_jornada;
        END IF;
        EXECUTE v_huella_sql INTO v_huella0;

        SELECT count(*) INTO v_politicas FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'orientacion_inscripciones'
          AND policyname IN ('sigre_inscripciones_select_admin', 'sigre_inscripciones_select_orientador',
                             'sigre_inscripciones_select_propias');

        v_simulacion := jsonb_build_object(
            'session_user', session_user, 'current_user', current_user,
            'session_user_bypassrls', (SELECT rolbypassrls FROM pg_roles WHERE rolname = session_user),
            'miembro_de_authenticated', pg_has_role(session_user, 'authenticated', 'MEMBER'),
            'miembro_de_anon', pg_has_role(session_user, 'anon', 'MEMBER'));

        SELECT jsonb_agg(jsonb_build_object(
                   'tabla', c.relname, 'rls', c.relrowsecurity, 'forzado', c.relforcerowsecurity,
                   'politicas_lectura', (SELECT coalesce(jsonb_agg(p.policyname || ' (' || p.permissive || ', '
                                                                   || array_to_string(p.roles, ',') || ')'
                                                                   ORDER BY p.policyname), '[]')
                                         FROM pg_policies p
                                         WHERE p.schemaname = 'public' AND p.tablename = c.relname
                                           AND p.cmd IN ('SELECT', 'ALL')),
                   'select_authenticated', has_table_privilege('authenticated', c.oid, 'SELECT'),
                   'select_anon', has_table_privilege('anon', c.oid, 'SELECT'))
               ORDER BY c.relname)
        INTO v_dependencias
        FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relname IN ('orientacion_inscripciones', 'usuarios', 'roles', 'usuario_roles', 'orientaciones',
                            'emprendedores', 'asistencias');

        SELECT coalesce(jsonb_agg(DISTINCT jsonb_build_object(
                   'funcion', p.oid::regprocedure::text, 'volatilidad', p.provolatile::text,
                   'security_definer', p.prosecdef)), '[]')
        INTO v_funciones
        FROM pg_policies pol
        CROSS JOIN LATERAL regexp_matches(coalesce(pol.qual, '') || ' ' || coalesce(pol.with_check, ''),
                                          '([a-z_][a-z0-9_]*)\(', 'g') m
        JOIN pg_proc p ON p.proname = m[1]
        JOIN pg_namespace pn ON pn.oid = p.pronamespace AND pn.nspname <> 'pg_catalog'
        WHERE pol.schemaname = 'public' AND pol.cmd IN ('SELECT', 'ALL')
          AND pol.tablename IN ('orientacion_inscripciones', 'usuarios', 'roles', 'usuario_roles', 'orientaciones',
                                'emprendedores', 'asistencias');

        PERFORM set_config('row_security', 'on', true);

        FOR k IN 1 .. array_length(v_nombres, 1) LOOP
            v_nombre := v_nombres[k];
            v_uid := v_uids[k];
            CONTINUE WHEN v_uid IS NULL AND v_nombre <> 'anon';
            v_rol := CASE WHEN v_nombre = 'anon' THEN 'anon' ELSE 'authenticated' END;
            v_regla := NULL; v_perfil := NULL; v_ctx := NULL; v_ctx_ok := false; v_sim_error := NULL;
            v_coincide := NULL; v_solo_rls := NULL; v_solo_regla := NULL;
            v_efectivo := '{}'::jsonb;

            -- Referencia de negocio, como propietario
            BEGIN
                SELECT coalesce(array_agg(DISTINCT lower(r.nombre_rol)), '{}') INTO v_roles
                FROM public.usuario_roles ur
                JOIN public.roles r ON r.id = ur.id_rol_fk
                JOIN public.usuarios u ON u.id = ur.id_usuario_fk
                WHERE ur.id_usuario_fk = v_uid
                  AND ur.estado = 'activo' AND ur.deleted_at IS NULL
                  AND r.estado = 'activo' AND r.deleted_at IS NULL
                  AND u.estado = 'activo' AND u.deleted_at IS NULL;

                SELECT coalesce(jsonb_agg(oi.id ORDER BY oi.id), '[]') INTO v_regla
                FROM public.orientacion_inscripciones oi
                WHERE oi.deleted_at IS NULL
                  AND ('administrador' = ANY (v_roles)
                       OR ('orientador' = ANY (v_roles)
                           AND EXISTS (SELECT 1 FROM public.orientaciones o
                                       WHERE o.id = oi.id_orientacion_fk AND o.id_orientador_fk = v_uid
                                         AND o.deleted_at IS NULL))
                       OR EXISTS (SELECT 1 FROM public.emprendedores e JOIN public.usuarios u ON u.id = e.usuario_id
                                  WHERE e.id = oi.id_emprendedor_fk AND e.usuario_id = v_uid AND e.deleted_at IS NULL
                                    AND u.estado = 'activo' AND u.deleted_at IS NULL));

                v_perfil := jsonb_build_object(
                    'existe_en_auth', EXISTS (SELECT 1 FROM auth.users WHERE id = v_uid),
                    'usuario_activo', EXISTS (SELECT 1 FROM public.usuarios
                                              WHERE id = v_uid AND estado = 'activo' AND deleted_at IS NULL),
                    'roles_activos', to_jsonb(v_roles),
                    'ficha_emprendedor', EXISTS (SELECT 1 FROM public.emprendedores
                                                 WHERE usuario_id = v_uid AND deleted_at IS NULL));
            EXCEPTION WHEN OTHERS THEN
                v_regla := to_jsonb('ERROR ' || SQLSTATE || ': ' || SQLERRM);
            END;

            -- Simulación bajo RLS; si este subbloque falla, su rollback restaura rol y claims
            BEGIN
                PERFORM set_config('role', v_rol, true);
                PERFORM set_config('request.jwt.claim.role', v_rol, true);
                PERFORM set_config('request.jwt.claim.sub', coalesce(v_uid::text, ''), true);
                PERFORM set_config('request.jwt.claims', jsonb_strip_nulls(jsonb_build_object(
                    'sub', v_uid, 'role', v_rol,
                    'aud', CASE WHEN v_rol = 'authenticated' THEN 'authenticated' END))::text, true);

                BEGIN
                    v_ctx := jsonb_build_object(
                        'current_user', current_user, 'auth_uid', auth.uid(), 'auth_role', auth.role(),
                        'bypassrls', (SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user),
                        'row_security', current_setting('row_security'));
                    v_ctx_ok := coalesce(v_ctx ->> 'current_user' = v_rol
                        AND (v_ctx ->> 'auth_uid') IS NOT DISTINCT FROM v_uid::text
                        AND v_ctx ->> 'auth_role' = v_rol
                        AND v_ctx ->> 'bypassrls' = 'false'
                        AND v_ctx ->> 'row_security' = 'on', false);
                EXCEPTION WHEN OTHERS THEN
                    v_ctx := jsonb_build_object('error', SQLSTATE || ': ' || SQLERRM);
                    v_ctx_ok := false;
                END;

                FOR q IN 1 .. array_length(v_consultas, 1) LOOP
                    BEGIN
                        EXECUTE v_consultas[q][2] INTO v_val USING v_jornada, v_uid;
                    EXCEPTION WHEN OTHERS THEN
                        v_val := to_jsonb('ERROR ' || SQLSTATE || ': ' || SQLERRM);
                    END;
                    v_efectivo := v_efectivo || jsonb_build_object(v_consultas[q][1], v_val);
                END LOOP;

                PERFORM set_config('role', v_role0, true);
                PERFORM set_config('request.jwt.claims', v_claims0, true);
                PERFORM set_config('request.jwt.claim.sub', v_claim_sub0, true);
                PERFORM set_config('request.jwt.claim.role', v_claim_role0, true);
            EXCEPTION WHEN OTHERS THEN
                v_sim_error := SQLSTATE || ': ' || SQLERRM;
                v_ctx_ok := false;
            END;

            -- Comparación efectivo vs. referencia, como propietario
            BEGIN
                IF jsonb_typeof(v_efectivo #> '{inscripciones,ids}') = 'array' AND jsonb_typeof(v_regla) = 'array' THEN
                    v_coincide := v_efectivo #> '{inscripciones,ids}' = v_regla;
                    SELECT coalesce(jsonb_agg(x), '[]') INTO v_solo_rls
                    FROM jsonb_array_elements(v_efectivo #> '{inscripciones,ids}') x WHERE NOT v_regla @> jsonb_build_array(x);
                    SELECT coalesce(jsonb_agg(x), '[]') INTO v_solo_regla
                    FROM jsonb_array_elements(v_regla) x WHERE NOT (v_efectivo #> '{inscripciones,ids}') @> jsonb_build_array(x);
                END IF;
            EXCEPTION WHEN OTHERS THEN
                v_coincide := NULL;
            END;

            v_ctx_todos := v_ctx_todos AND v_ctx_ok;
            v_coinc_todos := v_coinc_todos AND coalesce(v_coincide, false);
            v_usuarios := v_usuarios || jsonb_build_array(jsonb_build_object(
                'usuario', v_nombre, 'uid', v_uid, 'rol_simulado', v_rol,
                'contexto_ok', v_ctx_ok, 'contexto', v_ctx, 'error_simulacion', v_sim_error,
                'efectivo_rls', v_efectivo,
                'regla_negocio', jsonb_build_object('ids', v_regla, 'perfil', v_perfil),
                'coincide_con_regla', v_coincide, 'solo_en_rls', v_solo_rls, 'solo_en_regla', v_solo_regla));
        END LOOP;

        PERFORM set_config('row_security', v_rls0, true);
        EXECUTE v_huella_sql INTO v_huella1;
    EXCEPTION WHEN OTHERS THEN
        v_fatal := SQLSTATE || ': ' || SQLERRM;
    END;

    v_sin_cambios := v_huella0 IS NOT NULL AND v_huella0 = v_huella1 AND pg_current_xact_id_if_assigned() IS NULL;
    v_reversion := jsonb_build_object(
        'current_user', current_user,
        'rol_restaurado', current_user = v_usuario0 AND current_setting('role') = v_role0,
        'claims_restaurados', coalesce(current_setting('request.jwt.claims', true), '') = v_claims0
                              AND coalesce(current_setting('request.jwt.claim.sub', true), '') = v_claim_sub0
                              AND coalesce(current_setting('request.jwt.claim.role', true), '') = v_claim_role0,
        'xid_asignado', pg_current_xact_id_if_assigned()::text,
        'huella_inicio', v_huella0,
        'huella_igual_al_final', v_huella0 = v_huella1);

    RAISE EXCEPTION 'RESULTADO contexto_ok=% coincide_regla=% sin_cambios=% politicas=%/3 error_fatal=% (transaccion abortada, nada persiste): %',
        v_ctx_todos, v_coinc_todos, v_sin_cambios, v_politicas, coalesce(v_fatal, 'ninguno'),
        json_build_object('politicas_inscripciones', v_politicas, 'simulacion', v_simulacion,
                          'dependencias', v_dependencias, 'funciones_en_politicas', v_funciones,
                          'usuarios', v_usuarios,
                          'reversion', v_reversion, 'error_fatal', v_fatal)::text;
END;
$$;

-- ============================== PARTE C ==============================
-- Ejecutar sola, DESPUÉS de la PARTE B. Solo lectura. Confirma que la sesión no conserva el rol ni los claims y que
-- la huella de datos es igual a "reversion.huella_inicio" de la PARTE B (usuarios puede variar si alguien inició sesión
-- entre ambas ejecuciones, porque se actualiza ultimo_acceso).
SELECT jsonb_pretty(jsonb_build_object(
    'current_user', current_user,
    'role', current_setting('role'),
    'request_jwt_claims', coalesce(current_setting('request.jwt.claims', true), ''),
    'request_jwt_claim_sub', coalesce(current_setting('request.jwt.claim.sub', true), ''),
    'auth_uid', auth.uid(),
    'huella', jsonb_build_object(
        'orientacion_inscripciones', (SELECT md5(coalesce(string_agg(to_jsonb(t)::text, '|' ORDER BY t.id::text), '')) FROM public.orientacion_inscripciones t),
        'asistencias',               (SELECT md5(coalesce(string_agg(to_jsonb(t)::text, '|' ORDER BY t.id::text), '')) FROM public.asistencias t),
        'orientaciones',             (SELECT md5(coalesce(string_agg(to_jsonb(t)::text, '|' ORDER BY t.id::text), '')) FROM public.orientaciones t),
        'emprendedores',             (SELECT md5(coalesce(string_agg(to_jsonb(t)::text, '|' ORDER BY t.id::text), '')) FROM public.emprendedores t),
        'usuarios',                  (SELECT md5(coalesce(string_agg(to_jsonb(t)::text, '|' ORDER BY t.id::text), '')) FROM public.usuarios t),
        'usuario_roles',             (SELECT md5(coalesce(string_agg(to_jsonb(t)::text, '|' ORDER BY t.id::text), '')) FROM public.usuario_roles t),
        'roles',                     (SELECT md5(coalesce(string_agg(to_jsonb(t)::text, '|' ORDER BY t.id::text), '')) FROM public.roles t))
)) AS verificacion_posterior;
