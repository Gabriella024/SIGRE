-- SIGRE MVP · Ejecución única en STAGING (febelffifcqzvnttpued). PROHIBIDO en PRODUCTION (nattebsxchioqkrsaxxr).
-- 1) Catálogo mínimo: una regional y un centro SENA activos (hoy ambos catálogos están vacíos).
-- 2) Perfil SIGRE + rol emprendedor para sigre-test3-emprendedor@gmail.com (cuenta Auth ya creada).
-- 3) Informe final de solo lectura: elegibilidad, centro activo, firmas de RPC y políticas de orientaciones.
-- Seguro e idempotente: no modifica registros existentes, no toca auth.users, RLS ni A5.
-- Si cualquier validación falla, la transacción completa se revierte.

BEGIN;

CREATE TEMP TABLE _mvp ON COMMIT DROP AS
SELECT
    'bbd440b7-717e-416c-a2e7-0a33ee1d1320'::uuid AS auth_id,
    'sigre-test3-emprendedor@gmail.com'::text     AS correo,
    'CC'::text                                    AS tipo_documento,   -- usar el mismo valor del ensayo
    '9000000003'::text                            AS numero_documento, -- usar el mismo valor del ensayo
    'Laura'::text                                 AS primer_nombre,
    'Pérez'::text                                 AS primer_apellido,
    'DEMO-ATL'::text                              AS regional_codigo,
    'Regional Atlántico'::text                    AS regional_nombre,
    'DEMO-CCS'::text                              AS centro_codigo,
    'Centro de Comercio y Servicios'::text        AS centro_nombre;

DO $$
DECLARE
    p          _mvp%ROWTYPE;
    v_regional public.sena_regionales.id%TYPE;
    v_rol      public.roles.id%TYPE;
    v_perfil   public.usuarios%ROWTYPE;
BEGIN
    SELECT * INTO STRICT p FROM _mvp;

    -- 1. Regional y centro SENA (se reutilizan si ya existen por código).
    SELECT id INTO v_regional FROM public.sena_regionales WHERE codigo = p.regional_codigo;
    IF v_regional IS NULL THEN
        INSERT INTO public.sena_regionales (codigo, nombre, estado, created_at)
        VALUES (p.regional_codigo, p.regional_nombre, 'activo', now())
        RETURNING id INTO v_regional;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.sena_centros WHERE codigo = p.centro_codigo) THEN
        INSERT INTO public.sena_centros (id_regional_fk, codigo, nombre, estado, created_at)
        VALUES (v_regional, p.centro_codigo, p.centro_nombre, 'activo', now());
    END IF;

    -- 2. Perfil y rol del usuario de prueba.
    IF NOT EXISTS (SELECT 1 FROM auth.users
                   WHERE id = p.auth_id AND lower(email) = lower(p.correo) AND deleted_at IS NULL) THEN
        RAISE EXCEPTION 'El UUID % no corresponde a una cuenta Auth vigente con %', p.auth_id, p.correo;
    END IF;

    IF EXISTS (SELECT 1 FROM public.emprendedores WHERE usuario_id = p.auth_id) THEN
        RAISE EXCEPTION 'La cuenta ya tiene ficha de emprendedor';
    END IF;

    SELECT id INTO STRICT v_rol FROM public.roles
    WHERE lower(nombre_rol) = 'emprendedor' AND estado = 'activo' AND deleted_at IS NULL;

    SELECT * INTO v_perfil FROM public.usuarios WHERE id = p.auth_id;

    IF FOUND THEN
        -- Reejecución: se acepta solo si el perfil ya es exactamente el esperado; no se modifica.
        IF lower(v_perfil.correo_electronico) <> lower(p.correo)
           OR EXISTS (SELECT 1 FROM public.usuario_roles
                      WHERE id_usuario_fk = p.auth_id AND id_rol_fk <> v_rol AND deleted_at IS NULL) THEN
            RAISE EXCEPTION 'Existe un perfil distinto para %; revisar manualmente', p.auth_id;
        END IF;
    ELSE
        IF EXISTS (SELECT 1 FROM public.usuarios
                   WHERE lower(correo_electronico) = lower(p.correo) OR numero_documento = p.numero_documento) THEN
            RAISE EXCEPTION 'Correo o documento ya registrados en otro usuario';
        END IF;
        IF EXISTS (SELECT 1 FROM public.usuario_roles WHERE id_usuario_fk = p.auth_id) THEN
            RAISE EXCEPTION 'La cuenta tiene roles sin perfil; revisar manualmente';
        END IF;

        INSERT INTO public.usuarios (id, tipo_documento, numero_documento, primer_nombre, primer_apellido,
                                     correo_electronico, estado, created_at)
        VALUES (p.auth_id, p.tipo_documento, p.numero_documento, p.primer_nombre, p.primer_apellido,
                lower(p.correo), 'activo', now());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.usuario_roles
                   WHERE id_usuario_fk = p.auth_id AND id_rol_fk = v_rol AND deleted_at IS NULL) THEN
        INSERT INTO public.usuario_roles (id_usuario_fk, id_rol_fk, estado)
        VALUES (p.auth_id, v_rol, 'activo');
    END IF;
END;
$$;

DROP TABLE IF EXISTS _mvp_param;
CREATE TEMP TABLE _mvp_param AS SELECT auth_id, centro_codigo FROM _mvp;

COMMIT;

-- 3. Informe (solo lectura). Es el resultado que muestra el SQL Editor: copiar la columna "informe".
SELECT jsonb_pretty(jsonb_build_object(
    'perfil', (
        SELECT jsonb_build_object(
            'correo', u.correo_electronico,
            'estado', u.estado,
            'roles', (SELECT jsonb_agg(r.nombre_rol || ':' || ur.estado)
                      FROM public.usuario_roles ur JOIN public.roles r ON r.id = ur.id_rol_fk
                      WHERE ur.id_usuario_fk = u.id AND ur.deleted_at IS NULL),
            'tiene_ficha', EXISTS (SELECT 1 FROM public.emprendedores e WHERE e.usuario_id = u.id),
            'auth_confirmado', (SELECT email_confirmed_at IS NOT NULL FROM auth.users WHERE id = u.id))
        FROM public.usuarios u JOIN _mvp_param p ON p.auth_id = u.id),
    'centro', (
        SELECT jsonb_build_object('codigo', c.codigo, 'nombre', c.nombre, 'estado', c.estado,
                                  'regional', rg.nombre, 'regional_estado', rg.estado)
        FROM public.sena_centros c
        JOIN public.sena_regionales rg ON rg.id = c.id_regional_fk
        JOIN _mvp_param p ON p.centro_codigo = c.codigo),
    'rpc', (
        SELECT jsonb_object_agg(p.proname, pg_get_function_identity_arguments(p.oid))
        FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname IN (
            'sigre_admin_crear_emprendedor', 'sigre_admin_crear_proyecto',
            'sigre_listar_centros_sena_activos', 'sigre_listar_usuarios_elegibles_emprendedor',
            'sigre_inscribir_en_jornada', 'sigre_registrar_asistencia')),
    'orientaciones_politicas', (
        SELECT jsonb_agg(jsonb_build_object('nombre', policyname, 'cmd', cmd, 'roles', roles,
                                            'using', qual, 'with_check', with_check))
        FROM pg_policies WHERE schemaname = 'public' AND tablename = 'orientaciones'),
    'orientaciones_privilegios', jsonb_build_object(
        'insert', has_table_privilege('authenticated', 'public.orientaciones', 'INSERT'),
        'update', has_table_privilege('authenticated', 'public.orientaciones', 'UPDATE'),
        'insert_cupo', has_column_privilege('authenticated', 'public.orientaciones', 'cupo', 'INSERT'),
        'insert_centro', has_column_privilege('authenticated', 'public.orientaciones', 'id_centro_sena_fk', 'INSERT'),
        'insert_observaciones', has_column_privilege('authenticated', 'public.orientaciones', 'observaciones', 'INSERT'))
)) AS informe;
