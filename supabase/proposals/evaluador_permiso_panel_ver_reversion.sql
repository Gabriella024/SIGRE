-- SIGRE · Reversión de 20261031120000_evaluador_permiso_panel_ver.sql.
-- Deshabilita únicamente la fila (evaluador, panel_principal/ver). No toca otras filas, roles ni RLS.
-- Si antes del cambio la fila no existía, también puede eliminarse; se deshabilita para conservar el historial.

UPDATE public.rol_pantalla_permisos rpp
SET habilitado = false, estado = 'inactivo'
FROM public.roles r, public.pantalla_acciones pa, public.app_pantallas p, public.app_acciones a
WHERE r.id = rpp.id_rol_fk AND lower(r.nombre_rol) = 'evaluador' AND r.deleted_at IS NULL
  AND pa.id = rpp.id_pantalla_accion_fk AND p.id = pa.id_pantalla_fk AND a.id = pa.id_accion_fk
  AND p.codigo = 'panel_principal' AND a.codigo = 'ver'
  AND rpp.habilitado IS TRUE;
