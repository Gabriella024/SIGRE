-- SIGRE - Diagnostico de solo lectura. Destino exclusivo: STAGING (febelffifcqzvnttpued).
-- Conflicto de version en RPC de proyectos: una RPC que lanza SQLSTATE 40001 hace que PostgREST
-- reintente la transaccion indefinidamente (la peticion HTTP nunca responde).
-- No modifica datos. Ejecutar el bloque completo en el SQL Editor.

-- Q0. Usuario que ejecuta (debe ser propietario o miembro del rol propietario para CREATE OR REPLACE).
SELECT current_user, session_user;

-- Q1. Definicion real y propiedades de las RPC de proyectos y de edicion/estado de emprendedores.
SELECT p.oid::regprocedure                AS firma,
       pg_get_function_result(p.oid)      AS retorno,
       pg_get_userbyid(p.proowner)        AS propietario,
       pg_has_role(current_user, p.proowner, 'MEMBER') AS puedo_reemplazar,
       p.prosecdef                        AS security_definer,
       p.provolatile                      AS volatilidad,
       p.proconfig                        AS configuracion,
       p.proacl                           AS permisos,
       p.prosrc ~* '40001|serialization_failure' AS usa_40001,
       pg_get_functiondef(p.oid)          AS definicion
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('sigre_admin_editar_proyecto', 'sigre_admin_eliminar_proyecto',
                    'sigre_admin_editar_emprendedor', 'sigre_admin_cambiar_estado_emprendedor',
                    'sigre_orientador_editar_emprendedor', 'sigre_emprendedor_editar_mi_ficha',
                    'sigre_admin_asignar_orientador')
ORDER BY p.proname;

-- Q2. Todas las funciones de public que usan 40001 / serialization_failure (alcance real del problema).
SELECT p.oid::regprocedure AS firma,
       (SELECT string_agg(m[1], ' | ')
        FROM regexp_matches(p.prosrc, '([^\n]*(40001|serialization_failure)[^\n]*)', 'gi') AS m) AS lineas
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prosrc ~* '40001|serialization_failure'
ORDER BY 1::text;

-- Q3. Sesiones de PostgREST que siguen reintentando estas RPC.
SELECT pid,
       usename,
       state,
       wait_event_type,
       wait_event,
       now() - backend_start AS edad_conexion,
       now() - xact_start    AS edad_transaccion,
       now() - query_start   AS edad_consulta,
       left(query, 160)      AS consulta
FROM pg_stat_activity
WHERE pid <> pg_backend_pid()
  AND query ~* 'sigre_admin_(editar|eliminar)_(proyecto|emprendedor)|sigre_(orientador|emprendedor)_editar'
ORDER BY query_start;

-- Q4. Tiempos limite configurados para los roles de la API.
SELECT rolname, rolconfig
FROM pg_roles
WHERE rolname IN ('authenticator', 'authenticated', 'anon', 'service_role')
ORDER BY rolname;
