-- SIGRE · Orientaciones · VERIFICACIÓN DE DATOS DEMO (SOLO LECTURA) · STAGING.
-- Una sola consulta: devuelve un informe JSON. No modifica nada. Ejecutable en cualquier paso del lote;
-- "listo_para_pruebas": true exige perfiles, ficha de DEMO-Carlos y jornada del Orientador.

WITH demo AS (
    SELECT
        (SELECT id FROM public.usuarios WHERE lower(correo_electronico) = 'demo.orientador@example.com')   AS orientador,
        (SELECT id FROM public.usuarios WHERE lower(correo_electronico) = 'demo.emprendedor2@example.com') AS emprendedor2
), ficha AS (
    SELECT e.* FROM public.emprendedores e, demo d WHERE e.usuario_id = d.emprendedor2 AND e.deleted_at IS NULL
), jornada AS (
    SELECT o.* FROM public.orientaciones o, demo d
    WHERE o.tema = 'DEMO-Jornada Orientador' AND o.id_orientador_fk = d.orientador AND o.deleted_at IS NULL
)
SELECT jsonb_pretty(jsonb_build_object(
    'staging', EXISTS (SELECT 1 FROM auth.users WHERE id = 'bbd440b7-717e-416c-a2e7-0a33ee1d1320'),
    'auth', (SELECT jsonb_agg(jsonb_build_object('id', id, 'correo', email, 'confirmada', email_confirmed_at IS NOT NULL))
             FROM auth.users WHERE lower(email) IN ('demo.orientador@example.com', 'demo.emprendedor2@example.com')),
    'perfiles', (SELECT jsonb_agg(jsonb_build_object('id', u.id, 'correo', u.correo_electronico, 'estado', u.estado,
                                                     'roles', (SELECT jsonb_agg(r.nombre_rol || ':' || ur.estado)
                                                               FROM public.usuario_roles ur JOIN public.roles r ON r.id = ur.id_rol_fk
                                                               WHERE ur.id_usuario_fk = u.id AND ur.deleted_at IS NULL)))
                 FROM public.usuarios u, demo d WHERE u.id IN (d.orientador, d.emprendedor2)),
    'ficha_emprendedor2', (SELECT jsonb_build_object('id', f.id, 'nombre', f.nombre_completo, 'estado', f.estado,
                                                     'centro', f.id_centro_sena_fk) FROM ficha f),
    'jornada_orientador', (SELECT jsonb_build_object('id', j.id, 'fecha', j.fecha, 'hora_inicio', j.hora_inicio,
                                                     'cupo', j.cupo, 'estado', j.estado,
                                                     'inscritos', (SELECT count(*) FROM public.orientacion_inscripciones i
                                                                   WHERE i.id_orientacion_fk = j.id AND i.deleted_at IS NULL))
                           FROM jornada j),
    'laura', jsonb_build_object(
        'jornada_original', (SELECT jsonb_build_object('fecha', fecha, 'cupo', cupo, 'estado', estado)
                             FROM public.orientaciones WHERE id = 'e2997c86-64c4-45ae-8046-ce3cd622e13e'),
        'huella_jornada_original', (SELECT md5(to_jsonb(o)::text) FROM public.orientaciones o
                                    WHERE o.id = 'e2997c86-64c4-45ae-8046-ce3cd622e13e'),
        'inscripciones', (SELECT jsonb_agg(jsonb_build_object('id', id, 'jornada', id_orientacion_fk,
                                                              'eliminada', deleted_at IS NOT NULL) ORDER BY id)
                          FROM public.orientacion_inscripciones
                          WHERE id_emprendedor_fk = '4f19797f-03fd-4e37-99f1-b85abbdafd30'),
        'asistencias', (SELECT jsonb_agg(jsonb_build_object('id', id, 'jornada', id_orientacion_fk, 'estado', estado_asistencia,
                                                            'eliminada', deleted_at IS NOT NULL) ORDER BY id)
                        FROM public.asistencias
                        WHERE id_emprendedor_fk = '4f19797f-03fd-4e37-99f1-b85abbdafd30')),
    'permisos_orientador_en_orientaciones', (
        SELECT jsonb_agg(DISTINCT rpp.nivel_acceso || ' (' || coalesce(rpp.estado, 'sin estado') || ')')
        FROM public.rol_pantalla_permisos rpp
        JOIN public.roles r ON r.id = rpp.id_rol_fk AND lower(r.nombre_rol) = 'orientador'
        JOIN public.pantalla_acciones pa ON pa.id = rpp.id_pantalla_accion_fk
        JOIN public.app_pantallas ap ON ap.id = pa.id_pantalla_fk
        WHERE ap.codigo = 'orientaciones_principal'),
    'politicas_inscripciones', (SELECT count(*) FROM pg_policies
                                WHERE schemaname = 'public' AND tablename = 'orientacion_inscripciones'),
    'trigger_asistencia', EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'sigre_asistencias_validar_inicio'),
    'firmas_rpc', (SELECT jsonb_agg(p.proname || '(' || pg_get_function_arguments(p.oid) || ')' ORDER BY p.proname)
                   FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                   WHERE n.nspname = 'public' AND p.proname IN ('sigre_inscribir_en_jornada', 'sigre_registrar_asistencia',
                                                                 'sigre_listar_inscritos_asistencia')),
    'parametros_pruebas', (SELECT jsonb_build_object('v_orientador', d.orientador, 'v_emp2_usuario', d.emprendedor2,
                                                     'v_emp2_ficha', (SELECT id FROM ficha))
                           FROM demo d),
    'listo_para_pruebas', (SELECT count(*) = 2 FROM auth.users
                           WHERE lower(email) IN ('demo.orientador@example.com', 'demo.emprendedor2@example.com')
                             AND email_confirmed_at IS NOT NULL AND deleted_at IS NULL)
                          AND EXISTS (SELECT 1 FROM demo d
                                      JOIN public.usuario_roles ur ON ur.id_usuario_fk = d.orientador
                                      JOIN public.roles r ON r.id = ur.id_rol_fk
                                      WHERE lower(r.nombre_rol) = 'orientador' AND ur.estado = 'activo' AND ur.deleted_at IS NULL)
                          AND EXISTS (SELECT 1 FROM demo d
                                      JOIN public.usuario_roles ur ON ur.id_usuario_fk = d.emprendedor2
                                      JOIN public.roles r ON r.id = ur.id_rol_fk
                                      WHERE lower(r.nombre_rol) = 'emprendedor' AND ur.estado = 'activo' AND ur.deleted_at IS NULL)
                          AND EXISTS (SELECT 1 FROM ficha) AND EXISTS (SELECT 1 FROM jornada)
)) AS verificacion;
