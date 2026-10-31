-- SIGRE · Orientaciones · La asistencia solo se marca desde el inicio de la jornada (America/Bogota).
-- Trigger BEFORE INSERT OR UPDATE en public.asistencias: rechaza (22023) marcar asistencia mientras la
-- jornada no haya iniciado, por RPC o por escritura directa. Función SECURITY INVOKER.
-- Idempotente: CREATE OR REPLACE de la función y recreación del trigger.
-- Reversión: supabase/proposals/orientaciones_asistencia_inicio_jornada_reversion.sql.
-- Pruebas: supabase/tests/orientaciones_asistencia_inicio_pruebas.sql.

BEGIN;

DO $$
DECLARE
    v_faltan text;
BEGIN
    SELECT string_agg(e.t || '.' || e.c, ', ') INTO v_faltan
    FROM (VALUES ('orientaciones', 'fecha'),
                 ('orientaciones', 'hora_inicio'),
                 ('orientaciones', 'deleted_at'),
                 ('asistencias', 'id_orientacion_fk'),
                 ('asistencias', 'estado_asistencia'),
                 ('asistencias', 'asistio'),
                 ('asistencias', 'deleted_at')) AS e(t, c)
    WHERE NOT EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_schema = 'public' AND table_name = e.t AND column_name = e.c);
    IF v_faltan IS NOT NULL THEN
        RAISE EXCEPTION 'Migración abortada: faltan columnas: %', v_faltan;
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_timezone_names WHERE name = 'America/Bogota') THEN
        RAISE EXCEPTION 'Migración abortada: zona horaria America/Bogota no disponible';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.sigre_asistencias_validar_inicio()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
    v_inicio timestamp;
BEGIN
    IF TG_OP = 'UPDATE'
       AND OLD.deleted_at IS NULL
       AND NEW.id_orientacion_fk = OLD.id_orientacion_fk
       AND NEW.estado_asistencia IS NOT DISTINCT FROM OLD.estado_asistencia
       AND NEW.asistio IS NOT DISTINCT FROM OLD.asistio THEN
        RETURN NEW;
    END IF;

    IF NEW.estado_asistencia IS NULL AND NEW.asistio IS NOT TRUE THEN
        RETURN NEW;
    END IF;

    SELECT o.fecha + o.hora_inicio INTO v_inicio
    FROM public.orientaciones o
    WHERE o.id = NEW.id_orientacion_fk AND o.deleted_at IS NULL;

    IF v_inicio IS NULL THEN
        RAISE EXCEPTION 'La jornada no existe, fue eliminada o no tiene hora de inicio.' USING ERRCODE = '22023';
    END IF;

    IF v_inicio > (now() AT TIME ZONE 'America/Bogota') THEN
        RAISE EXCEPTION 'La asistencia solo puede registrarse desde el inicio de la jornada (hora de Bogotá).'
            USING ERRCODE = '22023';
    END IF;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sigre_asistencias_validar_inicio() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS sigre_asistencias_validar_inicio ON public.asistencias;

CREATE TRIGGER sigre_asistencias_validar_inicio
    BEFORE INSERT OR UPDATE ON public.asistencias
    FOR EACH ROW
    WHEN (NEW.deleted_at IS NULL)
    EXECUTE FUNCTION public.sigre_asistencias_validar_inicio();

COMMIT;
