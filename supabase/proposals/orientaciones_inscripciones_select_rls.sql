-- SIGRE · MIGRACIÓN ESTRUCTURAL (NO APLICADA) · Requiere autorización expresa antes de ejecutarse.
-- Destino exclusivo: STAGING (febelffifcqzvnttpued). Prohibido en PRODUCTION.
-- Diagnóstico confirmado: orientacion_inscripciones tiene RLS activo y NINGUNA política; toda lectura
-- directa devuelve 0 filas y solo las RPC SECURITY DEFINER la leen.
-- Añade tres políticas permisivas FOR SELECT TO authenticated, todas ocultando el borrado lógico:
--   * sigre_inscripciones_select_admin      -> usuario activo con rol administrador activo: todas.
--   * sigre_inscripciones_select_orientador -> usuario activo con rol orientador activo: solo las de
--                                              jornadas no eliminadas con id_orientador_fk = auth.uid().
--   * sigre_inscripciones_select_propias    -> usuario activo dueño de la ficha (emprendedores.usuario_id).
-- anon, usuarios sin perfil, inactivos o con otros roles no obtienen filas.
-- No toca INSERT/UPDATE/DELETE, GRANT, funciones, otras tablas ni datos. No crea SECURITY DEFINER.
-- No depende de datos DEMO. Las pruebas de autorización están en
-- supabase/tests/orientaciones_rls_inscripciones_pruebas.sql y se ejecutan después, por separado.
-- Cualquier guarda fallida aborta la transacción: el COMMIT no llega a ejecutarse.

BEGIN;

-- 1. Guardas de entorno y estructura ---------------------------------------------------------------
DO $$
DECLARE
    v_faltan text;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = 'bbd440b7-717e-416c-a2e7-0a33ee1d1320') THEN
        RAISE EXCEPTION 'ABORTADO: este proyecto no es STAGING';
    END IF;

    SELECT string_agg(e.tabla || '.' || e.columna, ', ') INTO v_faltan
    FROM (VALUES
        ('orientacion_inscripciones', 'id_orientacion_fk'), ('orientacion_inscripciones', 'id_emprendedor_fk'),
        ('orientacion_inscripciones', 'deleted_at'),
        ('orientaciones', 'id'), ('orientaciones', 'id_orientador_fk'), ('orientaciones', 'deleted_at'),
        ('emprendedores', 'id'), ('emprendedores', 'usuario_id'), ('emprendedores', 'deleted_at'),
        ('usuarios', 'id'), ('usuarios', 'estado'), ('usuarios', 'deleted_at'),
        ('usuario_roles', 'id_usuario_fk'), ('usuario_roles', 'id_rol_fk'), ('usuario_roles', 'estado'),
        ('usuario_roles', 'deleted_at'),
        ('roles', 'id'), ('roles', 'nombre_rol'), ('roles', 'estado'), ('roles', 'deleted_at')
    ) AS e(tabla, columna)
    WHERE NOT EXISTS (SELECT 1 FROM information_schema.columns c
                      WHERE c.table_schema = 'public' AND c.table_name = e.tabla AND c.column_name = e.columna);
    IF v_faltan IS NOT NULL THEN
        RAISE EXCEPTION 'ABORTADO: faltan columnas: %', v_faltan;
    END IF;

    IF (SELECT count(*) FROM public.roles
        WHERE lower(nombre_rol) IN ('administrador', 'orientador') AND estado = 'activo' AND deleted_at IS NULL) <> 2 THEN
        RAISE EXCEPTION 'ABORTADO: se esperaban los roles administrador y orientador activos y únicos';
    END IF;

    IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.orientacion_inscripciones'::regclass) THEN
        RAISE EXCEPTION 'ABORTADO: RLS no está activo en orientacion_inscripciones';
    END IF;
    IF NOT has_table_privilege('authenticated', 'public.orientacion_inscripciones', 'SELECT') THEN
        RAISE EXCEPTION 'ABORTADO: authenticated no tiene SELECT sobre orientacion_inscripciones';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'orientacion_inscripciones') THEN
        RAISE EXCEPTION 'ABORTADO: orientacion_inscripciones ya tiene políticas; el diagnóstico cambió, revisar antes';
    END IF;

    -- Sin recursión: ni las políticas de las tablas que consultan las nuevas políticas, ni las funciones
    -- que esas políticas invocan, pueden leer orientacion_inscripciones.
    IF EXISTS (SELECT 1 FROM pg_policies
               WHERE schemaname = 'public'
                 AND tablename IN ('orientaciones', 'emprendedores', 'usuarios', 'usuario_roles', 'roles')
                 AND (coalesce(qual, '') || coalesce(with_check, '')) ILIKE '%orientacion_inscripciones%') THEN
        RAISE EXCEPTION 'ABORTADO: una política dependiente lee orientacion_inscripciones (riesgo de recursión)';
    END IF;
    IF EXISTS (
        WITH nombres AS (
            SELECT DISTINCT (regexp_matches(coalesce(qual, '') || ' ' || coalesce(with_check, ''),
                                            '([a-z_][a-z0-9_]*)\(', 'g'))[1] AS nombre
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename IN ('orientaciones', 'emprendedores', 'usuarios', 'usuario_roles', 'roles')
        )
        SELECT 1 FROM pg_proc p JOIN nombres n ON n.nombre = p.proname
        WHERE p.prosrc ILIKE '%orientacion_inscripciones%'
    ) THEN
        RAISE EXCEPTION 'ABORTADO: una función usada por políticas dependientes lee orientacion_inscripciones';
    END IF;
END;
$$;

CREATE TEMP TABLE _rls_antes ON COMMIT DROP AS
SELECT
    (SELECT md5(coalesce(string_agg(p.tablename || p.policyname || p.cmd || p.roles::text
                                    || coalesce(p.qual, '') || coalesce(p.with_check, ''),
                                    '|' ORDER BY p.tablename, p.policyname), ''))
     FROM pg_policies p
     WHERE p.schemaname = 'public' AND p.tablename <> 'orientacion_inscripciones') AS huella_otras_tablas,
    (SELECT relacl::text FROM pg_class WHERE oid = 'public.orientacion_inscripciones'::regclass) AS grants;

-- 2. Políticas SELECT -------------------------------------------------------------------------------
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

-- 3. Comprobación estructural previa al COMMIT --------------------------------------------------------
DO $$
DECLARE
    a _rls_antes%ROWTYPE;
BEGIN
    SELECT * INTO STRICT a FROM _rls_antes;

    IF (SELECT count(*) FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'orientacion_inscripciones') <> 3
       OR EXISTS (SELECT 1 FROM pg_policies
                  WHERE schemaname = 'public' AND tablename = 'orientacion_inscripciones'
                    AND (cmd <> 'SELECT' OR roles <> '{authenticated}' OR permissive <> 'PERMISSIVE')) THEN
        RAISE EXCEPTION 'ABORTADO: las políticas creadas no son exactamente 3 SELECT permisivas para authenticated';
    END IF;
    IF (SELECT md5(coalesce(string_agg(p.tablename || p.policyname || p.cmd || p.roles::text
                                       || coalesce(p.qual, '') || coalesce(p.with_check, ''),
                                       '|' ORDER BY p.tablename, p.policyname), ''))
        FROM pg_policies p
        WHERE p.schemaname = 'public' AND p.tablename <> 'orientacion_inscripciones') <> a.huella_otras_tablas
       OR (SELECT relacl::text FROM pg_class WHERE oid = 'public.orientacion_inscripciones'::regclass)
          IS DISTINCT FROM a.grants THEN
        RAISE EXCEPTION 'ABORTADO: cambiaron políticas de otras tablas o los GRANT';
    END IF;
END;
$$;

COMMIT;

-- ============================ VERIFICACIÓN POSTERIOR ============================
-- Esperado: exactamente 3 filas. "No rows returned" indica que el script no se ejecutó completo.
SELECT policyname, cmd, roles, permissive
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'orientacion_inscripciones'
ORDER BY policyname;

-- ================================== REVERSIÓN ==================================
-- Devuelve la tabla al estado diagnosticado (RLS activo sin políticas). No afecta datos.
-- BEGIN;
-- DROP POLICY IF EXISTS sigre_inscripciones_select_admin      ON public.orientacion_inscripciones;
-- DROP POLICY IF EXISTS sigre_inscripciones_select_orientador ON public.orientacion_inscripciones;
-- DROP POLICY IF EXISTS sigre_inscripciones_select_propias    ON public.orientacion_inscripciones;
-- DO $$ BEGIN
--     IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'orientacion_inscripciones') THEN
--         RAISE EXCEPTION 'ABORTADO: quedan políticas en orientacion_inscripciones';
--     END IF;
-- END $$;
-- COMMIT;
