-- MVP: diagnóstico de usuarios elegibles para registrar emprendedores (solo lectura).
-- Destino exclusivo: STAGING (febelffifcqzvnttpued). No ejecutar en PRODUCTION.
-- No devuelve contraseñas, hashes ni tokens. Ejecutar cada bloque por separado en el SQL Editor.

-- D1. Definición real de las RPC involucradas.
SELECT p.oid::regprocedure AS firma,
       p.prosecdef AS security_definer,
       pg_get_functiondef(p.oid) AS definicion
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'sigre_listar_usuarios_elegibles_emprendedor',
    'sigre_admin_crear_emprendedor',
    'sigre_registrar_usuario_invitado'
  );

-- D2. Restricciones de las tablas (PK, FK, UNIQUE, CHECK).
SELECT conrelid::regclass AS tabla, conname, pg_get_constraintdef(oid) AS definicion
FROM pg_constraint
WHERE conrelid IN ('public.usuarios'::regclass, 'public.usuario_roles'::regclass,
                   'public.emprendedores'::regclass, 'public.roles'::regclass)
ORDER BY 1, 2;

-- D3. Índices únicos (incluye índices parciales que no aparecen como restricción).
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('usuarios', 'usuario_roles', 'emprendedores')
  AND indexdef ILIKE '%UNIQUE%'
ORDER BY 1, 2;

-- D4. Triggers sobre auth.users y las tablas de SIGRE (alta automática de perfiles).
SELECT tgrelid::regclass AS tabla, tgname, pg_get_triggerdef(oid) AS definicion
FROM pg_trigger
WHERE NOT tgisinternal
  AND tgrelid IN ('auth.users'::regclass, 'public.usuarios'::regclass,
                  'public.usuario_roles'::regclass, 'public.emprendedores'::regclass);

-- D5. Catálogo de roles.
SELECT id, nombre_rol, estado, deleted_at FROM public.roles ORDER BY nombre_rol;

-- D6. Auditoría por usuario: cuenta Auth, perfil SIGRE, roles y ficha de emprendedor.
SELECT u.id,
       u.correo_electronico,
       u.estado AS estado_usuario,
       u.deleted_at IS NOT NULL AS usuario_eliminado,
       au.id IS NOT NULL AS tiene_cuenta_auth,
       au.email_confirmed_at IS NOT NULL AS correo_confirmado,
       au.banned_until IS NOT NULL AND au.banned_until > now() AS bloqueado,
       au.last_sign_in_at,
       coalesce(string_agg(DISTINCT r.nombre_rol || ':' || ur.estado
                           || CASE WHEN ur.deleted_at IS NOT NULL THEN ':eliminado' ELSE '' END, ', '), '')
         AS roles,
       bool_or(lower(r.nombre_rol) = 'emprendedor' AND ur.estado = 'activo' AND ur.deleted_at IS NULL)
         AS rol_emprendedor_activo,
       EXISTS (SELECT 1 FROM public.emprendedores e WHERE e.usuario_id = u.id) AS tiene_ficha,
       EXISTS (SELECT 1 FROM public.emprendedores e WHERE e.usuario_id = u.id AND e.deleted_at IS NULL)
         AS tiene_ficha_vigente
FROM public.usuarios u
LEFT JOIN auth.users au ON au.id = u.id
LEFT JOIN public.usuario_roles ur ON ur.id_usuario_fk = u.id
LEFT JOIN public.roles r ON r.id = ur.id_rol_fk
GROUP BY u.id, au.id
ORDER BY u.correo_electronico;

-- D7. Cuentas Auth sin perfil SIGRE (huérfanas) y perfiles sin cuenta Auth.
SELECT 'auth_sin_perfil' AS caso, au.id, au.email, au.created_at
FROM auth.users au
LEFT JOIN public.usuarios u ON u.id = au.id
WHERE u.id IS NULL
UNION ALL
SELECT 'perfil_sin_auth', u.id, u.correo_electronico, u.created_at
FROM public.usuarios u
LEFT JOIN auth.users au ON au.id = u.id
WHERE au.id IS NULL;

-- D8. Valores en uso para respetar CHECK y duplicados al preparar datos de demostración.
SELECT DISTINCT estado, tipo_documento FROM public.usuarios;
SELECT numero_documento, count(*) FROM public.usuarios
WHERE numero_documento IS NOT NULL GROUP BY 1 HAVING count(*) > 1;
