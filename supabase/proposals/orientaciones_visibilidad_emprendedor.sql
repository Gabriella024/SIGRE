-- SIGRE · MIGRACIÓN (NO APLICADA) · Requiere autorización expresa antes de ejecutarse.
-- Destino exclusivo: STAGING (febelffifcqzvnttpued). Prohibido en PRODUCTION.
-- Defecto (validación de interfaz 2026-10-29): sigre_puede_ver_orientacion_fila solo deja ver al Emprendedor
-- las jornadas donde ya tiene una asistencia. "Jornadas disponibles" queda vacío y una jornada inscrita no
-- se ve hasta registrar asistencia.
-- Corrección: CREATE OR REPLACE de la misma función (misma firma, SECURITY DEFINER, STABLE, search_path vacío).
-- La rama del Emprendedor pasa a ver una jornada si:
--   a) tiene asistencia en ella (regla actual), o
--   b) tiene inscripción no eliminada en ella (cualquier estado; conserva su historial), o
--   c) la jornada está 'programada', no eliminada, aún no ha iniciado (America/Bogota) y es del mismo
--      centro SENA que su ficha activa.
-- Administrador, Orientador y Coordinador no cambian. La política sigre_orientaciones_select_autorizado, los
-- GRANT, el propietario y las demás funciones/políticas no cambian (se comparan huellas).
-- Inscripciones y asistencias siguen aisladas por sus propias políticas (no dependen de esta función).

BEGIN;

CREATE TEMP TABLE _vis_antes ON COMMIT DROP AS
SELECT
    (SELECT proacl::text FROM pg_proc WHERE oid = 'public.sigre_puede_ver_orientacion_fila(uuid,uuid,timestamptz)'::regprocedure) AS acl,
    (SELECT md5(coalesce(string_agg(p.tablename || p.policyname || p.cmd || p.roles::text
                                    || coalesce(p.qual, '') || coalesce(p.with_check, ''),
                                    '|' ORDER BY p.tablename, p.policyname), ''))
     FROM pg_policies p WHERE p.schemaname = 'public') AS huella_politicas,
    (SELECT md5(string_agg(p.oid::regprocedure::text || md5(p.prosrc) || coalesce(p.proacl::text, ''), '|' ORDER BY p.oid::regprocedure::text))
     FROM pg_proc p
     WHERE p.pronamespace = 'public'::regnamespace
       AND p.oid <> 'public.sigre_puede_ver_orientacion_fila(uuid,uuid,timestamptz)'::regprocedure) AS huella_otras_funciones;

DO $$
DECLARE
    v_faltan text;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = 'bbd440b7-717e-416c-a2e7-0a33ee1d1320') THEN
        RAISE EXCEPTION 'ABORTADO: este proyecto no es STAGING';
    END IF;
    IF (SELECT md5(prosrc) FROM pg_proc
        WHERE oid = 'public.sigre_puede_ver_orientacion_fila(uuid,uuid,timestamptz)'::regprocedure)
       IS DISTINCT FROM 'ace1e8ee57262c1dc9c355a3cd2c0a2d' THEN
        RAISE EXCEPTION 'ABORTADO: sigre_puede_ver_orientacion_fila no es la versión original esperada (¿ya aplicada o cambiada?)';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_proc
                   WHERE oid = 'public.sigre_puede_ver_orientacion_fila(uuid,uuid,timestamptz)'::regprocedure
                     AND prosecdef AND provolatile = 's' AND proconfig @> ARRAY['search_path=""']
                     AND pg_get_userbyid(proowner) = 'postgres') THEN
        RAISE EXCEPTION 'ABORTADO: atributos de la función distintos de los esperados';
    END IF;
    IF (SELECT md5(qual) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'orientaciones'
          AND policyname = 'sigre_orientaciones_select_autorizado') IS DISTINCT FROM '48ccb910c2d38ec809e62b73ba65b207'
       OR (SELECT count(*) FROM pg_policies WHERE schemaname = 'public'
             AND (coalesce(qual, '') || coalesce(with_check, '')) ILIKE '%sigre_puede_ver_orientacion_fila%') <> 1
       OR EXISTS (SELECT 1 FROM pg_proc WHERE pronamespace = 'public'::regnamespace
                    AND prosrc ILIKE '%sigre_puede_ver_orientacion_fila%')
    THEN
        RAISE EXCEPTION 'ABORTADO: la función tiene dependencias distintas de la única política esperada';
    END IF;
    -- La función lee orientaciones, orientacion_inscripciones y emprendedores como propietario (sin RLS):
    -- exige que ninguna tenga FORCE ROW LEVEL SECURITY para descartar recursión de políticas.
    IF EXISTS (SELECT 1 FROM pg_class
               WHERE oid IN ('public.orientaciones'::regclass, 'public.orientacion_inscripciones'::regclass,
                             'public.emprendedores'::regclass, 'public.asistencias'::regclass)
                 AND (relforcerowsecurity OR pg_get_userbyid(relowner) <> 'postgres')) THEN
        RAISE EXCEPTION 'ABORTADO: FORCE RLS activo o propietario inesperado en tablas leídas por la función';
    END IF;
    SELECT string_agg(e.t || '.' || e.c, ', ') INTO v_faltan
    FROM (VALUES ('orientaciones', 'estado'), ('orientaciones', 'fecha'), ('orientaciones', 'hora_inicio'),
                 ('orientaciones', 'id_centro_sena_fk'), ('orientaciones', 'deleted_at'),
                 ('emprendedores', 'id_centro_sena_fk'), ('emprendedores', 'estado'), ('emprendedores', 'usuario_id'),
                 ('orientacion_inscripciones', 'id_orientacion_fk'), ('orientacion_inscripciones', 'id_emprendedor_fk'),
                 ('orientacion_inscripciones', 'deleted_at')) AS e(t, c)
    WHERE NOT EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_schema = 'public' AND table_name = e.t AND column_name = e.c);
    IF v_faltan IS NOT NULL THEN
        RAISE EXCEPTION 'ABORTADO: faltan columnas: %', v_faltan;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.sigre_puede_ver_orientacion_fila(p_id uuid, p_orientador uuid, p_deleted_at timestamp with time zone)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
    SELECT p_deleted_at IS NULL
       AND (
           public.tiene_rol('administrador')

           OR (
               public.tiene_rol('orientador')
               AND p_orientador = auth.uid()
           )

           OR (
               public.tiene_rol('emprendedor')
               AND (
                   EXISTS (
                       SELECT 1
                       FROM public.asistencias a
                       JOIN public.emprendedores e
                         ON e.id = a.id_emprendedor_fk
                       WHERE a.id_orientacion_fk = p_id
                         AND a.deleted_at IS NULL
                         AND e.deleted_at IS NULL
                         AND e.usuario_id = auth.uid()
                   )
                   OR EXISTS (
                       SELECT 1
                       FROM public.orientacion_inscripciones i
                       JOIN public.emprendedores e
                         ON e.id = i.id_emprendedor_fk
                       WHERE i.id_orientacion_fk = p_id
                         AND i.deleted_at IS NULL
                         AND e.deleted_at IS NULL
                         AND e.usuario_id = auth.uid()
                   )
                   OR EXISTS (
                       SELECT 1
                       FROM public.orientaciones o
                       JOIN public.emprendedores e
                         ON e.id_centro_sena_fk = o.id_centro_sena_fk
                       WHERE o.id = p_id
                         AND o.deleted_at IS NULL
                         AND o.estado = 'programada'
                         AND (o.fecha + o.hora_inicio) > (now() AT TIME ZONE 'America/Bogota')
                         AND e.usuario_id = auth.uid()
                         AND e.estado = 'activo'
                         AND e.deleted_at IS NULL
                   )
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
$function$;

DO $$
DECLARE
    a _vis_antes%ROWTYPE;
BEGIN
    SELECT * INTO STRICT a FROM _vis_antes;
    IF NOT EXISTS (SELECT 1 FROM pg_proc
                   WHERE oid = 'public.sigre_puede_ver_orientacion_fila(uuid,uuid,timestamptz)'::regprocedure
                     AND prosecdef AND provolatile = 's' AND proconfig @> ARRAY['search_path=""']
                     AND pg_get_userbyid(proowner) = 'postgres'
                     AND prosrc ILIKE '%orientacion_inscripciones%' AND prosrc ILIKE '%''programada''%'
                     AND proacl::text IS NOT DISTINCT FROM a.acl) THEN
        RAISE EXCEPTION 'ABORTADO: la función resultante no tiene los atributos o GRANT esperados';
    END IF;
    IF (SELECT md5(coalesce(string_agg(p.tablename || p.policyname || p.cmd || p.roles::text
                                       || coalesce(p.qual, '') || coalesce(p.with_check, ''),
                                       '|' ORDER BY p.tablename, p.policyname), ''))
        FROM pg_policies p WHERE p.schemaname = 'public') <> a.huella_politicas
       OR (SELECT md5(string_agg(p.oid::regprocedure::text || md5(p.prosrc) || coalesce(p.proacl::text, ''), '|' ORDER BY p.oid::regprocedure::text))
           FROM pg_proc p
           WHERE p.pronamespace = 'public'::regnamespace
             AND p.oid <> 'public.sigre_puede_ver_orientacion_fila(uuid,uuid,timestamptz)'::regprocedure)
          <> a.huella_otras_funciones THEN
        RAISE EXCEPTION 'ABORTADO: cambiaron políticas u otras funciones';
    END IF;
END;
$$;

COMMIT;

-- Esperado: version = corregida.
SELECT CASE md5(prosrc) WHEN 'ace1e8ee57262c1dc9c355a3cd2c0a2d' THEN 'original' ELSE 'corregida' END AS version
FROM pg_proc WHERE oid = 'public.sigre_puede_ver_orientacion_fila(uuid,uuid,timestamptz)'::regprocedure;
