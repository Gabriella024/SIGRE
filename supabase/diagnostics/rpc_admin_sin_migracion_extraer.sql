-- SIGRE · SOLO LECTURA · Extrae las RPC administrativas que existen en STAGING pero no tienen migración en el repo.
-- Uso: SQL Editor de STAGING → Run → Export (CSV/JSON) → guardar el contenido de "definicion" en
--      supabase/migrations/<versión>_rpc_admin_usuarios_configuracion_accesos.sql y los "grants" al final.
-- Verificado el 2026-10-30: las 10 funciones existen en STAGING (A5, usuarios, catálogos, pantallas, permisos, roles).

SELECT p.proname,
       pg_get_function_identity_arguments(p.oid) AS argumentos,
       md5(pg_get_functiondef(p.oid)) AS md5_definicion,
       pg_get_functiondef(p.oid) || ';' AS definicion,
       (SELECT string_agg(format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO %I;', p.proname,
                                 pg_get_function_identity_arguments(p.oid), r.rolname), E'\n' ORDER BY r.rolname)
        FROM aclexplode(p.proacl) a JOIN pg_roles r ON r.oid = a.grantee
        WHERE a.privilege_type = 'EXECUTE' AND r.rolname IN ('anon', 'authenticated', 'service_role')) AS grants
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('sigre_admin_guardar_municipio', 'sigre_admin_cambiar_estado_municipio',
                    'sigre_admin_guardar_centro_sena', 'sigre_admin_cambiar_estado_centro_sena',
                    'sigre_admin_actualizar_pantallas', 'sigre_admin_editar_usuario',
                    'sigre_admin_cambiar_estado_usuario', 'sigre_admin_guardar_permisos_rol',
                    'sigre_admin_asignar_roles_usuario', 'sigre_registrar_usuario_invitado')
ORDER BY p.proname;
