-- SIGRE · Diagnóstico SOLO LECTURA: permiso del rol Evaluador sobre panel_principal / ver.
-- Muestra el registro que modificaría 20261031120000_evaluador_permiso_panel_ver.sql y su estado actual.
-- No escribe nada. Ejecutar completo en el SQL Editor de STAGING.

WITH objetivo AS (
    SELECT pa.id AS id_pantalla_accion, p.codigo AS pantalla, a.codigo AS accion, pa.estado AS estado_pantalla_accion
    FROM public.pantalla_acciones pa
    JOIN public.app_pantallas p ON p.id = pa.id_pantalla_fk
    JOIN public.app_acciones a ON a.id = pa.id_accion_fk
    WHERE p.codigo = 'panel_principal' AND a.codigo = 'ver'
),
rol AS (
    SELECT id, nombre_rol, estado FROM public.roles WHERE lower(nombre_rol) = 'evaluador' AND deleted_at IS NULL
)
SELECT 'objetivo' AS seccion,
       r.nombre_rol AS rol,
       o.pantalla, o.accion, o.id_pantalla_accion,
       rpp.id AS id_rol_pantalla_permiso,
       rpp.habilitado, rpp.nivel_acceso, rpp.estado, rpp.updated_at,
       CASE WHEN rpp.id IS NULL THEN 'INSERT (no existe fila)' ELSE 'UPDATE de esta fila' END AS operacion
FROM objetivo o CROSS JOIN rol r
LEFT JOIN public.rol_pantalla_permisos rpp ON rpp.id_rol_fk = r.id AND rpp.id_pantalla_accion_fk = o.id_pantalla_accion
UNION ALL
SELECT 'referencia: panel/ver de otros roles', ro.nombre_rol, o.pantalla, o.accion, o.id_pantalla_accion,
       rpp.id, rpp.habilitado, rpp.nivel_acceso, rpp.estado, rpp.updated_at, NULL
FROM objetivo o
JOIN public.rol_pantalla_permisos rpp ON rpp.id_pantalla_accion_fk = o.id_pantalla_accion
JOIN public.roles ro ON ro.id = rpp.id_rol_fk
WHERE lower(ro.nombre_rol) <> 'evaluador'
UNION ALL
SELECT 'evaluador: permisos habilitados hoy', r.nombre_rol, p.codigo, a.codigo, pa.id,
       rpp.id, rpp.habilitado, rpp.nivel_acceso, rpp.estado, rpp.updated_at, NULL
FROM rol r
JOIN public.rol_pantalla_permisos rpp ON rpp.id_rol_fk = r.id AND rpp.habilitado IS TRUE
JOIN public.pantalla_acciones pa ON pa.id = rpp.id_pantalla_accion_fk
JOIN public.app_pantallas p ON p.id = pa.id_pantalla_fk
JOIN public.app_acciones a ON a.id = pa.id_accion_fk
ORDER BY 1, 2, 3, 4;
