-- SIGRE - Verificacion posterior a 20261028120000_proyectos_conflicto_pt409.sql (solo lectura).
-- Destino exclusivo: STAGING (febelffifcqzvnttpued). Ejecutar el bloque completo en el SQL Editor.

-- V1. Proyecto donde se ejecuta (la guarda de la migracion usa esta cuenta Auth DEMO).
SELECT current_database(),
       current_user,
       EXISTS (SELECT 1 FROM auth.users WHERE id = 'bbd440b7-717e-416c-a2e7-0a33ee1d1320') AS es_staging;

-- V2. Estado de TODAS las sobrecargas de las RPC de proyectos (esperado: 2 filas, usa_pt409 = true, usa_40001 = false).
SELECT p.oid,
       p.oid::regprocedure AS firma,
       p.prosecdef AS security_definer,
       p.proconfig AS configuracion,
       p.prosrc ~ 'PT409' AS usa_pt409,
       p.prosrc ~* '40001|serialization_failure' AS usa_40001,
       (SELECT string_agg(m[1], ' | ')
        FROM regexp_matches(p.prosrc, '([^\n]*ERRCODE[^\n]*)', 'gi') AS m) AS lineas_errcode
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname IN ('sigre_admin_editar_proyecto', 'sigre_admin_eliminar_proyecto')
ORDER BY n.nspname, 2::text;

-- V3. Triggers sobre proyectos que pudieran lanzar 40001 por su cuenta.
SELECT t.tgname, p.oid::regprocedure AS funcion, p.prosrc ~* '40001|serialization_failure' AS usa_40001
FROM pg_trigger t
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE t.tgrelid = 'public.proyectos'::regclass
  AND NOT t.tgisinternal;

-- V4. Sesiones que siguen reintentando estas RPC.
SELECT pid, usename, state, wait_event_type, wait_event,
       now() - backend_start AS edad_conexion,
       now() - query_start   AS edad_consulta,
       left(query, 160)      AS consulta
FROM pg_stat_activity
WHERE pid <> pg_backend_pid()
  AND query ~* 'sigre_admin_(editar|eliminar)_proyecto'
ORDER BY query_start;
