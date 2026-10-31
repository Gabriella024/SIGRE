-- SIGRE · REVERSIÓN de orientaciones_inscripciones_select_orientador_tiene_rol.sql · Solo STAGING.
-- Devuelve sigre_inscripciones_select_orientador a la expresión original (JOIN directo a usuario_roles/roles).
-- Solo actúa si la política está en la versión corregida; no toca otras políticas, GRANT ni datos.

BEGIN;

CREATE TEMP TABLE _rls_antes ON COMMIT DROP AS
SELECT (SELECT md5(coalesce(string_agg(p.tablename || p.policyname || p.cmd || p.roles::text
                                       || coalesce(p.qual, '') || coalesce(p.with_check, ''),
                                       '|' ORDER BY p.tablename, p.policyname), ''))
        FROM pg_policies p
        WHERE p.schemaname = 'public'
          AND NOT (p.tablename = 'orientacion_inscripciones' AND p.policyname = 'sigre_inscripciones_select_orientador'))
           AS huella_otras_politicas;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = 'bbd440b7-717e-416c-a2e7-0a33ee1d1320') THEN
        RAISE EXCEPTION 'ABORTADO: este proyecto no es STAGING';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies
                   WHERE schemaname = 'public' AND tablename = 'orientacion_inscripciones'
                     AND policyname = 'sigre_inscripciones_select_orientador'
                     AND qual ILIKE '%tiene_rol%' AND qual NOT ILIKE '%usuario_roles%') THEN
        RAISE EXCEPTION 'ABORTADO: la política del orientador no está en la versión corregida; nada que revertir';
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
        AND EXISTS (
            SELECT 1
            FROM public.usuario_roles ur
            JOIN public.roles r ON r.id = ur.id_rol_fk
            JOIN public.usuarios u ON u.id = ur.id_usuario_fk
            WHERE ur.id_usuario_fk = (SELECT auth.uid())
              AND lower(r.nombre_rol) = 'orientador'
              AND ur.estado = 'activo' AND ur.deleted_at IS NULL
              AND r.estado = 'activo' AND r.deleted_at IS NULL
              AND u.estado = 'activo' AND u.deleted_at IS NULL
        )
    );

DO $$
BEGIN
    IF (SELECT count(*) FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'orientacion_inscripciones') <> 3
       OR NOT EXISTS (SELECT 1 FROM pg_policies
                      WHERE schemaname = 'public' AND tablename = 'orientacion_inscripciones'
                        AND policyname = 'sigre_inscripciones_select_orientador' AND qual ILIKE '%usuario_roles%')
       OR (SELECT md5(coalesce(string_agg(p.tablename || p.policyname || p.cmd || p.roles::text
                                          || coalesce(p.qual, '') || coalesce(p.with_check, ''),
                                          '|' ORDER BY p.tablename, p.policyname), ''))
           FROM pg_policies p
           WHERE p.schemaname = 'public'
             AND NOT (p.tablename = 'orientacion_inscripciones' AND p.policyname = 'sigre_inscripciones_select_orientador'))
          <> (SELECT huella_otras_politicas FROM _rls_antes) THEN
        RAISE EXCEPTION 'ABORTADO: la reversión no dejó el estado esperado';
    END IF;
END;
$$;

COMMIT;
