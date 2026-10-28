-- SIGRE · Orientaciones · Diagnóstico RLS de orientacion_inscripciones (SOLO LECTURA)
-- Ejecutar en STAGING (febelffifcqzvnttpued) desde el SQL Editor, bloque por bloque.
-- Ningún bloque modifica datos: el bloque 7 usa BEGIN ... ROLLBACK para simular roles.

-- 1. Estado de RLS en las tablas del módulo
SELECT c.relname AS tabla, c.relrowsecurity AS rls_activo, c.relforcerowsecurity AS rls_forzado
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('orientaciones', 'orientacion_inscripciones', 'asistencias', 'emprendedores')
ORDER BY 1;

-- 2. Todas las políticas de las tablas del módulo (SELECT y demás comandos)
SELECT tablename, policyname, cmd, permissive, roles, qual AS using_expr, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('orientaciones', 'orientacion_inscripciones', 'asistencias')
ORDER BY tablename, cmd, policyname;

-- 3. GRANT de tabla para anon / authenticated
SELECT table_name, grantee, string_agg(privilege_type, ', ' ORDER BY privilege_type) AS privilegios
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('orientaciones', 'orientacion_inscripciones', 'asistencias')
  AND grantee IN ('anon', 'authenticated', 'service_role')
GROUP BY table_name, grantee
ORDER BY 1, 2;

-- 4. Funciones auxiliares citadas en las políticas (definición, SECURITY DEFINER, search_path)
WITH expr AS (
  SELECT coalesce(qual, '') || ' ' || coalesce(with_check, '') AS texto
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('orientaciones', 'orientacion_inscripciones', 'asistencias')
),
nombres AS (
  SELECT DISTINCT (regexp_matches(texto, '([a-z_][a-z0-9_]*)\(', 'g'))[1] AS nombre FROM expr
)
SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args, p.prosecdef AS security_definer,
       p.proconfig AS config, pg_get_functiondef(p.oid) AS definicion
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
JOIN nombres x ON x.nombre = p.proname
WHERE n.nspname = 'public'
ORDER BY 1;

-- 5. RPC que sí devuelve la inscripción (comparación con la lectura directa)
SELECT p.proname, p.prosecdef AS security_definer, p.proconfig AS config, pg_get_functiondef(p.oid) AS definicion
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('sigre_listar_inscritos_asistencia', 'sigre_inscribir_en_jornada', 'sigre_registrar_asistencia')
ORDER BY 1;

-- 6. Datos DEMO de referencia (como postgres, sin RLS)
SELECT i.id, i.id_orientacion_fk, i.id_emprendedor_fk, i.estado, i.origen, i.created_at, i.deleted_at
FROM public.orientacion_inscripciones i
WHERE i.id_orientacion_fk = 'e2997c86-64c4-45ae-8046-ce3cd622e13e';

-- 7. Simulación de lectura directa por rol (se revierte siempre)
--    Admin   = 0a2a7a08-7c33-49e1-bd94-d21313924231
--    Laura   = bbd440b7-717e-416c-a2e7-0a33ee1d1320 (emprendedora, usuarios.id)
--    Otro emprendedor (debe ver 0 filas de Laura) = 6bc62741-335e-4240-a6b0-416716865308
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"0a2a7a08-7c33-49e1-bd94-d21313924231","role":"authenticated"}', true);
SELECT 'admin' AS como, count(*) AS filas FROM public.orientacion_inscripciones
WHERE id_orientacion_fk = 'e2997c86-64c4-45ae-8046-ce3cd622e13e';
SELECT set_config('request.jwt.claims', '{"sub":"bbd440b7-717e-416c-a2e7-0a33ee1d1320","role":"authenticated"}', true);
SELECT 'laura' AS como, count(*) AS filas FROM public.orientacion_inscripciones
WHERE id_orientacion_fk = 'e2997c86-64c4-45ae-8046-ce3cd622e13e';
SELECT set_config('request.jwt.claims', '{"sub":"6bc62741-335e-4240-a6b0-416716865308","role":"authenticated"}', true);
SELECT 'otro_emprendedor' AS como, count(*) AS filas FROM public.orientacion_inscripciones
WHERE id_orientacion_fk = 'e2997c86-64c4-45ae-8046-ce3cd622e13e';
ROLLBACK;
