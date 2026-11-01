-- SIGRE · Rol Evaluador: acceso de solo lectura al Panel (panel_principal / ver, nivel SL).
-- Habilita el Dashboard personalizado del evaluador. NO concede crear, editar, eliminar ni exportar,
-- ni toca otras pantallas, otros roles ni RLS. El alcance de datos lo siguen imponiendo RLS y el frontend.
-- Resuelve ids por código. Idempotente: actualiza o inserta solo la fila (evaluador, panel_principal/ver).
-- Reversión: supabase/proposals/evaluador_permiso_panel_ver_reversion.sql
--
-- Estado en STAGING: el permiso se activó desde Control de accesos (sigre_admin_guardar_permisos_rol),
-- que deja la fila con habilitado = true, nivel_acceso = 'SL', estado = 'activo' y registra el cambio en
-- permiso_cambios_logs. Esta migración reproduce ese estado final para entornos nuevos, donde la línea base
-- (20261001000100_catalogos_base.sql) trae la fila deshabilitada (habilitado = false, SL, inactivo).
-- NO ejecutarla en STAGING: confirmar el estado con supabase/diagnostics/evaluador_panel_ver_estado.sql (solo
-- lectura) y registrarla como aplicada (supabase migration repair --status applied 20261031120000).
-- Si se ejecutara por error en STAGING con ese estado, el UPDATE no afecta filas y el INSERT se omite (sin efecto).

DO $$
DECLARE
    v_rol smallint;
    v_pantalla_accion uuid;
BEGIN
    SELECT id INTO v_rol FROM public.roles WHERE lower(nombre_rol) = 'evaluador' AND deleted_at IS NULL;
    IF v_rol IS NULL THEN
        RAISE EXCEPTION 'Migración abortada: no existe el rol evaluador';
    END IF;

    SELECT pa.id INTO v_pantalla_accion
    FROM public.pantalla_acciones pa
    JOIN public.app_pantallas p ON p.id = pa.id_pantalla_fk
    JOIN public.app_acciones a ON a.id = pa.id_accion_fk
    WHERE p.codigo = 'panel_principal' AND a.codigo = 'ver';
    IF v_pantalla_accion IS NULL THEN
        RAISE EXCEPTION 'Migración abortada: no existe la acción ver de panel_principal';
    END IF;

    UPDATE public.rol_pantalla_permisos
    SET habilitado = true, nivel_acceso = 'SL', estado = 'activo'
    WHERE id_rol_fk = v_rol AND id_pantalla_accion_fk = v_pantalla_accion
      AND (habilitado IS DISTINCT FROM true OR nivel_acceso IS DISTINCT FROM 'SL' OR estado IS DISTINCT FROM 'activo');

    IF NOT EXISTS (SELECT 1 FROM public.rol_pantalla_permisos
                   WHERE id_rol_fk = v_rol AND id_pantalla_accion_fk = v_pantalla_accion) THEN
        INSERT INTO public.rol_pantalla_permisos (id_rol_fk, id_pantalla_accion_fk, habilitado, nivel_acceso, estado)
        VALUES (v_rol, v_pantalla_accion, true, 'SL', 'activo');
    END IF;
END $$;
