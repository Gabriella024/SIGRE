-- SIGRE · DATOS DEMO PERSISTENTES (NO APLICADO) · Requiere autorización expresa antes de ejecutarse.
-- Destino exclusivo: STAGING (febelffifcqzvnttpued). Prohibido en PRODUCTION.
-- Requisito: orientaciones_demo_usuarios.sql aplicado (Orientador DEMO con rol orientador activo).
-- Crea UNA jornada DEMO asignada al Orientador DEMO, futura (mañana en America/Bogota, 10:00-11:00),
-- cupo 3, centro DEMO-CCS. Las inscripciones se hacen después desde la UI como Orientador DEMO.
-- Conserva intacta la jornada DEMO original (e2997c86-...), la inscripción y la asistencia de Laura:
-- compara su huella antes y después. Cualquier guarda fallida aborta toda la transacción.

BEGIN;

DROP TABLE IF EXISTS _demo_jornada_informe;
CREATE TEMP TABLE _demo_jornada_informe (informe text);

DO $$
DECLARE
    -- PARÁMETROS ---------------------------------------------------------------------------------
    v_orientador constant uuid := NULL; -- usuarios.id de demo.orientador@example.com
    v_fecha      constant date := (now() AT TIME ZONE 'America/Bogota')::date + 1;
    v_inicio     constant time := '10:00';
    v_fin        constant time := '11:00';
    ------------------------------------------------------------------------------------------------
    v_laura          constant uuid := 'bbd440b7-717e-416c-a2e7-0a33ee1d1320';
    v_laura_ficha    constant uuid := '4f19797f-03fd-4e37-99f1-b85abbdafd30';
    v_jornada_laura  constant uuid := 'e2997c86-64c4-45ae-8046-ce3cd622e13e';
    v_tema           constant text := 'DEMO-Jornada Orientador';
    v_centro   uuid;
    v_jornada  uuid;
    v_faltan   text;
    v_huella_antes   text;
    v_huella_despues text;
    v_laura_antes    jsonb;
    v_laura_despues  jsonb;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_laura) THEN
        RAISE EXCEPTION 'ABORTADO: este proyecto no es STAGING';
    END IF;
    IF v_orientador IS NULL THEN
        RAISE EXCEPTION 'ABORTADO: completar el UUID del Orientador DEMO';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.usuarios u
                   JOIN public.usuario_roles ur ON ur.id_usuario_fk = u.id
                   JOIN public.roles r ON r.id = ur.id_rol_fk
                   WHERE u.id = v_orientador AND lower(u.correo_electronico) = 'demo.orientador@example.com'
                     AND u.estado = 'activo' AND u.deleted_at IS NULL
                     AND lower(r.nombre_rol) = 'orientador' AND ur.estado = 'activo' AND ur.deleted_at IS NULL) THEN
        RAISE EXCEPTION 'ABORTADO: % no es el Orientador DEMO activo', v_orientador;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.orientaciones WHERE id = v_jornada_laura AND deleted_at IS NULL) THEN
        RAISE EXCEPTION 'ABORTADO: no se encuentra la jornada DEMO original de Laura';
    END IF;
    IF EXISTS (SELECT 1 FROM public.orientaciones WHERE tema = v_tema) THEN
        RAISE EXCEPTION 'ABORTADO: la jornada "%" ya existe (incluidas eliminadas); no se duplica', v_tema;
    END IF;

    SELECT id INTO v_centro FROM public.sena_centros
    WHERE codigo = 'DEMO-CCS' AND estado = 'activo' AND deleted_at IS NULL;
    IF v_centro IS NULL THEN
        RAISE EXCEPTION 'ABORTADO: centro DEMO-CCS no encontrado o inactivo';
    END IF;

    -- Columnas obligatorias sin valor por defecto que este script no rellena.
    SELECT string_agg(c.column_name, ', ') INTO v_faltan
    FROM information_schema.columns c
    WHERE c.table_schema = 'public' AND c.table_name = 'orientaciones'
      AND c.is_nullable = 'NO' AND c.column_default IS NULL AND c.is_identity = 'NO'
      AND c.column_name NOT IN ('tema', 'descripcion', 'fecha', 'hora_inicio', 'hora_fin', 'modalidad',
                                'lugar_link', 'estado', 'id_orientador_fk', 'cupo', 'id_centro_sena_fk', 'observaciones');
    IF v_faltan IS NOT NULL THEN
        RAISE EXCEPTION 'ABORTADO: orientaciones exige columnas no contempladas: %', v_faltan;
    END IF;

    -- Huella de TODAS las jornadas, inscripciones y asistencias existentes (incluidas las de Laura).
    -- v_jornada es NULL antes del INSERT, así que la misma consulta sirve antes y después.
    SELECT md5(coalesce(string_agg(x, '|' ORDER BY x), '')) INTO v_huella_antes FROM (
        SELECT 'o' || to_jsonb(o)::text AS x FROM public.orientaciones o WHERE o.id IS DISTINCT FROM v_jornada
        UNION ALL
        SELECT 'i' || to_jsonb(i)::text FROM public.orientacion_inscripciones i
        UNION ALL
        SELECT 'a' || to_jsonb(a)::text FROM public.asistencias a
    ) t;
    SELECT jsonb_build_object(
               'jornada_original', (SELECT md5(to_jsonb(o)::text) FROM public.orientaciones o WHERE o.id = v_jornada_laura),
               'inscripciones', (SELECT count(*) FROM public.orientacion_inscripciones WHERE id_emprendedor_fk = v_laura_ficha),
               'asistencias', (SELECT count(*) FROM public.asistencias WHERE id_emprendedor_fk = v_laura_ficha))
    INTO v_laura_antes;

    INSERT INTO public.orientaciones (tema, descripcion, fecha, hora_inicio, hora_fin, modalidad, lugar_link,
                                      estado, id_orientador_fk, cupo, id_centro_sena_fk, observaciones)
    VALUES (v_tema, 'Jornada DEMO para validar el alcance del rol Orientador.', v_fecha, v_inicio, v_fin,
            'presencial', 'Centro de Comercio y Servicios (DEMO)', 'programada', v_orientador, 3, v_centro,
            'Datos DEMO de STAGING')
    RETURNING id INTO v_jornada;

    SELECT md5(coalesce(string_agg(x, '|' ORDER BY x), '')) INTO v_huella_despues FROM (
        SELECT 'o' || to_jsonb(o)::text AS x FROM public.orientaciones o WHERE o.id IS DISTINCT FROM v_jornada
        UNION ALL
        SELECT 'i' || to_jsonb(i)::text FROM public.orientacion_inscripciones i
        UNION ALL
        SELECT 'a' || to_jsonb(a)::text FROM public.asistencias a
    ) t;
    SELECT jsonb_build_object(
               'jornada_original', (SELECT md5(to_jsonb(o)::text) FROM public.orientaciones o WHERE o.id = v_jornada_laura),
               'inscripciones', (SELECT count(*) FROM public.orientacion_inscripciones WHERE id_emprendedor_fk = v_laura_ficha),
               'asistencias', (SELECT count(*) FROM public.asistencias WHERE id_emprendedor_fk = v_laura_ficha))
    INTO v_laura_despues;
    IF v_huella_despues IS DISTINCT FROM v_huella_antes OR v_laura_despues IS DISTINCT FROM v_laura_antes THEN
        RAISE EXCEPTION 'ABORTADO: cambiaron jornadas, inscripciones o asistencias existentes (Laura antes %, después %)',
            v_laura_antes, v_laura_despues;
    END IF;
    IF (SELECT count(*) FROM public.orientaciones WHERE id_orientador_fk = v_orientador) <> 1 THEN
        RAISE EXCEPTION 'ABORTADO: el Orientador DEMO debe tener exactamente 1 jornada';
    END IF;

    INSERT INTO _demo_jornada_informe (informe)
    SELECT jsonb_pretty(jsonb_build_object(
        'resultado', 'ACEPTADO',
        'jornada', (SELECT jsonb_build_object('id', o.id, 'tema', o.tema, 'fecha', o.fecha,
                                              'hora_inicio', o.hora_inicio, 'hora_fin', o.hora_fin, 'cupo', o.cupo,
                                              'estado', o.estado, 'id_orientador_fk', o.id_orientador_fk,
                                              'centro', v_centro)
                    FROM public.orientaciones o WHERE o.id = v_jornada),
        'datos_existentes_sin_cambios', v_huella_despues = v_huella_antes,
        'datos_laura_sin_cambios', v_laura_despues = v_laura_antes,
        'laura', v_laura_despues,
        'jornadas_del_orientador', (SELECT count(*) FROM public.orientaciones
                                    WHERE id_orientador_fk = v_orientador AND deleted_at IS NULL)));
END;
$$;

COMMIT;

-- Esperado: "resultado": "ACEPTADO", "jornadas_del_orientador": 1. Anotar jornada.id para la UI.
SELECT informe FROM _demo_jornada_informe;

-- ============================== REVERSIÓN ==============================
-- Borrado lógico (conserva trazabilidad); solo si no se desea mantener la jornada DEMO:
-- UPDATE public.orientaciones SET deleted_at = now()
-- WHERE tema = 'DEMO-Jornada Orientador' AND id_orientador_fk = '<uuid orientador>' AND deleted_at IS NULL;
