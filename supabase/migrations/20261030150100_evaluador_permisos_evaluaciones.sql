-- SIGRE · Permisos del rol Evaluador en la pantalla Evaluación (evaluaciones_principal).
-- Reproduce lo guardado en STAGING el 2026-10-30 desde Control de accesos (sigre_admin_guardar_permisos_rol):
--   ver, crear, editar → habilitado, nivel LE (el Evaluador consulta y registra solo sus calificaciones;
--   el alcance real lo imponen RLS y sigre_evaluador_registrar_calificacion).
--   exportar, eliminar → deshabilitados (SA en la matriz).
-- Resuelve ids por código (sin UUID de entorno). Idempotente: no modifica otras filas ni otros roles.

DO $$
DECLARE
    v_rol smallint;
    v_faltan text;
    r record;
BEGIN
    SELECT id INTO v_rol FROM public.roles WHERE lower(nombre_rol) = 'evaluador' AND deleted_at IS NULL;
    IF v_rol IS NULL THEN
        RAISE EXCEPTION 'Migración abortada: no existe el rol evaluador';
    END IF;

    SELECT string_agg(a.codigo, ', ') INTO v_faltan
    FROM unnest(ARRAY['ver', 'exportar', 'crear', 'editar', 'eliminar']) AS a(codigo)
    WHERE NOT EXISTS (
        SELECT 1 FROM public.pantalla_acciones pa
        JOIN public.app_pantallas p ON p.id = pa.id_pantalla_fk
        JOIN public.app_acciones ac ON ac.id = pa.id_accion_fk
        WHERE p.codigo = 'evaluaciones_principal' AND ac.codigo = a.codigo);
    IF v_faltan IS NOT NULL THEN
        RAISE EXCEPTION 'Migración abortada: faltan acciones de evaluaciones_principal: %', v_faltan;
    END IF;

    FOR r IN
        SELECT pa.id AS id_pantalla_accion, ac.codigo IN ('ver', 'crear', 'editar') AS habilitar
        FROM public.pantalla_acciones pa
        JOIN public.app_pantallas p ON p.id = pa.id_pantalla_fk
        JOIN public.app_acciones ac ON ac.id = pa.id_accion_fk
        WHERE p.codigo = 'evaluaciones_principal'
          AND ac.codigo IN ('ver', 'exportar', 'crear', 'editar', 'eliminar')
    LOOP
        IF r.habilitar THEN
            UPDATE public.rol_pantalla_permisos
            SET habilitado = true, nivel_acceso = 'LE', estado = 'activo', updated_at = now()
            WHERE id_rol_fk = v_rol AND id_pantalla_accion_fk = r.id_pantalla_accion
              AND (habilitado IS DISTINCT FROM true OR nivel_acceso IS DISTINCT FROM 'LE' OR estado IS DISTINCT FROM 'activo');

            IF NOT EXISTS (SELECT 1 FROM public.rol_pantalla_permisos
                           WHERE id_rol_fk = v_rol AND id_pantalla_accion_fk = r.id_pantalla_accion) THEN
                INSERT INTO public.rol_pantalla_permisos (id_rol_fk, id_pantalla_accion_fk, habilitado, nivel_acceso, estado)
                VALUES (v_rol, r.id_pantalla_accion, true, 'LE', 'activo');
            END IF;
        ELSE
            UPDATE public.rol_pantalla_permisos
            SET habilitado = false, estado = 'inactivo', updated_at = now()
            WHERE id_rol_fk = v_rol AND id_pantalla_accion_fk = r.id_pantalla_accion
              AND (habilitado IS DISTINCT FROM false OR estado IS DISTINCT FROM 'inactivo');
        END IF;
    END LOOP;
END $$;
