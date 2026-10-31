-- SIGRE · REVERSIÓN de orientaciones_visibilidad_emprendedor.sql · Solo STAGING.
-- Restaura sigre_puede_ver_orientacion_fila exactamente a la versión original (md5(prosrc) = ace1e8ee…,
-- cuerpo con saltos de línea CRLF). Solo actúa si la función está en la versión corregida. CREATE OR REPLACE
-- conserva propietario y GRANT; no toca políticas, otras funciones ni datos.

BEGIN;

DO $$
DECLARE
    v_cuerpo text := $orig$
    SELECT p_deleted_at IS NULL
       AND (
           public.tiene_rol('administrador')

           OR (
               public.tiene_rol('orientador')
               AND p_orientador = auth.uid()
           )

           OR (
               public.tiene_rol('emprendedor')
               AND EXISTS (
                   SELECT 1
                   FROM public.asistencias a
                   JOIN public.emprendedores e
                     ON e.id = a.id_emprendedor_fk
                   WHERE a.id_orientacion_fk = p_id
                     AND a.deleted_at IS NULL
                     AND e.deleted_at IS NULL
                     AND e.usuario_id = auth.uid()
               )
           )

           OR (
               public.tiene_rol('coordinador')
               AND EXISTS (
                   SELECT 1
                   FROM public.asistencias a
                   JOIN public.emprendedores e
                     ON e.id = a.id_emprendedor_fk
                   WHERE a.id_orientacion_fk = p_id
                     AND a.deleted_at IS NULL
                     AND e.deleted_at IS NULL
                     AND public.coordinador_puede_ver_centro(
                         e.id_centro_sena_fk
                     )
               )
           )
       );
$orig$;
    v_acl text;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = 'bbd440b7-717e-416c-a2e7-0a33ee1d1320') THEN
        RAISE EXCEPTION 'ABORTADO: este proyecto no es STAGING';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_proc
                   WHERE oid = 'public.sigre_puede_ver_orientacion_fila(uuid,uuid,timestamptz)'::regprocedure
                     AND prosrc ILIKE '%orientacion_inscripciones%' AND prosrc ILIKE '%''programada''%') THEN
        RAISE EXCEPTION 'ABORTADO: la función no está en la versión corregida; nada que revertir';
    END IF;
    SELECT proacl::text INTO v_acl FROM pg_proc
    WHERE oid = 'public.sigre_puede_ver_orientacion_fila(uuid,uuid,timestamptz)'::regprocedure;

    -- Normaliza a CRLF (independiente de cómo se haya guardado este archivo).
    v_cuerpo := replace(replace(v_cuerpo, E'\r', ''), E'\n', E'\r\n');
    EXECUTE format('CREATE OR REPLACE FUNCTION public.sigre_puede_ver_orientacion_fila('
                   'p_id uuid, p_orientador uuid, p_deleted_at timestamp with time zone) '
                   'RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO %L AS %L', '', v_cuerpo);

    IF NOT EXISTS (SELECT 1 FROM pg_proc
                   WHERE oid = 'public.sigre_puede_ver_orientacion_fila(uuid,uuid,timestamptz)'::regprocedure
                     AND md5(prosrc) = 'ace1e8ee57262c1dc9c355a3cd2c0a2d'
                     AND prosecdef AND provolatile = 's' AND proconfig @> ARRAY['search_path=""']
                     AND proacl::text IS NOT DISTINCT FROM v_acl) THEN
        RAISE EXCEPTION 'ABORTADO: la reversión no reproduce exactamente la versión original';
    END IF;
END;
$$;

COMMIT;

SELECT CASE md5(prosrc) WHEN 'ace1e8ee57262c1dc9c355a3cd2c0a2d' THEN 'original' ELSE 'corregida' END AS version
FROM pg_proc WHERE oid = 'public.sigre_puede_ver_orientacion_fila(uuid,uuid,timestamptz)'::regprocedure;
