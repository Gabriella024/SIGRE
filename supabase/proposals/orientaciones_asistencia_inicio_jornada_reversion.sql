-- SIGRE · REVERSIÓN de orientaciones_asistencia_inicio_jornada.sql · Solo con autorización expresa.
-- Destino exclusivo: STAGING (febelffifcqzvnttpued). Prohibido en PRODUCTION.
-- Elimina únicamente el trigger sigre_asistencias_validar_inicio y su función. No afecta datos, la RPC,
-- otros triggers ni políticas de asistencias.
-- Esperado al final: 1 fila con trigger_existe = false y funcion_existe = false.

BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = 'bbd440b7-717e-416c-a2e7-0a33ee1d1320') THEN
        RAISE EXCEPTION 'ABORTADO: este proyecto no es STAGING';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_proc p ON p.oid = t.tgfoid
               WHERE p.oid = to_regprocedure('public.sigre_asistencias_validar_inicio()')
                 AND (t.tgrelid <> 'public.asistencias'::regclass OR t.tgname <> 'sigre_asistencias_validar_inicio')) THEN
        RAISE EXCEPTION 'ABORTADO: la función la usa otro trigger; revisar manualmente';
    END IF;
END;
$$;

CREATE TEMP TABLE _rev_antes ON COMMIT DROP AS
SELECT (SELECT count(*) FROM pg_trigger WHERE tgrelid = 'public.asistencias'::regclass AND NOT tgisinternal
          AND tgname <> 'sigre_asistencias_validar_inicio') AS otros_triggers;

DROP TRIGGER IF EXISTS sigre_asistencias_validar_inicio ON public.asistencias;
DROP FUNCTION IF EXISTS public.sigre_asistencias_validar_inicio();

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'sigre_asistencias_validar_inicio')
       OR to_regprocedure('public.sigre_asistencias_validar_inicio()') IS NOT NULL
       OR (SELECT count(*) FROM pg_trigger WHERE tgrelid = 'public.asistencias'::regclass AND NOT tgisinternal)
          <> (SELECT otros_triggers FROM _rev_antes) THEN
        RAISE EXCEPTION 'ABORTADO: la reversión no dejó asistencias en el estado esperado';
    END IF;
END;
$$;

COMMIT;

SELECT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'sigre_asistencias_validar_inicio') AS trigger_existe,
       to_regprocedure('public.sigre_asistencias_validar_inicio()') IS NOT NULL AS funcion_existe;
