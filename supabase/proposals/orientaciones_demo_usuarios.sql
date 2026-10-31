-- SIGRE · DATOS DEMO PERSISTENTES (NO APLICADO) · Requiere autorización expresa antes de ejecutarse.
-- Destino exclusivo: STAGING (febelffifcqzvnttpued). Prohibido en PRODUCTION.
-- Paso previo manual (Supabase Dashboard > Authentication > Add user, "Auto Confirm User"):
--   demo.orientador@example.com    -> copiar su UUID en v_orientador
--   demo.emprendedor2@example.com  -> copiar su UUID en v_emprendedor
-- Crea solo los perfiles SIGRE (usuarios + usuario_roles) de esas dos cuentas. La ficha del segundo
-- emprendedor se crea después desde la UI ("Nuevo emprendedor"), igual que la de Laura.
-- No modifica filas existentes: compara la huella de usuarios/usuario_roles ajenos antes y después.
-- Cualquier guarda fallida aborta toda la transacción.

BEGIN;

DROP TABLE IF EXISTS _demo_informe;
CREATE TEMP TABLE _demo_informe (informe text);

DO $$
DECLARE
    -- PARÁMETROS ---------------------------------------------------------------------------------
    v_orientador  constant uuid := NULL; -- UUID Auth de demo.orientador@example.com
    v_emprendedor constant uuid := NULL; -- UUID Auth de demo.emprendedor2@example.com
    ------------------------------------------------------------------------------------------------
    v_admin  constant uuid := '0a2a7a08-7c33-49e1-bd94-d21313924231';
    v_laura  constant uuid := 'bbd440b7-717e-416c-a2e7-0a33ee1d1320';
    v_e513   constant uuid := '6bc62741-335e-4240-a6b0-416716865308';
    v_perfiles jsonb;
    v_huella_antes text;
    v_huella_despues text;
    v_filas_antes jsonb;
    v_filas_despues jsonb;
    p      jsonb;
    v_rol  public.roles%ROWTYPE;
    v_rol_emprendedor smallint;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_laura) THEN
        RAISE EXCEPTION 'ABORTADO: este proyecto no es STAGING';
    END IF;
    IF v_orientador IS NULL OR v_emprendedor IS NULL THEN
        RAISE EXCEPTION 'ABORTADO: completar los UUID Auth de las dos cuentas DEMO';
    END IF;
    IF v_orientador = v_emprendedor
       OR v_orientador IN (v_admin, v_laura, v_e513) OR v_emprendedor IN (v_admin, v_laura, v_e513) THEN
        RAISE EXCEPTION 'ABORTADO: los UUID DEMO deben ser cuentas nuevas y distintas';
    END IF;

    v_perfiles := jsonb_build_array(
        jsonb_build_object('id', v_orientador, 'correo', 'demo.orientador@example.com', 'rol', 'orientador',
                           'documento', '9000000101', 'nombre', 'DEMO-Orientador', 'apellido', 'Pruebas'),
        jsonb_build_object('id', v_emprendedor, 'correo', 'demo.emprendedor2@example.com', 'rol', 'emprendedor',
                           'documento', '9000000102', 'nombre', 'DEMO-Carlos', 'apellido', 'Pruebas'));

    IF EXISTS (SELECT 1 FROM public.usuarios WHERE id IN (v_orientador, v_emprendedor))
       OR EXISTS (SELECT 1 FROM public.usuario_roles WHERE id_usuario_fk IN (v_orientador, v_emprendedor)) THEN
        RAISE EXCEPTION 'ABORTADO: ya existe perfil o rol para alguna cuenta DEMO (no se modifica)';
    END IF;

    -- Huella de TODAS las filas ajenas a las cuentas DEMO (incluidas las de id_usuario_fk NULL).
    SELECT md5(coalesce(string_agg(x, '|' ORDER BY x), '')),
           jsonb_build_object('usuarios', count(*) FILTER (WHERE x LIKE 'u%'), 'usuario_roles', count(*) FILTER (WHERE x LIKE 'r%'))
    INTO v_huella_antes, v_filas_antes FROM (
        SELECT 'u' || to_jsonb(u)::text AS x FROM public.usuarios u
        WHERE u.id IS DISTINCT FROM v_orientador AND u.id IS DISTINCT FROM v_emprendedor
        UNION ALL
        SELECT 'r' || to_jsonb(ur)::text FROM public.usuario_roles ur
        WHERE ur.id_usuario_fk IS DISTINCT FROM v_orientador AND ur.id_usuario_fk IS DISTINCT FROM v_emprendedor
    ) t;
    IF v_filas_antes IS DISTINCT FROM jsonb_build_object(
           'usuarios', (SELECT count(*) FROM public.usuarios),
           'usuario_roles', (SELECT count(*) FROM public.usuario_roles)) THEN
        RAISE EXCEPTION 'ABORTADO: la huella no cubre todas las filas existentes (%)', v_filas_antes;
    END IF;

    FOR p IN SELECT * FROM jsonb_array_elements(v_perfiles) LOOP
        IF NOT EXISTS (SELECT 1 FROM auth.users
                       WHERE id = (p ->> 'id')::uuid AND lower(email) = p ->> 'correo' AND deleted_at IS NULL) THEN
            RAISE EXCEPTION 'ABORTADO: la cuenta Auth % / % no existe', p ->> 'id', p ->> 'correo';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM auth.users
                       WHERE id = (p ->> 'id')::uuid AND email_confirmed_at IS NOT NULL) THEN
            RAISE EXCEPTION 'ABORTADO: la cuenta % no está confirmada (usar "Auto Confirm User")', p ->> 'correo';
        END IF;
        IF EXISTS (SELECT 1 FROM public.usuarios
                   WHERE id = (p ->> 'id')::uuid OR lower(correo_electronico) = p ->> 'correo'
                      OR numero_documento = p ->> 'documento') THEN
            RAISE EXCEPTION 'ABORTADO: ya existe un perfil, correo o documento para % (no se modifica)', p ->> 'correo';
        END IF;
        IF EXISTS (SELECT 1 FROM public.usuario_roles WHERE id_usuario_fk = (p ->> 'id')::uuid) THEN
            RAISE EXCEPTION 'ABORTADO: la cuenta % tiene roles sin perfil; revisar manualmente', p ->> 'correo';
        END IF;
        IF EXISTS (SELECT 1 FROM public.emprendedores WHERE usuario_id = (p ->> 'id')::uuid) THEN
            RAISE EXCEPTION 'ABORTADO: la cuenta % ya tiene ficha de emprendedor', p ->> 'correo';
        END IF;

        IF (SELECT count(*) FROM public.roles WHERE lower(nombre_rol) = p ->> 'rol') <> 1 THEN
            RAISE EXCEPTION 'ABORTADO: se esperaba exactamente un rol "%"', p ->> 'rol';
        END IF;
        SELECT * INTO STRICT v_rol FROM public.roles WHERE lower(nombre_rol) = p ->> 'rol';
        IF v_rol.estado IS DISTINCT FROM 'activo' OR v_rol.deleted_at IS NOT NULL THEN
            RAISE EXCEPTION 'ABORTADO: el rol % (id %) está inactivo o eliminado', v_rol.nombre_rol, v_rol.id;
        END IF;
        IF p ->> 'rol' = 'emprendedor' THEN
            v_rol_emprendedor := v_rol.id;
        END IF;

        INSERT INTO public.usuarios (id, tipo_documento, numero_documento, primer_nombre, primer_apellido,
                                     correo_electronico, estado, created_at)
        VALUES ((p ->> 'id')::uuid, 'CC', p ->> 'documento', p ->> 'nombre', p ->> 'apellido',
                p ->> 'correo', 'activo', now());

        INSERT INTO public.usuario_roles (id_usuario_fk, id_rol_fk, estado)
        VALUES ((p ->> 'id')::uuid, v_rol.id, 'activo');
    END LOOP;

    -- Aceptación dentro de la transacción ----------------------------------------------------------
    SELECT md5(coalesce(string_agg(x, '|' ORDER BY x), '')),
           jsonb_build_object('usuarios', count(*) FILTER (WHERE x LIKE 'u%'), 'usuario_roles', count(*) FILTER (WHERE x LIKE 'r%'))
    INTO v_huella_despues, v_filas_despues FROM (
        SELECT 'u' || to_jsonb(u)::text AS x FROM public.usuarios u
        WHERE u.id IS DISTINCT FROM v_orientador AND u.id IS DISTINCT FROM v_emprendedor
        UNION ALL
        SELECT 'r' || to_jsonb(ur)::text FROM public.usuario_roles ur
        WHERE ur.id_usuario_fk IS DISTINCT FROM v_orientador AND ur.id_usuario_fk IS DISTINCT FROM v_emprendedor
    ) t;
    IF v_huella_despues IS DISTINCT FROM v_huella_antes OR v_filas_despues IS DISTINCT FROM v_filas_antes THEN
        RAISE EXCEPTION 'ABORTADO: cambiaron usuarios o roles existentes (antes %, después %)', v_filas_antes, v_filas_despues;
    END IF;
    IF (SELECT count(*) FROM public.usuarios) <> (v_filas_antes ->> 'usuarios')::int + 2
       OR (SELECT count(*) FROM public.usuario_roles) <> (v_filas_antes ->> 'usuario_roles')::int + 2 THEN
        RAISE EXCEPTION 'ABORTADO: se esperaban exactamente 2 usuarios y 2 roles nuevos';
    END IF;

    IF (SELECT count(*) FROM public.usuario_roles WHERE id_usuario_fk IN (v_orientador, v_emprendedor)) <> 2 THEN
        RAISE EXCEPTION 'ABORTADO: cada cuenta DEMO debe tener exactamente un rol';
    END IF;

    -- Misma regla de elegibilidad aplicada a Laura en mvp_staging_datos_demo.sql.
    IF NOT EXISTS (
        SELECT 1 FROM public.usuarios u
        WHERE u.id = v_emprendedor AND u.estado = 'activo' AND u.deleted_at IS NULL
          AND EXISTS (SELECT 1 FROM public.usuario_roles ur
                      WHERE ur.id_usuario_fk = u.id AND ur.id_rol_fk = v_rol_emprendedor
                        AND ur.estado = 'activo' AND ur.deleted_at IS NULL)
          AND NOT EXISTS (SELECT 1 FROM public.emprendedores e WHERE e.usuario_id = u.id)
    ) THEN
        RAISE EXCEPTION 'ABORTADO: DEMO-Carlos no queda elegible para "Nuevo emprendedor"';
    END IF;

    INSERT INTO _demo_informe (informe)
    SELECT jsonb_pretty(jsonb_build_object(
        'resultado', 'ACEPTADO',
        'huella_otros_usuarios_sin_cambios', true,
        'filas_ajenas_comparadas', v_filas_antes,
        'perfiles', (SELECT jsonb_agg(jsonb_build_object(
                         'id', u.id, 'correo', u.correo_electronico, 'rol', r.nombre_rol || ' (id ' || r.id || ')',
                         'estado', u.estado, 'rol_estado', ur.estado) ORDER BY r.nombre_rol DESC)
                     FROM public.usuarios u
                     JOIN public.usuario_roles ur ON ur.id_usuario_fk = u.id
                     JOIN public.roles r ON r.id = ur.id_rol_fk
                     WHERE u.id IN (v_orientador, v_emprendedor))));
END;
$$;

COMMIT;

-- Esperado: una fila con "resultado": "ACEPTADO" y dos perfiles. "No rows returned" = no se ejecutó completo.
SELECT informe FROM _demo_informe;

-- ============================== REVERSIÓN ==============================
-- Solo si aún no tienen fichas, jornadas, inscripciones ni asistencias asociadas:
-- BEGIN;
-- DELETE FROM public.usuario_roles WHERE id_usuario_fk IN ('<uuid orientador>', '<uuid emprendedor>');
-- DELETE FROM public.usuarios      WHERE id            IN ('<uuid orientador>', '<uuid emprendedor>');
-- COMMIT;
-- Después, eliminar las dos cuentas desde Authentication en el Dashboard.
