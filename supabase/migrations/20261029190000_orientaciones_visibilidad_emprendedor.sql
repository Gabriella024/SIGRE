-- SIGRE · Orientaciones · El Emprendedor ve las jornadas disponibles de su centro y las que tiene inscritas.
-- sigre_puede_ver_orientacion_fila (usada por la política sigre_orientaciones_select_autorizado) solo dejaba ver
-- al Emprendedor jornadas con asistencia propia. Ahora también: (b) jornadas con inscripción propia no eliminada
-- y (c) jornadas 'programada' no iniciadas (America/Bogota) del mismo centro que su ficha activa.
-- Administrador, Orientador y Coordinador sin cambios. Inscripciones y asistencias siguen aisladas.
-- Idempotente (CREATE OR REPLACE; misma firma y atributos).
-- Reversión: supabase/proposals/orientaciones_visibilidad_emprendedor_reversion.sql.
-- Pruebas: supabase/tests/orientaciones_visibilidad_emprendedor_pruebas.sql.

BEGIN;

DO $$
DECLARE
    v_faltan text;
BEGIN
    SELECT string_agg(e.t || '.' || e.c, ', ') INTO v_faltan
    FROM (VALUES ('orientaciones', 'estado'),
                 ('orientaciones', 'fecha'),
                 ('orientaciones', 'hora_inicio'),
                 ('orientaciones', 'id_centro_sena_fk'),
                 ('emprendedores', 'id_centro_sena_fk'),
                 ('emprendedores', 'estado'),
                 ('emprendedores', 'usuario_id'),
                 ('orientacion_inscripciones', 'id_orientacion_fk'),
                 ('orientacion_inscripciones', 'id_emprendedor_fk'),
                 ('orientacion_inscripciones', 'deleted_at')) AS e(t, c)
    WHERE NOT EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_schema = 'public' AND table_name = e.t AND column_name = e.c);
    IF v_faltan IS NOT NULL THEN
        RAISE EXCEPTION 'Migración abortada: faltan columnas: %', v_faltan;
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

COMMIT;
