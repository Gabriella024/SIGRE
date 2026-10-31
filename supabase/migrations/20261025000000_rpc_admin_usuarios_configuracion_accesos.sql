-- SIGRE · RPC administrativas (usuarios, A5, catálogos, pantallas, permisos y roles).
-- Extraídas en SOLO LECTURA de STAGING el 2026-10-30 con pg_get_functiondef
-- (supabase/diagnostics/rpc_admin_sin_migracion_extraer.sql) y verificadas por md5 contra STAGING.
-- Ya existen en STAGING: NO ejecutar allí. El md5 de cada bloque es el de STAGING (cuerpos con CRLF); git normaliza
-- los fines de línea (core.autocrlf), por lo que en otro entorno solo pueden diferir los saltos de línea.
-- Dependen del esquema base (usuarios, usuario_roles, roles, municipios, sena_regionales, sena_centros,
-- app_modulos, app_pantallas, app_acciones, pantalla_acciones, rol_pantalla_permisos, permiso_cambios_logs,
-- auditorias, tiene_rol, tiene_permiso), que todavía no está versionado (ver docs/informe_entrega_mvp.md).
-- Permisos de ejecución tal como están en STAGING: authenticated + service_role; sigre_registrar_usuario_invitado
-- solo service_role (la invoca la Edge Function A5).

-- sigre_admin_actualizar_pantallas(p_pantallas jsonb) · md5 STAGING 593842b89fc0341581e234d62b3476b2
CREATE OR REPLACE FUNCTION public.sigre_admin_actualizar_pantallas(p_pantallas jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    v_actor uuid := auth.uid();
    v_item jsonb;
    v_id uuid;
    v_version timestamptz;
    v_orden smallint;
    v_estado text;
    v_anterior public.app_pantallas%ROWTYPE;
    v_total integer := 0;
    v_resultado uuid;
BEGIN

    IF v_actor IS NULL
       OR NOT COALESCE(public.tiene_rol('administrador'), false)
       OR NOT COALESCE(
           public.tiene_permiso('configuracion', 'editar'),
           false
       )
    THEN
        RAISE EXCEPTION 'No autorizado para modificar pantallas'
            USING ERRCODE = '42501';
    END IF;

    IF p_pantallas IS NULL
       OR jsonb_typeof(p_pantallas) <> 'array'
       OR jsonb_array_length(p_pantallas) = 0
    THEN
        RAISE EXCEPTION 'Debe proporcionar una lista de pantallas'
            USING ERRCODE = '22023';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM jsonb_array_elements(p_pantallas) x
        WHERE jsonb_typeof(x) <> 'object'
           OR NOT (x ? 'id_pantalla')
           OR NOT (x ? 'updated_at_esperado')
           OR NOT (x ? 'orden')
           OR NOT (x ? 'estado')
           OR x->>'id_pantalla' IS NULL
           OR x->>'orden' IS NULL
           OR x->>'estado' IS NULL
    ) THEN
        RAISE EXCEPTION 'Cada pantalla debe incluir id, versión, orden y estado'
            USING ERRCODE = '22023';
    END IF;

    IF (
        SELECT count(*)
        FROM (
            SELECT x->>'id_pantalla'
            FROM jsonb_array_elements(p_pantallas) x
            GROUP BY x->>'id_pantalla'
            HAVING count(*) > 1
        ) duplicados
    ) > 0 THEN
        RAISE EXCEPTION 'Hay pantallas duplicadas en la solicitud'
            USING ERRCODE = '22023';
    END IF;

    -- Evitar actualizaciones administrativas simultáneas.
    PERFORM pg_catalog.pg_advisory_xact_lock(2026, 1004);

    FOR v_item IN
        SELECT value
        FROM jsonb_array_elements(p_pantallas)
        ORDER BY value->>'id_pantalla'
    LOOP

        v_id := (v_item->>'id_pantalla')::uuid;
        v_version :=
            (v_item->>'updated_at_esperado')::timestamptz;
        v_orden := (v_item->>'orden')::smallint;
        v_estado := v_item->>'estado';

        IF v_id IS NULL
           OR v_orden IS NULL
           OR v_orden < 1
           OR v_estado NOT IN ('activo', 'inactivo')
        THEN
            RAISE EXCEPTION 'Datos de pantalla inválidos'
                USING ERRCODE = '22023';
        END IF;

        SELECT *
        INTO v_anterior
        FROM public.app_pantallas
        WHERE id = v_id
        FOR UPDATE;

        IF NOT FOUND OR v_anterior.deleted_at IS NOT NULL THEN
            RAISE EXCEPTION 'Pantalla no encontrada: %', v_id
                USING ERRCODE = 'P0002';
        END IF;

        IF v_anterior.updated_at IS DISTINCT FROM v_version THEN
            RAISE EXCEPTION 'La pantalla % fue modificada por otra sesión', v_id
                USING ERRCODE = 'PT409';
        END IF;

        IF v_anterior.orden IS DISTINCT FROM v_orden
           OR v_anterior.estado IS DISTINCT FROM v_estado
        THEN

            UPDATE public.app_pantallas
            SET orden = v_orden,
                estado = v_estado
            WHERE id = v_id;

            INSERT INTO public.auditorias (
                id_usuario_fk,
                tabla_afectada,
                accion,
                valor_anterior,
                valor_nuevo,
                razon_cambio
            )
            VALUES (
                v_actor,
                'app_pantallas',
                'PANTALLA_ACTUALIZADA',
                jsonb_build_object(
                    'id', v_id,
                    'orden', v_anterior.orden,
                    'estado', v_anterior.estado
                ),
                jsonb_build_object(
                    'id', v_id,
                    'orden', v_orden,
                    'estado', v_estado
                ),
                'Actualización administrativa de pantallas'
            );

            v_total := v_total + 1;
        END IF;

    END LOOP;

    IF v_total = 0 THEN
        RAISE EXCEPTION 'No hay cambios para guardar'
            USING ERRCODE = '22023';
    END IF;

    v_resultado := pg_catalog.gen_random_uuid();

    RETURN v_resultado;
END;
$function$;
REVOKE ALL ON FUNCTION public.sigre_admin_actualizar_pantallas(p_pantallas jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sigre_admin_actualizar_pantallas(p_pantallas jsonb) TO authenticated, service_role;

-- sigre_admin_asignar_roles_usuario(p_id_usuario uuid, p_updated_at_esperado timestamp with time zone, p_ids_roles smallint[]) · md5 STAGING 5b30da52d298bd0db3804d4279265220
CREATE OR REPLACE FUNCTION public.sigre_admin_asignar_roles_usuario(p_id_usuario uuid, p_updated_at_esperado timestamp with time zone, p_ids_roles smallint[])
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    v_actor uuid := auth.uid();
    v_usuario public.usuarios%ROWTYPE;
    v_roles_anteriores smallint[];
    v_roles_nuevos smallint[];
    v_admin_id smallint;
BEGIN
    IF v_actor IS NULL
       OR NOT COALESCE(public.tiene_rol('administrador'), false)
       OR NOT COALESCE(public.tiene_permiso('usuarios','editar'), false)
    THEN
        RAISE EXCEPTION 'No autorizado'
            USING ERRCODE = '42501';
    END IF;

    IF p_id_usuario IS NULL
       OR p_ids_roles IS NULL
       OR cardinality(p_ids_roles) = 0
       OR array_position(p_ids_roles, NULL) IS NOT NULL
    THEN
        RAISE EXCEPTION 'Debe seleccionar al menos un rol válido'
            USING ERRCODE = '22023';
    END IF;

    -- Serializa las operaciones de roles administrativos.
    PERFORM pg_catalog.pg_advisory_xact_lock(2026, 1003);

    SELECT *
    INTO v_usuario
    FROM public.usuarios
    WHERE id = p_id_usuario
    FOR UPDATE;

    IF NOT FOUND OR v_usuario.deleted_at IS NOT NULL THEN
        RAISE EXCEPTION 'Usuario no encontrado'
            USING ERRCODE = 'P0002';
    END IF;

    IF v_usuario.updated_at
       IS DISTINCT FROM p_updated_at_esperado
    THEN
        RAISE EXCEPTION 'Usuario modificado por otra sesión'
            USING ERRCODE = 'PT409';
    END IF;

    SELECT array_agg(DISTINCT x ORDER BY x)
    INTO v_roles_nuevos
    FROM unnest(p_ids_roles) AS x;

    IF (
        SELECT count(*)
        FROM public.roles r
        WHERE r.id = ANY(v_roles_nuevos)
          AND r.estado = 'activo'
          AND r.deleted_at IS NULL
    ) <> cardinality(v_roles_nuevos)
    THEN
        RAISE EXCEPTION 'Hay roles inexistentes o inactivos'
            USING ERRCODE = '22023';
    END IF;

    SELECT id INTO v_admin_id
    FROM public.roles
    WHERE nombre_rol = 'administrador'
      AND estado = 'activo'
      AND deleted_at IS NULL;

    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'Rol administrador no configurado'
            USING ERRCODE = '22023';
    END IF;

    IF p_id_usuario = v_actor
       AND NOT v_admin_id = ANY(v_roles_nuevos)
    THEN
        RAISE EXCEPTION 'No puede retirarse su propio rol administrador'
            USING ERRCODE = '42501';
    END IF;

    -- Evitar combinar emprendedor con roles operativos.
    IF EXISTS (
        SELECT 1
        FROM public.roles r
        WHERE r.id = ANY(v_roles_nuevos)
          AND r.nombre_rol = 'emprendedor'
    )
    AND EXISTS (
        SELECT 1
        FROM public.roles r
        WHERE r.id = ANY(v_roles_nuevos)
          AND r.nombre_rol IN (
              'administrador', 'coordinador',
              'orientador', 'evaluador'
          )
    )
    THEN
        RAISE EXCEPTION 'El rol emprendedor no puede combinarse con roles operativos'
            USING ERRCODE = '22023';
    END IF;

    SELECT COALESCE(array_agg(ur.id_rol_fk ORDER BY ur.id_rol_fk),
                    ARRAY[]::smallint[])
    INTO v_roles_anteriores
    FROM public.usuario_roles ur
    WHERE ur.id_usuario_fk = p_id_usuario
      AND ur.estado = 'activo'
      AND ur.deleted_at IS NULL;

    IF v_roles_anteriores = v_roles_nuevos THEN
        RAISE EXCEPTION 'La asignación de roles no presenta cambios'
            USING ERRCODE = '22023';
    END IF;

    -- Desactivar las asignaciones que ya no corresponden.
    UPDATE public.usuario_roles
    SET estado = 'inactivo',
        updated_at = clock_timestamp()
    WHERE id_usuario_fk = p_id_usuario
      AND estado = 'activo'
      AND deleted_at IS NULL
      AND NOT (id_rol_fk = ANY(v_roles_nuevos));

    -- Reactivar las asignaciones históricas.
    UPDATE public.usuario_roles
    SET estado = 'activo',
        deleted_at = NULL,
        updated_at = clock_timestamp()
    WHERE id_usuario_fk = p_id_usuario
      AND id_rol_fk = ANY(v_roles_nuevos)
      AND (estado IS DISTINCT FROM 'activo'
           OR deleted_at IS NOT NULL);

    -- Insertar únicamente roles sin registro previo.
    INSERT INTO public.usuario_roles (
        id_usuario_fk, id_rol_fk, estado
    )
    SELECT p_id_usuario, x, 'activo'
    FROM unnest(v_roles_nuevos) AS x
    WHERE NOT EXISTS (
        SELECT 1
        FROM public.usuario_roles ur
        WHERE ur.id_usuario_fk = p_id_usuario
          AND ur.id_rol_fk = x
    );

    -- Actualizar versión del usuario para control concurrente.
    UPDATE public.usuarios
    SET updated_at = clock_timestamp()
    WHERE id = p_id_usuario;

    INSERT INTO public.auditorias (
        id_usuario_fk, tabla_afectada, accion,
        valor_anterior, valor_nuevo, razon_cambio
    )
    VALUES (
        v_actor, 'usuario_roles', 'ROLES_USUARIO_ACTUALIZADOS',
        jsonb_build_object(
            'id_usuario', p_id_usuario,
            'roles', v_roles_anteriores
        ),
        jsonb_build_object(
            'id_usuario', p_id_usuario,
            'roles', v_roles_nuevos
        ),
        'Asignación administrativa de roles'
    );

    RETURN p_id_usuario;
END;
$function$;
REVOKE ALL ON FUNCTION public.sigre_admin_asignar_roles_usuario(p_id_usuario uuid, p_updated_at_esperado timestamp with time zone, p_ids_roles smallint[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sigre_admin_asignar_roles_usuario(p_id_usuario uuid, p_updated_at_esperado timestamp with time zone, p_ids_roles smallint[]) TO authenticated, service_role;

-- sigre_admin_cambiar_estado_centro_sena(p_id_centro uuid, p_updated_at_esperado timestamp with time zone, p_estado_nuevo text) · md5 STAGING 3b4717990b55b4019a55ca6b9bb65a22
CREATE OR REPLACE FUNCTION public.sigre_admin_cambiar_estado_centro_sena(p_id_centro uuid, p_updated_at_esperado timestamp with time zone, p_estado_nuevo text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    v_actor uuid := auth.uid();
    v_anterior public.sena_centros%ROWTYPE;
BEGIN
    IF v_actor IS NULL
       OR NOT COALESCE(public.tiene_rol('administrador'), false)
       OR NOT COALESCE(
           public.tiene_permiso('configuracion', 'editar'),
           false
       )
    THEN
        RAISE EXCEPTION 'No autorizado'
            USING ERRCODE = '42501';
    END IF;

    IF p_id_centro IS NULL
       OR p_estado_nuevo IS NULL
       OR p_estado_nuevo NOT IN ('activo', 'inactivo')
    THEN
        RAISE EXCEPTION 'Identificador o estado inválido'
            USING ERRCODE = '22023';
    END IF;

    SELECT *
    INTO v_anterior
    FROM public.sena_centros
    WHERE id = p_id_centro
    FOR UPDATE;

    IF NOT FOUND OR v_anterior.deleted_at IS NOT NULL THEN
        RAISE EXCEPTION 'Centro SENA no encontrado'
            USING ERRCODE = 'P0002';
    END IF;

    IF v_anterior.updated_at
       IS DISTINCT FROM p_updated_at_esperado
    THEN
        RAISE EXCEPTION 'Centro modificado por otro usuario'
            USING ERRCODE = 'PT409';
    END IF;

    IF v_anterior.estado = p_estado_nuevo THEN
        RAISE EXCEPTION 'El centro ya tiene ese estado'
            USING ERRCODE = '22023';
    END IF;

    UPDATE public.sena_centros
    SET estado = p_estado_nuevo,
        updated_at = clock_timestamp()
    WHERE id = p_id_centro;

    INSERT INTO public.auditorias (
        id_usuario_fk, tabla_afectada, accion,
        valor_anterior, valor_nuevo, razon_cambio
    )
    VALUES (
        v_actor,
        'sena_centros',
        'ESTADO_CENTRO_SENA_CAMBIADO',
        jsonb_build_object(
            'id', p_id_centro,
            'estado', v_anterior.estado
        ),
        jsonb_build_object(
            'id', p_id_centro,
            'estado', p_estado_nuevo
        ),
        'Cambio administrativo de estado'
    );

    RETURN p_id_centro;
END;
$function$;
REVOKE ALL ON FUNCTION public.sigre_admin_cambiar_estado_centro_sena(p_id_centro uuid, p_updated_at_esperado timestamp with time zone, p_estado_nuevo text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sigre_admin_cambiar_estado_centro_sena(p_id_centro uuid, p_updated_at_esperado timestamp with time zone, p_estado_nuevo text) TO authenticated, service_role;

-- sigre_admin_cambiar_estado_municipio(p_id_municipio integer, p_esta_activo boolean) · md5 STAGING b3eded79eed09676572f7501ff1dd2f0
CREATE OR REPLACE FUNCTION public.sigre_admin_cambiar_estado_municipio(p_id_municipio integer, p_esta_activo boolean)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    v_actor uuid := auth.uid();
    v_anterior public.municipios%ROWTYPE;
BEGIN
    IF v_actor IS NULL
       OR NOT COALESCE(public.tiene_rol('administrador'), false)
       OR NOT COALESCE(
           public.tiene_permiso('configuracion', 'editar'),
           false
       )
    THEN
        RAISE EXCEPTION 'No autorizado'
            USING ERRCODE = '42501';
    END IF;

    IF p_id_municipio IS NULL OR p_esta_activo IS NULL THEN
        RAISE EXCEPTION 'Datos obligatorios incompletos'
            USING ERRCODE = '22023';
    END IF;

    SELECT *
    INTO v_anterior
    FROM public.municipios
    WHERE id = p_id_municipio
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Municipio no encontrado'
            USING ERRCODE = 'P0002';
    END IF;

    IF v_anterior.esta_activo = p_esta_activo THEN
        RAISE EXCEPTION 'El municipio ya tiene ese estado'
            USING ERRCODE = '22023';
    END IF;

    UPDATE public.municipios
    SET esta_activo = p_esta_activo
    WHERE id = p_id_municipio;

    INSERT INTO public.auditorias (
        id_usuario_fk, tabla_afectada, accion,
        valor_anterior, valor_nuevo, razon_cambio
    )
    VALUES (
        v_actor,
        'municipios',
        'ESTADO_MUNICIPIO_CAMBIADO',
        jsonb_build_object(
            'id', p_id_municipio,
            'esta_activo', v_anterior.esta_activo
        ),
        jsonb_build_object(
            'id', p_id_municipio,
            'esta_activo', p_esta_activo
        ),
        'Cambio administrativo de estado'
    );

    RETURN p_id_municipio;
END;
$function$;
REVOKE ALL ON FUNCTION public.sigre_admin_cambiar_estado_municipio(p_id_municipio integer, p_esta_activo boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sigre_admin_cambiar_estado_municipio(p_id_municipio integer, p_esta_activo boolean) TO authenticated, service_role;

-- sigre_admin_cambiar_estado_usuario(p_id_usuario uuid, p_updated_at_esperado timestamp with time zone, p_estado_nuevo text, p_justificacion text) · md5 STAGING 0a3183a46bb5859274800049cd4b23b6
CREATE OR REPLACE FUNCTION public.sigre_admin_cambiar_estado_usuario(p_id_usuario uuid, p_updated_at_esperado timestamp with time zone, p_estado_nuevo text, p_justificacion text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    v_actor uuid := auth.uid();
    v_anterior public.usuarios%ROWTYPE;
    v_justificacion text := NULLIF(btrim(p_justificacion), '');
BEGIN
    IF v_actor IS NULL
       OR NOT COALESCE(public.tiene_rol('administrador'), false)
       OR NOT COALESCE(public.tiene_permiso('usuarios','editar'), false)
    THEN
        RAISE EXCEPTION 'No autorizado'
            USING ERRCODE = '42501';
    END IF;

    IF p_id_usuario IS NULL
       OR p_estado_nuevo IS NULL
       OR p_estado_nuevo NOT IN ('activo','inactivo')
       OR v_justificacion IS NULL
    THEN
        RAISE EXCEPTION 'Datos inválidos o justificación ausente'
            USING ERRCODE = '22023';
    END IF;

    IF p_id_usuario = v_actor THEN
        RAISE EXCEPTION 'No puede cambiar su propio estado'
            USING ERRCODE = '42501';
    END IF;

    SELECT *
    INTO v_anterior
    FROM public.usuarios
    WHERE id = p_id_usuario
    FOR UPDATE;

    IF NOT FOUND OR v_anterior.deleted_at IS NOT NULL THEN
        RAISE EXCEPTION 'Usuario no encontrado'
            USING ERRCODE = 'P0002';
    END IF;

    IF v_anterior.updated_at
       IS DISTINCT FROM p_updated_at_esperado
    THEN
        RAISE EXCEPTION 'Usuario modificado por otra sesión'
            USING ERRCODE = 'PT409';
    END IF;

    IF v_anterior.estado IS NOT DISTINCT FROM p_estado_nuevo THEN
        RAISE EXCEPTION 'El usuario ya tiene ese estado'
            USING ERRCODE = '22023';
    END IF;

    UPDATE public.usuarios
    SET estado = p_estado_nuevo,
        updated_at = clock_timestamp()
    WHERE id = p_id_usuario;

    INSERT INTO public.auditorias (
        id_usuario_fk, tabla_afectada, accion,
        valor_anterior, valor_nuevo, razon_cambio
    )
    VALUES (
        v_actor, 'usuarios', 'ESTADO_USUARIO_CAMBIADO',
        jsonb_build_object(
            'id', p_id_usuario,
            'estado', v_anterior.estado
        ),
        jsonb_build_object(
            'id', p_id_usuario,
            'estado', p_estado_nuevo
        ),
        v_justificacion
    );

    RETURN p_id_usuario;
END;
$function$;
REVOKE ALL ON FUNCTION public.sigre_admin_cambiar_estado_usuario(p_id_usuario uuid, p_updated_at_esperado timestamp with time zone, p_estado_nuevo text, p_justificacion text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sigre_admin_cambiar_estado_usuario(p_id_usuario uuid, p_updated_at_esperado timestamp with time zone, p_estado_nuevo text, p_justificacion text) TO authenticated, service_role;

-- sigre_admin_editar_usuario(p_id_usuario uuid, p_updated_at_esperado timestamp with time zone, p_primer_nombre text, p_segundo_nombre text, p_primer_apellido text, p_segundo_apellido text, p_tipo_documento text, p_numero_documento text, p_numero_telefono text, p_id_municipio integer) · md5 STAGING 9491ec3a6b1b61b4b9e0ae01e659e549
CREATE OR REPLACE FUNCTION public.sigre_admin_editar_usuario(p_id_usuario uuid, p_updated_at_esperado timestamp with time zone, p_primer_nombre text, p_segundo_nombre text, p_primer_apellido text, p_segundo_apellido text, p_tipo_documento text, p_numero_documento text, p_numero_telefono text, p_id_municipio integer)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    v_actor uuid := auth.uid();
    v_anterior public.usuarios%ROWTYPE;
    v_nombre text := NULLIF(btrim(p_primer_nombre), '');
    v_apellido text := NULLIF(btrim(p_primer_apellido), '');
    v_tipo text := NULLIF(btrim(p_tipo_documento), '');
    v_documento text := NULLIF(btrim(p_numero_documento), '');
BEGIN
    IF v_actor IS NULL
       OR NOT COALESCE(public.tiene_rol('administrador'), false)
       OR NOT COALESCE(public.tiene_permiso('usuarios','editar'), false)
    THEN
        RAISE EXCEPTION 'No autorizado'
            USING ERRCODE = '42501';
    END IF;

    IF p_id_usuario IS NULL
       OR v_nombre IS NULL
       OR v_apellido IS NULL
       OR v_tipo IS NULL
       OR v_documento IS NULL
    THEN
        RAISE EXCEPTION 'Datos obligatorios incompletos'
            USING ERRCODE = '22023';
    END IF;

    SELECT *
    INTO v_anterior
    FROM public.usuarios
    WHERE id = p_id_usuario
    FOR UPDATE;

    IF NOT FOUND OR v_anterior.deleted_at IS NOT NULL THEN
        RAISE EXCEPTION 'Usuario no encontrado'
            USING ERRCODE = 'P0002';
    END IF;

    IF v_anterior.updated_at
       IS DISTINCT FROM p_updated_at_esperado
    THEN
        RAISE EXCEPTION 'Usuario modificado por otra sesión'
            USING ERRCODE = 'PT409';
    END IF;

    IF p_id_municipio IS NOT NULL
       AND NOT EXISTS (
           SELECT 1
           FROM public.municipios
           WHERE id = p_id_municipio
             AND esta_activo IS TRUE
       )
    THEN
        RAISE EXCEPTION 'Municipio no válido o inactivo'
            USING ERRCODE = '23503';
    END IF;

    UPDATE public.usuarios
    SET primer_nombre = v_nombre,
        segundo_nombre = NULLIF(btrim(p_segundo_nombre), ''),
        primer_apellido = v_apellido,
        segundo_apellido = NULLIF(btrim(p_segundo_apellido), ''),
        tipo_documento = v_tipo,
        numero_documento = v_documento,
        numero_telefono = NULLIF(btrim(p_numero_telefono), ''),
        id_municipio_fk = p_id_municipio,
        updated_at = clock_timestamp()
    WHERE id = p_id_usuario;

    INSERT INTO public.auditorias (
        id_usuario_fk, tabla_afectada, accion,
        valor_anterior, valor_nuevo, razon_cambio
    )
    VALUES (
        v_actor, 'usuarios', 'USUARIO_EDITADO',
        jsonb_build_object(
            'id', p_id_usuario,
            'primer_nombre', v_anterior.primer_nombre,
            'primer_apellido', v_anterior.primer_apellido,
            'tipo_documento', v_anterior.tipo_documento,
            'numero_documento', v_anterior.numero_documento,
            'id_municipio', v_anterior.id_municipio_fk
        ),
        jsonb_build_object(
            'id', p_id_usuario,
            'primer_nombre', v_nombre,
            'primer_apellido', v_apellido,
            'tipo_documento', v_tipo,
            'numero_documento', v_documento,
            'id_municipio', p_id_municipio
        ),
        'Edición administrativa de usuario'
    );

    RETURN p_id_usuario;
END;
$function$;
REVOKE ALL ON FUNCTION public.sigre_admin_editar_usuario(p_id_usuario uuid, p_updated_at_esperado timestamp with time zone, p_primer_nombre text, p_segundo_nombre text, p_primer_apellido text, p_segundo_apellido text, p_tipo_documento text, p_numero_documento text, p_numero_telefono text, p_id_municipio integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sigre_admin_editar_usuario(p_id_usuario uuid, p_updated_at_esperado timestamp with time zone, p_primer_nombre text, p_segundo_nombre text, p_primer_apellido text, p_segundo_apellido text, p_tipo_documento text, p_numero_documento text, p_numero_telefono text, p_id_municipio integer) TO authenticated, service_role;

-- sigre_admin_guardar_centro_sena(p_id_centro uuid, p_updated_at_esperado timestamp with time zone, p_id_regional uuid, p_codigo text, p_nombre text) · md5 STAGING 5207076437bd953f653e64324bd1780a
CREATE OR REPLACE FUNCTION public.sigre_admin_guardar_centro_sena(p_id_centro uuid, p_updated_at_esperado timestamp with time zone, p_id_regional uuid, p_codigo text, p_nombre text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    v_actor uuid := auth.uid();
    v_id uuid;
    v_anterior public.sena_centros%ROWTYPE;
    v_codigo text := NULLIF(btrim(p_codigo), '');
    v_nombre text := NULLIF(btrim(p_nombre), '');
BEGIN
    IF v_actor IS NULL
       OR NOT COALESCE(public.tiene_rol('administrador'), false)
       OR NOT COALESCE(
           public.tiene_permiso(
               'configuracion',
               CASE WHEN p_id_centro IS NULL
                    THEN 'crear' ELSE 'editar' END
           ), false
       )
    THEN
        RAISE EXCEPTION 'No autorizado'
            USING ERRCODE = '42501';
    END IF;

    IF p_id_regional IS NULL
       OR v_codigo IS NULL
       OR v_nombre IS NULL
    THEN
        RAISE EXCEPTION 'Regional, código y nombre obligatorios'
            USING ERRCODE = '22023';
    END IF;

    PERFORM 1
    FROM public.sena_regionales r
    WHERE r.id = p_id_regional
      AND r.estado = 'activo'
      AND r.deleted_at IS NULL
    FOR SHARE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Regional SENA no válida o inactiva'
            USING ERRCODE = '23503';
    END IF;

    IF p_id_centro IS NULL THEN

        IF p_updated_at_esperado IS NOT NULL THEN
            RAISE EXCEPTION 'La versión debe ser NULL al crear'
                USING ERRCODE = '22023';
        END IF;

        INSERT INTO public.sena_centros (
            id_regional_fk, codigo, nombre, estado,
            updated_at
        )
        VALUES (
            p_id_regional, v_codigo, v_nombre,
            'activo', now()
        )
        RETURNING id INTO v_id;

    ELSE

        SELECT *
        INTO v_anterior
        FROM public.sena_centros
        WHERE id = p_id_centro
        FOR UPDATE;

        IF NOT FOUND OR v_anterior.deleted_at IS NOT NULL THEN
            RAISE EXCEPTION 'Centro SENA no encontrado'
                USING ERRCODE = 'P0002';
        END IF;

        IF v_anterior.updated_at
           IS DISTINCT FROM p_updated_at_esperado
        THEN
            RAISE EXCEPTION 'Centro modificado por otro usuario'
                USING ERRCODE = 'PT409';
        END IF;

        IF v_anterior.id_regional_fk = p_id_regional
           AND v_anterior.codigo = v_codigo
           AND v_anterior.nombre = v_nombre
        THEN
            RAISE EXCEPTION 'No hay cambios para guardar'
                USING ERRCODE = '22023';
        END IF;

        UPDATE public.sena_centros
        SET id_regional_fk = p_id_regional,
            codigo = v_codigo,
            nombre = v_nombre,
            updated_at = clock_timestamp()
        WHERE id = p_id_centro;

        v_id := p_id_centro;

    END IF;

    INSERT INTO public.auditorias (
        id_usuario_fk, tabla_afectada, accion,
        valor_anterior, valor_nuevo, razon_cambio
    )
    VALUES (
        v_actor,
        'sena_centros',
        CASE WHEN p_id_centro IS NULL
             THEN 'CENTRO_SENA_CREADO'
             ELSE 'CENTRO_SENA_EDITADO' END,
        CASE WHEN p_id_centro IS NULL THEN NULL
             ELSE jsonb_build_object(
                 'id_regional', v_anterior.id_regional_fk,
                 'codigo', v_anterior.codigo,
                 'nombre', v_anterior.nombre
             ) END,
        jsonb_build_object(
            'id', v_id,
            'id_regional', p_id_regional,
            'codigo', v_codigo,
            'nombre', v_nombre
        ),
        'Gestión administrativa de centros SENA'
    );

    RETURN v_id;
END;
$function$;
REVOKE ALL ON FUNCTION public.sigre_admin_guardar_centro_sena(p_id_centro uuid, p_updated_at_esperado timestamp with time zone, p_id_regional uuid, p_codigo text, p_nombre text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sigre_admin_guardar_centro_sena(p_id_centro uuid, p_updated_at_esperado timestamp with time zone, p_id_regional uuid, p_codigo text, p_nombre text) TO authenticated, service_role;

-- sigre_admin_guardar_municipio(p_id_municipio integer, p_nombre_municipio text, p_departamento text) · md5 STAGING c38791a02294ed4417ff763e8aa47fda
CREATE OR REPLACE FUNCTION public.sigre_admin_guardar_municipio(p_id_municipio integer, p_nombre_municipio text, p_departamento text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    v_actor uuid := auth.uid();
    v_id integer;
    v_anterior public.municipios%ROWTYPE;
    v_nombre text := NULLIF(btrim(p_nombre_municipio), '');
    v_departamento text := NULLIF(btrim(p_departamento), '');
BEGIN
    IF v_actor IS NULL
       OR NOT COALESCE(public.tiene_rol('administrador'), false)
       OR NOT COALESCE(
           public.tiene_permiso(
               'configuracion',
               CASE WHEN p_id_municipio IS NULL
                    THEN 'crear' ELSE 'editar' END
           ), false)
    THEN
        RAISE EXCEPTION 'No autorizado'
            USING ERRCODE = '42501';
    END IF;

    IF v_nombre IS NULL OR v_departamento IS NULL THEN
        RAISE EXCEPTION 'Nombre y departamento obligatorios'
            USING ERRCODE = '22023';
    END IF;

    IF p_id_municipio IS NULL THEN

        -- Serializar creación de identificadores.
        PERFORM pg_catalog.pg_advisory_xact_lock(
            2026, 1001
        );

        SELECT COALESCE(MAX(id), 0) + 1
        INTO v_id
        FROM public.municipios;

        INSERT INTO public.municipios (
            id, nombre_municipio, departamento, esta_activo
        )
        VALUES (
            v_id, v_nombre, v_departamento, true
        );

    ELSE

        SELECT *
        INTO v_anterior
        FROM public.municipios
        WHERE id = p_id_municipio
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Municipio no encontrado'
                USING ERRCODE = 'P0002';
        END IF;

        IF v_anterior.nombre_municipio IS NOT DISTINCT FROM v_nombre
           AND v_anterior.departamento IS NOT DISTINCT FROM v_departamento
        THEN
            RAISE EXCEPTION 'No hay cambios para guardar'
                USING ERRCODE = '22023';
        END IF;

        UPDATE public.municipios
        SET nombre_municipio = v_nombre,
            departamento = v_departamento
        WHERE id = p_id_municipio;

        v_id := p_id_municipio;

    END IF;

    INSERT INTO public.auditorias (
        id_usuario_fk, tabla_afectada, accion,
        valor_anterior, valor_nuevo, razon_cambio
    )
    VALUES (
        v_actor,
        'municipios',
        CASE WHEN p_id_municipio IS NULL
             THEN 'MUNICIPIO_CREADO'
             ELSE 'MUNICIPIO_EDITADO' END,
        CASE WHEN p_id_municipio IS NULL
             THEN NULL
             ELSE jsonb_build_object(
                 'nombre', v_anterior.nombre_municipio,
                 'departamento', v_anterior.departamento
             ) END,
        jsonb_build_object(
            'id', v_id,
            'nombre', v_nombre,
            'departamento', v_departamento
        ),
        'Gestión administrativa de municipios'
    );

    RETURN v_id;
END;
$function$;
REVOKE ALL ON FUNCTION public.sigre_admin_guardar_municipio(p_id_municipio integer, p_nombre_municipio text, p_departamento text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sigre_admin_guardar_municipio(p_id_municipio integer, p_nombre_municipio text, p_departamento text) TO authenticated, service_role;

-- sigre_admin_guardar_permisos_rol(p_id_rol smallint, p_permisos jsonb) · md5 STAGING c78a7a011804fa9940960877db832d2a
CREATE OR REPLACE FUNCTION public.sigre_admin_guardar_permisos_rol(p_id_rol smallint, p_permisos jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    v_actor uuid := auth.uid();
    v_rol public.roles%ROWTYPE;
    v_item jsonb;
    v_id_pantalla_accion uuid;
    v_nivel text;
    v_permiso public.rol_pantalla_permisos%ROWTYPE;
    v_resultado uuid := pg_catalog.gen_random_uuid();
    v_ids uuid[] := ARRAY[]::uuid[];
    v_cambios integer := 0;
BEGIN

    IF v_actor IS NULL
       OR NOT COALESCE(public.tiene_rol('administrador'), false)
       OR NOT COALESCE(
           public.tiene_permiso('control_accesos', 'editar'),
           false
       )
    THEN
        RAISE EXCEPTION 'No autorizado para administrar permisos'
            USING ERRCODE = '42501';
    END IF;

    IF p_id_rol IS NULL
       OR p_permisos IS NULL
       OR jsonb_typeof(p_permisos) <> 'array'
    THEN
        RAISE EXCEPTION 'Rol o configuración de permisos inválida'
            USING ERRCODE = '22023';
    END IF;

    -- Serializar cambios a permisos.
    PERFORM pg_catalog.pg_advisory_xact_lock(2026, 1005);

    SELECT *
    INTO v_rol
    FROM public.roles
    WHERE id = p_id_rol
    FOR UPDATE;

    IF NOT FOUND
       OR v_rol.estado IS DISTINCT FROM 'activo'
       OR v_rol.deleted_at IS NOT NULL
    THEN
        RAISE EXCEPTION 'Rol inexistente o inactivo'
            USING ERRCODE = '22023';
    END IF;

    -- Protección de la administración del sistema.
    IF v_rol.nombre_rol = 'administrador' THEN
        RAISE EXCEPTION
            'Los permisos del administrador requieren un procedimiento protegido'
            USING ERRCODE = '42501';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM jsonb_array_elements(p_permisos) x
        WHERE jsonb_typeof(x) <> 'object'
           OR NOT (x ? 'id_pantalla_accion')
           OR NOT (x ? 'nivel_acceso')
           OR x->>'id_pantalla_accion' IS NULL
           OR x->>'nivel_acceso' IS NULL
    ) THEN
        RAISE EXCEPTION 'Formato de permisos inválido'
            USING ERRCODE = '22023';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM (
            SELECT x->>'id_pantalla_accion'
            FROM jsonb_array_elements(p_permisos) x
            GROUP BY x->>'id_pantalla_accion'
            HAVING count(*) > 1
        ) d
    ) THEN
        RAISE EXCEPTION 'La solicitud contiene permisos duplicados'
            USING ERRCODE = '22023';
    END IF;

    -- Validar toda la solicitud antes de modificar registros.
    FOR v_item IN
        SELECT value
        FROM jsonb_array_elements(p_permisos)
        ORDER BY value->>'id_pantalla_accion'
    LOOP

        v_id_pantalla_accion :=
            (v_item->>'id_pantalla_accion')::uuid;

        v_nivel := v_item->>'nivel_acceso';

        IF v_id_pantalla_accion IS NULL
           OR v_nivel NOT IN ('SL', 'LE', 'AT')
        THEN
            RAISE EXCEPTION 'Permiso o nivel de acceso inválido'
                USING ERRCODE = '22023';
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM public.pantalla_acciones pa
            JOIN public.app_pantallas p
              ON p.id = pa.id_pantalla_fk
            JOIN public.app_acciones a
              ON a.id = pa.id_accion_fk
            JOIN public.app_modulos m
              ON m.id = p.modulo_id
            WHERE pa.id = v_id_pantalla_accion
              AND pa.estado = 'activo'
              AND p.estado = 'activo'
              AND p.deleted_at IS NULL
              AND a.estado = 'activo'
              AND a.deleted_at IS NULL
              AND m.deleted_at IS NULL
        ) THEN
            RAISE EXCEPTION 'Pantalla o acción inexistente o inactiva'
                USING ERRCODE = '22023';
        END IF;

        v_ids := array_append(v_ids, v_id_pantalla_accion);

    END LOOP;

    -- Deshabilitar permisos omitidos.
    FOR v_permiso IN
        SELECT *
        FROM public.rol_pantalla_permisos
        WHERE id_rol_fk = p_id_rol
          AND habilitado IS TRUE
          AND (
              id_pantalla_accion_fk IS NULL
              OR NOT (id_pantalla_accion_fk = ANY(v_ids))
          )
        FOR UPDATE
    LOOP

        UPDATE public.rol_pantalla_permisos
        SET habilitado = false,
            estado = 'inactivo'
        WHERE id = v_permiso.id;

        INSERT INTO public.permiso_cambios_logs (
            id_permiso_fk,
            id_usuario_fk,
            anterior_valor,
            nuevo_valor,
            razones_cambios
        )
        VALUES (
            v_permiso.id,
            v_actor,
            jsonb_build_object(
                'habilitado', v_permiso.habilitado,
                'nivel_acceso', v_permiso.nivel_acceso,
                'estado', v_permiso.estado
            ),
            jsonb_build_object(
                'habilitado', false,
                'nivel_acceso', v_permiso.nivel_acceso,
                'estado', 'inactivo'
            ),
            'Permiso deshabilitado desde Control de Accesos'
        );

        v_cambios := v_cambios + 1;

    END LOOP;

    -- Crear o actualizar los permisos incluidos.
    FOREACH v_id_pantalla_accion IN ARRAY v_ids
    LOOP

        SELECT x->>'nivel_acceso'
        INTO v_nivel
        FROM jsonb_array_elements(p_permisos) x
        WHERE (x->>'id_pantalla_accion')::uuid =
              v_id_pantalla_accion;

        SELECT *
        INTO v_permiso
        FROM public.rol_pantalla_permisos
        WHERE id_rol_fk = p_id_rol
          AND id_pantalla_accion_fk = v_id_pantalla_accion
        FOR UPDATE;

        IF FOUND THEN

            IF v_permiso.habilitado IS DISTINCT FROM true
               OR v_permiso.estado IS DISTINCT FROM 'activo'
               OR v_permiso.nivel_acceso IS DISTINCT FROM v_nivel
            THEN

                UPDATE public.rol_pantalla_permisos
                SET habilitado = true,
                    estado = 'activo',
                    nivel_acceso = v_nivel
                WHERE id = v_permiso.id;

                INSERT INTO public.permiso_cambios_logs (
                    id_permiso_fk,
                    id_usuario_fk,
                    anterior_valor,
                    nuevo_valor,
                    razones_cambios
                )
                VALUES (
                    v_permiso.id,
                    v_actor,
                    jsonb_build_object(
                        'habilitado', v_permiso.habilitado,
                        'nivel_acceso', v_permiso.nivel_acceso,
                        'estado', v_permiso.estado
                    ),
                    jsonb_build_object(
                        'habilitado', true,
                        'nivel_acceso', v_nivel,
                        'estado', 'activo'
                    ),
                    'Permiso actualizado desde Control de Accesos'
                );

                v_cambios := v_cambios + 1;

            END IF;

        ELSE

            INSERT INTO public.rol_pantalla_permisos (
                id_rol_fk,
                id_pantalla_accion_fk,
                habilitado,
                nivel_acceso,
                estado
            )
            VALUES (
                p_id_rol,
                v_id_pantalla_accion,
                true,
                v_nivel,
                'activo'
            )
            RETURNING *
            INTO v_permiso;

            INSERT INTO public.permiso_cambios_logs (
                id_permiso_fk,
                id_usuario_fk,
                anterior_valor,
                nuevo_valor,
                razones_cambios
            )
            VALUES (
                v_permiso.id,
                v_actor,
                NULL,
                jsonb_build_object(
                    'habilitado', true,
                    'nivel_acceso', v_nivel,
                    'estado', 'activo'
                ),
                'Permiso creado desde Control de Accesos'
            );

            v_cambios := v_cambios + 1;

        END IF;

    END LOOP;

    IF v_cambios = 0 THEN
        RAISE EXCEPTION 'La configuración no presenta cambios'
            USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.auditorias (
        id_usuario_fk,
        tabla_afectada,
        accion,
        valor_anterior,
        valor_nuevo,
        razon_cambio
    )
    VALUES (
        v_actor,
        'rol_pantalla_permisos',
        'PERMISOS_ROL_ACTUALIZADOS',
        jsonb_build_object(
            'id_rol', p_id_rol
        ),
        jsonb_build_object(
            'id_rol', p_id_rol,
            'cantidad_permisos_solicitados',
            cardinality(v_ids),
            'cantidad_cambios', v_cambios,
            'operacion', v_resultado
        ),
        'Actualización administrativa de permisos por rol'
    );

    RETURN v_resultado;
END;
$function$;
REVOKE ALL ON FUNCTION public.sigre_admin_guardar_permisos_rol(p_id_rol smallint, p_permisos jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sigre_admin_guardar_permisos_rol(p_id_rol smallint, p_permisos jsonb) TO authenticated, service_role;

-- sigre_registrar_usuario_invitado(p_id_usuario uuid, p_id_administrador uuid, p_correo text, p_primer_nombre text, p_segundo_nombre text, p_primer_apellido text, p_segundo_apellido text, p_tipo_documento text, p_numero_documento text, p_numero_telefono text, p_id_municipio integer, p_id_rol smallint) · md5 STAGING 2ddeb606a73d12eed215bf6357251d4f
CREATE OR REPLACE FUNCTION public.sigre_registrar_usuario_invitado(p_id_usuario uuid, p_id_administrador uuid, p_correo text, p_primer_nombre text, p_segundo_nombre text, p_primer_apellido text, p_segundo_apellido text, p_tipo_documento text, p_numero_documento text, p_numero_telefono text, p_id_municipio integer, p_id_rol smallint)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    v_correo text;
BEGIN
    v_correo := lower(nullif(btrim(p_correo), ''));

    -- 1. Exigir el contexto de servidor.
    IF current_user <> 'postgres'
       AND current_user <> 'service_role'
    THEN
        RAISE EXCEPTION 'Operación exclusiva del servidor'
            USING ERRCODE = '42501';
    END IF;

    -- 2. Validar campos obligatorios.
    IF p_id_usuario IS NULL
       OR p_id_administrador IS NULL
       OR v_correo IS NULL
       OR nullif(btrim(p_primer_nombre), '') IS NULL
       OR nullif(btrim(p_primer_apellido), '') IS NULL
       OR nullif(btrim(p_tipo_documento), '') IS NULL
       OR nullif(btrim(p_numero_documento), '') IS NULL
       OR p_id_rol IS NULL
    THEN
        RAISE EXCEPTION 'Datos obligatorios incompletos'
            USING ERRCODE = '22023';
    END IF;

    -- 3. Limitar los roles que pueden asignarse.
    IF p_id_rol NOT IN (1, 2, 5) THEN
        RAISE EXCEPTION 'Rol no permitido para invitación'
            USING ERRCODE = '42501';
    END IF;

    -- 4. Verificar administrador activo y permiso usuarios.crear.
    IF NOT EXISTS (
        SELECT 1
        FROM public.usuarios u
        JOIN public.usuario_roles ur
          ON ur.id_usuario_fk = u.id
        JOIN public.roles r
          ON r.id = ur.id_rol_fk
        JOIN public.rol_pantalla_permisos rpp
          ON rpp.id_rol_fk = r.id
        JOIN public.pantalla_acciones pa
          ON pa.id = rpp.id_pantalla_accion_fk
        JOIN public.app_acciones a
          ON a.id = pa.id_accion_fk
        JOIN public.app_pantallas p
          ON p.id = pa.id_pantalla_fk
        JOIN public.app_modulos m
          ON m.id = p.modulo_id
        WHERE u.id = p_id_administrador
          AND u.estado = 'activo'
          AND u.deleted_at IS NULL
          AND ur.estado = 'activo'
          AND ur.deleted_at IS NULL
          AND r.nombre_rol = 'administrador'
          AND r.estado = 'activo'
          AND r.deleted_at IS NULL
          AND rpp.estado = 'activo'
          AND rpp.habilitado IS TRUE
          AND pa.estado = 'activo'
          AND a.codigo = 'crear'
          AND a.estado = 'activo'
          AND a.deleted_at IS NULL
          AND p.estado = 'activo'
          AND p.deleted_at IS NULL
          AND m.codigo = 'usuarios'
          AND m.deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION
            'Administrador sin permiso usuarios.crear'
            USING ERRCODE = '42501';
    END IF;

    -- 5. Comprobar rol de destino.
    IF NOT EXISTS (
        SELECT 1
        FROM public.roles
        WHERE id = p_id_rol
          AND estado = 'activo'
          AND deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'Rol inexistente o inactivo'
            USING ERRCODE = '22023';
    END IF;

    -- 6. Comprobar municipio, cuando se suministra.
    IF p_id_municipio IS NOT NULL
       AND NOT EXISTS (
           SELECT 1
           FROM public.municipios
           WHERE id = p_id_municipio
             AND esta_activo IS TRUE
       )
    THEN
        RAISE EXCEPTION 'Municipio inválido'
            USING ERRCODE = '22023';
    END IF;

    -- 7. Confirmar correspondencia con Supabase Auth.
    IF NOT EXISTS (
        SELECT 1
        FROM auth.users
        WHERE id = p_id_usuario
          AND lower(email) = v_correo
    ) THEN
        RAISE EXCEPTION
            'Usuario Auth no encontrado o correo diferente'
            USING ERRCODE = '23503';
    END IF;

    -- 8. Registrar perfil.
    INSERT INTO public.usuarios (
        id,
        correo_electronico,
        primer_nombre,
        segundo_nombre,
        primer_apellido,
        segundo_apellido,
        tipo_documento,
        numero_documento,
        numero_telefono,
        id_municipio_fk,
        estado,
        created_at
    )
    VALUES (
        p_id_usuario,
        v_correo,
        btrim(p_primer_nombre),
        nullif(btrim(p_segundo_nombre), ''),
        btrim(p_primer_apellido),
        nullif(btrim(p_segundo_apellido), ''),
        btrim(p_tipo_documento),
        btrim(p_numero_documento),
        nullif(btrim(p_numero_telefono), ''),
        p_id_municipio,
        'activo',
        now()
    );

    -- 9. Asignar rol.
    INSERT INTO public.usuario_roles (
        id_usuario_fk,
        id_rol_fk,
        estado
    )
    VALUES (
        p_id_usuario,
        p_id_rol,
        'activo'
    );

    -- 10. Registrar auditoría.
    INSERT INTO public.auditorias (
        id_usuario_fk,
        tabla_afectada,
        accion,
        valor_anterior,
        valor_nuevo,
        razon_cambio
    )
    VALUES (
        p_id_administrador,
        'usuarios',
        'USUARIO_INVITADO',
        NULL,
        pg_catalog.jsonb_build_object(
            'id_usuario', p_id_usuario,
            'correo_electronico', v_correo,
            'id_rol', p_id_rol
        ),
        'Invitación administrativa desde SIGRE'
    );

    RETURN p_id_usuario;
END;
$function$;
REVOKE ALL ON FUNCTION public.sigre_registrar_usuario_invitado(p_id_usuario uuid, p_id_administrador uuid, p_correo text, p_primer_nombre text, p_segundo_nombre text, p_primer_apellido text, p_segundo_apellido text, p_tipo_documento text, p_numero_documento text, p_numero_telefono text, p_id_municipio integer, p_id_rol smallint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sigre_registrar_usuario_invitado(p_id_usuario uuid, p_id_administrador uuid, p_correo text, p_primer_nombre text, p_segundo_nombre text, p_primer_apellido text, p_segundo_apellido text, p_tipo_documento text, p_numero_documento text, p_numero_telefono text, p_id_municipio integer, p_id_rol smallint) TO service_role;
