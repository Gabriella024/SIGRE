-- SIGRE · Orientaciones · Lectura de orientacion_inscripciones por rol (RLS).
-- orientacion_inscripciones tenía RLS activo sin políticas: ninguna lectura directa devolvía filas.
-- Tres políticas permisivas FOR SELECT TO authenticated que ocultan el borrado lógico:
--   admin (usuario y rol administrador activos), orientador (jornadas asignadas no eliminadas) y propias
--   (ficha del propio usuario). No toca INSERT/UPDATE/DELETE, GRANT, funciones ni datos.
-- Idempotente: recrea las tres políticas. La política del orientador se ajusta en
-- 20261029170000_orientaciones_inscripciones_orientador_tiene_rol.sql.
-- Reversión: supabase/proposals/orientaciones_inscripciones_select_rls_reversion.sql.
-- Pruebas: supabase/tests/orientaciones_rls_inscripciones_pruebas.sql.

BEGIN;

DO $$
DECLARE
    v_faltan text;
BEGIN
    SELECT string_agg(e.t || '.' || e.c, ', ') INTO v_faltan
    FROM (VALUES ('orientacion_inscripciones', 'id_orientacion_fk'),
                 ('orientacion_inscripciones', 'id_emprendedor_fk'),
                 ('orientacion_inscripciones', 'deleted_at'),
                 ('orientaciones', 'id_orientador_fk'),
                 ('orientaciones', 'deleted_at'),
                 ('emprendedores', 'usuario_id'),
                 ('emprendedores', 'deleted_at'),
                 ('usuarios', 'estado'),
                 ('usuarios', 'deleted_at'),
                 ('usuario_roles', 'id_usuario_fk'),
                 ('usuario_roles', 'id_rol_fk'),
                 ('usuario_roles', 'estado'),
                 ('usuario_roles', 'deleted_at'),
                 ('roles', 'nombre_rol'),
                 ('roles', 'estado'),
                 ('roles', 'deleted_at')) AS e(t, c)
    WHERE NOT EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_schema = 'public' AND table_name = e.t AND column_name = e.c);
    IF v_faltan IS NOT NULL THEN
        RAISE EXCEPTION 'Migración abortada: faltan columnas: %', v_faltan;
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.orientacion_inscripciones'::regclass) THEN
        RAISE EXCEPTION 'Migración abortada: RLS no está activo en orientacion_inscripciones';
    END IF;
END;
$$;

DROP POLICY IF EXISTS sigre_inscripciones_select_admin ON public.orientacion_inscripciones;
DROP POLICY IF EXISTS sigre_inscripciones_select_orientador ON public.orientacion_inscripciones;
DROP POLICY IF EXISTS sigre_inscripciones_select_propias ON public.orientacion_inscripciones;

CREATE POLICY sigre_inscripciones_select_admin
    ON public.orientacion_inscripciones
    FOR SELECT TO authenticated
    USING (
        orientacion_inscripciones.deleted_at IS NULL
        AND EXISTS (
            SELECT 1
            FROM public.usuario_roles ur
            JOIN public.roles r ON r.id = ur.id_rol_fk
            JOIN public.usuarios u ON u.id = ur.id_usuario_fk
            WHERE ur.id_usuario_fk = (SELECT auth.uid())
              AND lower(r.nombre_rol) = 'administrador'
              AND ur.estado = 'activo' AND ur.deleted_at IS NULL
              AND r.estado = 'activo' AND r.deleted_at IS NULL
              AND u.estado = 'activo' AND u.deleted_at IS NULL
        )
    );

CREATE POLICY sigre_inscripciones_select_orientador
    ON public.orientacion_inscripciones
    FOR SELECT TO authenticated
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

CREATE POLICY sigre_inscripciones_select_propias
    ON public.orientacion_inscripciones
    FOR SELECT TO authenticated
    USING (
        orientacion_inscripciones.deleted_at IS NULL
        AND EXISTS (
            SELECT 1
            FROM public.emprendedores e
            JOIN public.usuarios u ON u.id = e.usuario_id
            WHERE e.id = orientacion_inscripciones.id_emprendedor_fk
              AND e.usuario_id = (SELECT auth.uid())
              AND e.deleted_at IS NULL
              AND u.estado = 'activo' AND u.deleted_at IS NULL
        )
    );

COMMIT;
