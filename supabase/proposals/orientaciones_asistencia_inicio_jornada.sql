-- SIGRE · MIGRACIÓN ESTRUCTURAL (NO APLICADA) · Requiere autorización expresa antes de ejecutarse.
-- Destino exclusivo: STAGING (febelffifcqzvnttpued). Prohibido en PRODUCTION.
-- Problema comprobado el 2026-10-28: sigre_registrar_asistencia aceptó asistencia a las 16:21 (Bogotá)
-- para la jornada DEMO que iniciaba a las 16:45.
-- Corrección: trigger BEFORE INSERT OR UPDATE en public.asistencias que rechaza (22023) marcar asistencia
-- mientras la jornada no haya iniciado en America/Bogota, sea por RPC o por escritura directa.
--   * Comparación: fecha (date) + hora_inicio (time) = hora local de la jornada, contra
--     now() AT TIME ZONE 'America/Bogota' = hora local actual. No depende del TimeZone del servidor.
--   * INSERT con estado_asistencia o asistio = true: se valida.
--   * UPDATE que cambia estado_asistencia, asistio, la jornada o reactiva un borrado lógico: se valida.
--   * UPDATE solo de observacion u otros metadatos de una fila activa: no se valida.
--   * Borrado lógico (NEW.deleted_at no nulo): no se valida (cláusula WHEN).
--   * No modifica filas existentes, la RPC ni otras tablas. La función es SECURITY INVOKER.
-- No depende de datos DEMO. Las pruebas están en
-- supabase/tests/orientaciones_asistencia_inicio_pruebas.sql y se ejecutan después, por separado.

BEGIN;

-- 1. Guardas de entorno y estructura ---------------------------------------------------------------
DO $$
DECLARE
    v_tipos jsonb;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = 'bbd440b7-717e-416c-a2e7-0a33ee1d1320') THEN
        RAISE EXCEPTION 'ABORTADO: este proyecto no es STAGING';
    END IF;

    SELECT jsonb_object_agg(table_name || '.' || column_name, data_type) INTO v_tipos
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND ((table_name = 'orientaciones' AND column_name IN ('id', 'fecha', 'hora_inicio', 'deleted_at'))
        OR (table_name = 'asistencias' AND column_name IN ('id_orientacion_fk', 'estado_asistencia', 'asistio',
                                                           'deleted_at')));

    IF v_tipos ->> 'orientaciones.fecha' IS DISTINCT FROM 'date'
       OR v_tipos ->> 'orientaciones.hora_inicio' IS DISTINCT FROM 'time without time zone'
       OR v_tipos ->> 'asistencias.asistio' IS DISTINCT FROM 'boolean'
       OR (SELECT count(*) FROM jsonb_object_keys(v_tipos)) <> 8 THEN
        RAISE EXCEPTION 'ABORTADO: estructura inesperada: %', v_tipos;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_timezone_names WHERE name = 'America/Bogota') THEN
        RAISE EXCEPTION 'ABORTADO: zona horaria America/Bogota no disponible';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'sigre_asistencias_validar_inicio')
       OR to_regprocedure('public.sigre_asistencias_validar_inicio()') IS NOT NULL THEN
        RAISE EXCEPTION 'ABORTADO: el trigger o la función ya existen';
    END IF;
END;
$$;

CREATE TEMP TABLE _trg_antes ON COMMIT DROP AS
SELECT (SELECT count(*) FROM pg_trigger WHERE tgrelid = 'public.asistencias'::regclass AND NOT tgisinternal) AS triggers,
       (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'asistencias') AS politicas;

-- 2. Función y trigger ------------------------------------------------------------------------------
CREATE FUNCTION public.sigre_asistencias_validar_inicio()
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

CREATE TRIGGER sigre_asistencias_validar_inicio
    BEFORE INSERT OR UPDATE ON public.asistencias
    FOR EACH ROW
    WHEN (NEW.deleted_at IS NULL)
    EXECUTE FUNCTION public.sigre_asistencias_validar_inicio();

-- 3. Comprobación estructural previa al COMMIT --------------------------------------------------------
DO $$
DECLARE
    a _trg_antes%ROWTYPE;
BEGIN
    SELECT * INTO STRICT a FROM _trg_antes;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger t JOIN pg_proc p ON p.oid = t.tgfoid
        WHERE t.tgrelid = 'public.asistencias'::regclass
          AND t.tgname = 'sigre_asistencias_validar_inicio'
          AND t.tgenabled = 'O'
          AND t.tgtype = (1 | 2 | 4 | 16)  -- ROW | BEFORE | INSERT | UPDATE
          AND NOT p.prosecdef
    ) THEN
        RAISE EXCEPTION 'ABORTADO: el trigger no quedó como BEFORE INSERT OR UPDATE FOR EACH ROW con función SECURITY INVOKER';
    END IF;
    IF (SELECT count(*) FROM pg_trigger WHERE tgrelid = 'public.asistencias'::regclass AND NOT tgisinternal) <> a.triggers + 1
       OR (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'asistencias') <> a.politicas THEN
        RAISE EXCEPTION 'ABORTADO: cambiaron otros triggers o políticas de asistencias';
    END IF;
END;
$$;

COMMIT;

-- ============================ VERIFICACIÓN POSTERIOR ============================
-- Esperado: 1 fila con security_definer = false. "No rows returned" indica ejecución incompleta.
SELECT t.tgname, pg_get_triggerdef(t.oid) AS definicion, p.prosecdef AS security_definer
FROM pg_trigger t JOIN pg_proc p ON p.oid = t.tgfoid
WHERE t.tgname = 'sigre_asistencias_validar_inicio';

-- ================================== REVERSIÓN ==================================
-- BEGIN;
-- DROP TRIGGER IF EXISTS sigre_asistencias_validar_inicio ON public.asistencias;
-- DROP FUNCTION IF EXISTS public.sigre_asistencias_validar_inicio();
-- COMMIT;
