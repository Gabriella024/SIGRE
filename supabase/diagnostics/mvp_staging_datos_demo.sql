-- SIGRE MVP - Ejecucion unica en STAGING (febelffifcqzvnttpued). PROHIBIDO en PRODUCTION (nattebsxchioqkrsaxxr).
-- 1) Catalogo minimo: regional DEMO-ATL y centro SENA DEMO-CCS activos.
-- 2) Perfil SIGRE + rol emprendedor para la cuenta Auth sigre-test3-emprendedor@gmail.com.
-- 3) Validacion de aceptacion e informe calculados ANTES del COMMIT.
-- No modifica ni reactiva registros existentes. No toca auth.users, RLS ni A5.
-- Cualquier validacion fallida aborta la transaccion completa sin escribir nada.
-- Guarda de entorno: la cuenta Auth bbd440b7-... solo existe en STAGING; en otro proyecto el script aborta.

BEGIN;

CREATE TEMP TABLE _mvp ON COMMIT DROP AS
SELECT
    'bbd440b7-717e-416c-a2e7-0a33ee1d1320'::uuid AS auth_id,
    'sigre-test3-emprendedor@gmail.com'::text     AS correo,
    'CC'::text                                    AS tipo_documento,   -- mismo valor del ensayo
    '9000000003'::text                            AS numero_documento, -- mismo valor del ensayo
    'Laura'::text                                 AS primer_nombre,
    'Pérez'::text                                 AS primer_apellido,
    'DEMO-ATL'::text                              AS regional_codigo,
    'Regional Atlántico'::text                    AS regional_nombre,
    'DEMO-CCS'::text                              AS centro_codigo,
    'Centro de Comercio y Servicios'::text        AS centro_nombre;

DROP TABLE IF EXISTS _mvp_informe;
CREATE TEMP TABLE _mvp_informe (informe text);

DO $$
DECLARE
    p          _mvp%ROWTYPE;
    v_rol      public.roles%ROWTYPE;
    v_regional public.sena_regionales%ROWTYPE;
    v_centro   public.sena_centros%ROWTYPE;
    v_perfil   public.usuarios%ROWTYPE;
BEGIN
    SELECT * INTO STRICT p FROM _mvp;

    -- Guarda de entorno y cuenta Auth (solo lectura).
    IF NOT EXISTS (SELECT 1 FROM auth.users
                   WHERE id = p.auth_id AND lower(email) = lower(p.correo) AND deleted_at IS NULL) THEN
        RAISE EXCEPTION 'ABORTADO: la cuenta Auth % / % no existe en este proyecto (no es STAGING o fue eliminada)',
            p.auth_id, p.correo;
    END IF;

    -- Rol emprendedor resuelto dinamicamente; debe existir una sola fila activa y vigente.
    IF (SELECT count(*) FROM public.roles WHERE lower(nombre_rol) = 'emprendedor') <> 1 THEN
        RAISE EXCEPTION 'ABORTADO: se esperaba exactamente un rol "emprendedor" en public.roles';
    END IF;
    SELECT * INTO STRICT v_rol FROM public.roles WHERE lower(nombre_rol) = 'emprendedor';
    IF v_rol.estado IS DISTINCT FROM 'activo' OR v_rol.deleted_at IS NOT NULL THEN
        RAISE EXCEPTION 'ABORTADO: el rol emprendedor (id %) esta inactivo o eliminado; no se duplica ni se reactiva',
            v_rol.id;
    END IF;

    IF (SELECT count(*) FROM public.sena_regionales WHERE codigo = p.regional_codigo) > 1
       OR (SELECT count(*) FROM public.sena_centros WHERE codigo = p.centro_codigo) > 1 THEN
        RAISE EXCEPTION 'ABORTADO: codigos % o % duplicados en el catalogo', p.regional_codigo, p.centro_codigo;
    END IF;

    -- 1. Regional DEMO-ATL.
    SELECT * INTO v_regional FROM public.sena_regionales WHERE codigo = p.regional_codigo;
    IF FOUND THEN
        IF v_regional.estado IS DISTINCT FROM 'activo' OR v_regional.deleted_at IS NOT NULL THEN
            RAISE EXCEPTION 'ABORTADO: la regional % existe pero no esta activa; no se modifica', p.regional_codigo;
        END IF;
    ELSE
        INSERT INTO public.sena_regionales (codigo, nombre, estado, created_at)
        VALUES (p.regional_codigo, p.regional_nombre, 'activo', now())
        RETURNING * INTO v_regional;
    END IF;

    -- 1. Centro DEMO-CCS.
    SELECT * INTO v_centro FROM public.sena_centros WHERE codigo = p.centro_codigo;
    IF FOUND THEN
        IF v_centro.estado IS DISTINCT FROM 'activo' OR v_centro.deleted_at IS NOT NULL THEN
            RAISE EXCEPTION 'ABORTADO: el centro % existe pero no esta activo; no se modifica', p.centro_codigo;
        END IF;
        IF v_centro.id_regional_fk IS DISTINCT FROM v_regional.id THEN
            RAISE EXCEPTION 'ABORTADO: el centro % existe pero no esta vinculado a la regional %; no se modifica',
                p.centro_codigo, p.regional_codigo;
        END IF;
    ELSE
        INSERT INTO public.sena_centros (id_regional_fk, codigo, nombre, estado, created_at)
        VALUES (v_regional.id, p.centro_codigo, p.centro_nombre, 'activo', now())
        RETURNING * INTO v_centro;
    END IF;

    -- 2. Restricciones comunes: sin ficha previa y sin roles distintos de emprendedor (en cualquier estado).
    IF EXISTS (SELECT 1 FROM public.emprendedores WHERE usuario_id = p.auth_id) THEN
        RAISE EXCEPTION 'ABORTADO: la cuenta ya tiene una ficha en emprendedores (incluidas eliminadas)';
    END IF;
    IF EXISTS (SELECT 1 FROM public.usuario_roles WHERE id_usuario_fk = p.auth_id AND id_rol_fk <> v_rol.id) THEN
        RAISE EXCEPTION 'ABORTADO: la cuenta tiene roles distintos de emprendedor';
    END IF;

    -- 2. Perfil existente: solo se valida, nunca se modifica ni reactiva.
    SELECT * INTO v_perfil FROM public.usuarios WHERE id = p.auth_id;
    IF FOUND THEN
        IF lower(v_perfil.correo_electronico) <> lower(p.correo) THEN
            RAISE EXCEPTION 'ABORTADO: el perfil existente tiene otro correo';
        END IF;
        IF v_perfil.estado IS DISTINCT FROM 'activo' OR v_perfil.deleted_at IS NOT NULL THEN
            RAISE EXCEPTION 'ABORTADO: el perfil existente no esta activo; no se reactiva';
        END IF;
        IF v_perfil.numero_documento IS DISTINCT FROM p.numero_documento
           OR v_perfil.tipo_documento IS DISTINCT FROM p.tipo_documento THEN
            RAISE EXCEPTION 'ABORTADO: el perfil existente tiene otro documento (% %)',
                v_perfil.tipo_documento, v_perfil.numero_documento;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM public.usuario_roles
                       WHERE id_usuario_fk = p.auth_id AND id_rol_fk = v_rol.id
                         AND estado = 'activo' AND deleted_at IS NULL) THEN
            RAISE EXCEPTION 'ABORTADO: el perfil existe pero sin rol emprendedor activo; no se modifica';
        END IF;
    ELSE
        -- 2. Perfil nuevo.
        IF EXISTS (SELECT 1 FROM public.usuarios WHERE lower(correo_electronico) = lower(p.correo)) THEN
            RAISE EXCEPTION 'ABORTADO: el correo % ya pertenece a otro usuario', p.correo;
        END IF;
        IF EXISTS (SELECT 1 FROM public.usuarios WHERE numero_documento = p.numero_documento) THEN
            RAISE EXCEPTION 'ABORTADO: el documento % ya pertenece a otro usuario', p.numero_documento;
        END IF;
        IF EXISTS (SELECT 1 FROM public.usuario_roles WHERE id_usuario_fk = p.auth_id) THEN
            RAISE EXCEPTION 'ABORTADO: la cuenta tiene roles sin perfil (activos, inactivos o eliminados); revisar manualmente';
        END IF;

        INSERT INTO public.usuarios (id, tipo_documento, numero_documento, primer_nombre, primer_apellido,
                                     correo_electronico, estado, created_at)
        VALUES (p.auth_id, p.tipo_documento, p.numero_documento, p.primer_nombre, p.primer_apellido,
                lower(p.correo), 'activo', now());

        INSERT INTO public.usuario_roles (id_usuario_fk, id_rol_fk, estado)
        VALUES (p.auth_id, v_rol.id, 'activo');
    END IF;

    -- 3. Aceptacion dentro de la transaccion: replica las reglas de la RPC de elegibilidad.
    IF NOT EXISTS (
        SELECT 1
        FROM public.usuarios u
        WHERE u.id = p.auth_id AND u.estado = 'activo' AND u.deleted_at IS NULL
          AND (SELECT count(*) FROM public.usuario_roles ur WHERE ur.id_usuario_fk = u.id) = 1
          AND EXISTS (SELECT 1 FROM public.usuario_roles ur
                      WHERE ur.id_usuario_fk = u.id AND ur.id_rol_fk = v_rol.id
                        AND ur.estado = 'activo' AND ur.deleted_at IS NULL)
          AND NOT EXISTS (SELECT 1 FROM public.emprendedores e WHERE e.usuario_id = u.id)
    ) THEN
        RAISE EXCEPTION 'ABORTADO: la verificacion final de elegibilidad no se cumple';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.sena_centros c
        JOIN public.sena_regionales r ON r.id = c.id_regional_fk
        WHERE c.codigo = p.centro_codigo AND c.estado = 'activo' AND c.deleted_at IS NULL
          AND r.codigo = p.regional_codigo AND r.estado = 'activo' AND r.deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'ABORTADO: la verificacion final del centro SENA no se cumple';
    END IF;

    -- 3. Informe de aceptacion (se conserva en _mvp_informe y se muestra despues del COMMIT).
    INSERT INTO _mvp_informe (informe)
    SELECT jsonb_pretty(jsonb_build_object(
        'resultado', 'ACEPTADO',
        'perfil', jsonb_build_object(
            'id', p.auth_id,
            'correo', lower(p.correo),
            'documento', p.tipo_documento || ' ' || p.numero_documento,
            'rol', v_rol.nombre_rol || ' (id ' || v_rol.id || ')',
            'auth_confirmado', (SELECT email_confirmed_at IS NOT NULL FROM auth.users WHERE id = p.auth_id),
            'perfil_preexistente', v_perfil.id IS NOT NULL),
        'centro', jsonb_build_object(
            'id', v_centro.id,
            'codigo', v_centro.codigo,
            'nombre', v_centro.nombre,
            'regional', v_regional.codigo || ' - ' || v_regional.nombre),
        'rpc', (SELECT jsonb_object_agg(f.proname, pg_get_function_identity_arguments(f.oid))
                FROM pg_proc f JOIN pg_namespace n ON n.oid = f.pronamespace
                WHERE n.nspname = 'public' AND f.proname IN (
                    'sigre_admin_crear_emprendedor', 'sigre_admin_crear_proyecto',
                    'sigre_listar_centros_sena_activos', 'sigre_listar_usuarios_elegibles_emprendedor',
                    'sigre_inscribir_en_jornada', 'sigre_registrar_asistencia')),
        'orientaciones_politicas', (SELECT jsonb_agg(jsonb_build_object(
                    'nombre', policyname, 'cmd', cmd, 'roles', roles, 'using', qual, 'with_check', with_check))
                FROM pg_policies WHERE schemaname = 'public' AND tablename = 'orientaciones'),
        'orientaciones_privilegios', jsonb_build_object(
            'insert', has_table_privilege('authenticated', 'public.orientaciones', 'INSERT'),
            'insert_cupo', has_column_privilege('authenticated', 'public.orientaciones', 'cupo', 'INSERT'),
            'insert_centro', has_column_privilege('authenticated', 'public.orientaciones', 'id_centro_sena_fk', 'INSERT'),
            'insert_observaciones', has_column_privilege('authenticated', 'public.orientaciones', 'observaciones', 'INSERT'))
    ));
END;
$$;

COMMIT;

SELECT informe FROM _mvp_informe;
