-- SIGRE · Orientaciones · La política del Orientador valida el rol con public.tiene_rol().
-- usuario_roles y roles solo son legibles por el Administrador; el JOIN directo de la política original
-- nunca se cumplía para el Orientador. tiene_rol (SECURITY DEFINER, STABLE) valida lo mismo: usuario, rol y
-- asignación activos y no eliminados. El Orientador sigue limitado a sus jornadas asignadas no eliminadas.
-- Idempotente (ALTER POLICY). Requiere 20261028200000_orientaciones_inscripciones_select_rls.sql.
-- Reversión: supabase/proposals/orientaciones_inscripciones_select_orientador_tiene_rol_reversion.sql.

BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'orientacion_inscripciones'
                     AND policyname = 'sigre_inscripciones_select_orientador') THEN
        RAISE EXCEPTION 'Migración abortada: falta la política sigre_inscripciones_select_orientador';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE oid = to_regprocedure('public.tiene_rol(text)') AND prosecdef AND provolatile = 's') THEN
        RAISE EXCEPTION 'Migración abortada: public.tiene_rol(text) no existe o no es SECURITY DEFINER STABLE';
    END IF;
END;
$$;

ALTER POLICY sigre_inscripciones_select_orientador
    ON public.orientacion_inscripciones
    USING (
        orientacion_inscripciones.deleted_at IS NULL
        AND EXISTS (
            SELECT 1
            FROM public.orientaciones o
            WHERE o.id = orientacion_inscripciones.id_orientacion_fk
              AND o.id_orientador_fk = (SELECT auth.uid())
              AND o.deleted_at IS NULL
        )
        AND (SELECT public.tiene_rol('orientador'))
    );

COMMIT;
