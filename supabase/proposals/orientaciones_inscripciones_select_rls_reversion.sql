-- SIGRE · REVERSIÓN de orientaciones_inscripciones_select_rls.sql · Solo con autorización expresa.
-- Destino exclusivo: STAGING (febelffifcqzvnttpued). Prohibido en PRODUCTION.
-- Elimina únicamente las tres políticas SELECT creadas por la migración y deja orientacion_inscripciones
-- como estaba diagnosticada (RLS activo, sin políticas). No afecta datos, GRANT ni otras tablas.
-- Esperado al final: 1 fila con politicas = 0 y rls_activo = true.

BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = 'bbd440b7-717e-416c-a2e7-0a33ee1d1320') THEN
        RAISE EXCEPTION 'ABORTADO: este proyecto no es STAGING';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
               WHERE schemaname = 'public' AND tablename = 'orientacion_inscripciones'
                 AND policyname NOT IN ('sigre_inscripciones_select_admin', 'sigre_inscripciones_select_orientador',
                                        'sigre_inscripciones_select_propias')) THEN
        RAISE EXCEPTION 'ABORTADO: orientacion_inscripciones tiene políticas ajenas a la migración; revisar manualmente';
    END IF;
END;
$$;

DROP POLICY IF EXISTS sigre_inscripciones_select_admin      ON public.orientacion_inscripciones;
DROP POLICY IF EXISTS sigre_inscripciones_select_orientador ON public.orientacion_inscripciones;
DROP POLICY IF EXISTS sigre_inscripciones_select_propias    ON public.orientacion_inscripciones;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'orientacion_inscripciones')
       OR NOT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.orientacion_inscripciones'::regclass) THEN
        RAISE EXCEPTION 'ABORTADO: la tabla no quedó con RLS activo y sin políticas';
    END IF;
END;
$$;

COMMIT;

SELECT (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'orientacion_inscripciones') AS politicas,
       (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.orientacion_inscripciones'::regclass) AS rls_activo;
