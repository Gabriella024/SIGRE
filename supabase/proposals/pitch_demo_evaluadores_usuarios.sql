-- SIGRE · DATOS DEMO PERSISTENTES · Perfiles de tres evaluadores DEMO. Requiere autorización expresa.
-- Destino exclusivo: STAGING (febelffifcqzvnttpued). Prohibido en PRODUCTION.
-- Paso previo manual (Supabase Dashboard > Authentication > Add user, "Auto Confirm User"):
--   demo.evaluador1@example.com, demo.evaluador2@example.com, demo.evaluador3@example.com
-- Mismo procedimiento que orientaciones_demo_usuarios.sql: solo crea usuarios + usuario_roles (rol evaluador).
-- El registro en "evaluadores" se hace después desde la UI (módulo Evaluadores).
-- No modifica filas existentes: compara la huella de usuarios/usuario_roles ajenos antes y después.

BEGIN;

DROP TABLE IF EXISTS _demo_informe;
CREATE TEMP TABLE _demo_informe (informe text);

DO $$
DECLARE
    v_laura  constant uuid := 'bbd440b7-717e-416c-a2e7-0a33ee1d1320';
    v_protegidos constant uuid[] := ARRAY[
        '0a2a7a08-7c33-49e1-bd94-d21313924231', -- admin
        'bbd440b7-717e-416c-a2e7-0a33ee1d1320', -- Laura
        '6bc62741-335e-4240-a6b0-416716865308', -- E513
        '26443b44-abf8-450c-aef8-0d79dbcbc21e', -- DEMO-Orientador
        '44ea681a-3679-4418-a8f1-dc5c9aeb9a5e'  -- DEMO-Carlos
    ]::uuid[];
    v_cuentas constant jsonb := jsonb_build_array(
        jsonb_build_object('correo', 'demo.evaluador1@example.com', 'documento', '9000000201', 'nombre', 'DEMO-Evaluador1'),
        jsonb_build_object('correo', 'demo.evaluador2@example.com', 'documento', '9000000202', 'nombre', 'DEMO-Evaluador2'),
        jsonb_build_object('correo', 'demo.evaluador3@example.com', 'documento', '9000000203', 'nombre', 'DEMO-Evaluador3'));
    v_ids uuid[] := ARRAY[]::uuid[];
    v_id uuid;
    v_huella_antes text;
    v_huella_despues text;
    v_filas_antes jsonb;
    v_filas_despues jsonb;
    p jsonb;
    v_rol public.roles%ROWTYPE;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_laura) THEN
        RAISE EXCEPTION 'ABORTADO: este proyecto no es STAGING';
    END IF;

    IF (SELECT count(*) FROM public.roles WHERE lower(nombre_rol) = 'evaluador') <> 1 THEN
        RAISE EXCEPTION 'ABORTADO: se esperaba exactamente un rol "evaluador"';
    END IF;
    SELECT * INTO STRICT v_rol FROM public.roles WHERE lower(nombre_rol) = 'evaluador';
    IF v_rol.estado IS DISTINCT FROM 'activo' OR v_rol.deleted_at IS NOT NULL THEN
        RAISE EXCEPTION 'ABORTADO: el rol evaluador (id %) está inactivo o eliminado', v_rol.id;
    END IF;

    FOR p IN SELECT * FROM jsonb_array_elements(v_cuentas) LOOP
        IF (SELECT count(*) FROM auth.users WHERE lower(email) = p ->> 'correo' AND deleted_at IS NULL) <> 1 THEN
            RAISE EXCEPTION 'ABORTADO: la cuenta Auth % no existe (crearla en Authentication)', p ->> 'correo';
        END IF;
        SELECT id INTO v_id FROM auth.users WHERE lower(email) = p ->> 'correo' AND deleted_at IS NULL;
        IF v_id = ANY (v_protegidos) THEN
            RAISE EXCEPTION 'ABORTADO: % corresponde a una cuenta protegida', p ->> 'correo';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_id AND email_confirmed_at IS NOT NULL) THEN
            RAISE EXCEPTION 'ABORTADO: la cuenta % no está confirmada (usar "Auto Confirm User")', p ->> 'correo';
        END IF;
        IF EXISTS (SELECT 1 FROM public.usuarios
                   WHERE id = v_id OR lower(correo_electronico) = p ->> 'correo' OR numero_documento = p ->> 'documento')
           OR EXISTS (SELECT 1 FROM public.usuario_roles WHERE id_usuario_fk = v_id)
           OR EXISTS (SELECT 1 FROM public.evaluadores WHERE id_usuario_fk = v_id)
           OR EXISTS (SELECT 1 FROM public.emprendedores WHERE usuario_id = v_id) THEN
            RAISE EXCEPTION 'ABORTADO: ya existe perfil, rol, evaluador o ficha para % (no se modifica)', p ->> 'correo';
        END IF;
        v_ids := v_ids || v_id;
    END LOOP;

    SELECT md5(coalesce(string_agg(x, '|' ORDER BY x), '')),
           jsonb_build_object('usuarios', count(*) FILTER (WHERE x LIKE 'u%'), 'usuario_roles', count(*) FILTER (WHERE x LIKE 'r%'))
    INTO v_huella_antes, v_filas_antes FROM (
        SELECT 'u' || to_jsonb(u)::text AS x FROM public.usuarios u WHERE NOT (u.id = ANY (v_ids))
        UNION ALL
        SELECT 'r' || to_jsonb(ur)::text FROM public.usuario_roles ur
        WHERE ur.id_usuario_fk IS NULL OR NOT (ur.id_usuario_fk = ANY (v_ids))
    ) t;

    FOR i IN 1..3 LOOP
        p := v_cuentas -> (i - 1);
        INSERT INTO public.usuarios (id, tipo_documento, numero_documento, primer_nombre, primer_apellido,
                                     correo_electronico, estado, created_at, updated_at)
        VALUES (v_ids[i], 'CC', p ->> 'documento', p ->> 'nombre', 'Pruebas', p ->> 'correo', 'activo', now(), now());
        INSERT INTO public.usuario_roles (id_usuario_fk, id_rol_fk, estado)
        VALUES (v_ids[i], v_rol.id, 'activo');
    END LOOP;

    SELECT md5(coalesce(string_agg(x, '|' ORDER BY x), '')),
           jsonb_build_object('usuarios', count(*) FILTER (WHERE x LIKE 'u%'), 'usuario_roles', count(*) FILTER (WHERE x LIKE 'r%'))
    INTO v_huella_despues, v_filas_despues FROM (
        SELECT 'u' || to_jsonb(u)::text AS x FROM public.usuarios u WHERE NOT (u.id = ANY (v_ids))
        UNION ALL
        SELECT 'r' || to_jsonb(ur)::text FROM public.usuario_roles ur
        WHERE ur.id_usuario_fk IS NULL OR NOT (ur.id_usuario_fk = ANY (v_ids))
    ) t;
    IF v_huella_despues IS DISTINCT FROM v_huella_antes THEN
        RAISE EXCEPTION 'ABORTADO: cambiaron usuarios o roles existentes';
    END IF;
    IF (SELECT count(*) FROM public.usuario_roles WHERE id_usuario_fk = ANY (v_ids) AND id_rol_fk = v_rol.id) <> 3
       OR (SELECT count(*) FROM public.usuario_roles WHERE id_usuario_fk = ANY (v_ids)) <> 3 THEN
        RAISE EXCEPTION 'ABORTADO: cada evaluador DEMO debe tener exactamente el rol evaluador';
    END IF;

    INSERT INTO _demo_informe (informe)
    SELECT jsonb_pretty(jsonb_build_object(
        'resultado', 'ACEPTADO',
        'huella_otros_usuarios_sin_cambios', true,
        'filas_ajenas_comparadas', v_filas_antes,
        'perfiles', (SELECT jsonb_agg(jsonb_build_object('id', u.id, 'correo', u.correo_electronico,
                                                         'rol', r.nombre_rol || ' (id ' || r.id || ')') ORDER BY u.correo_electronico)
                     FROM public.usuarios u
                     JOIN public.usuario_roles ur ON ur.id_usuario_fk = u.id
                     JOIN public.roles r ON r.id = ur.id_rol_fk
                     WHERE u.id = ANY (v_ids))));
END;
$$;

COMMIT;

-- Esperado: "resultado": "ACEPTADO" con tres perfiles. "No rows returned" = no se ejecutó completo.
SELECT informe FROM _demo_informe;

-- ============================== REVERSIÓN ==============================
-- Solo antes de registrarlos en "evaluadores":
-- BEGIN;
-- DELETE FROM public.usuario_roles WHERE id_usuario_fk IN (SELECT id FROM public.usuarios WHERE correo_electronico LIKE 'demo.evaluador_@example.com');
-- DELETE FROM public.usuarios WHERE correo_electronico LIKE 'demo.evaluador_@example.com';
-- COMMIT;
