-- SIGRE - PROPUESTA, NO EJECUTAR SIN AUTORIZACION. Destino exclusivo: STAGING (febelffifcqzvnttpued).
-- Mismo defecto que proyectos (20261028120000_proyectos_conflicto_pt409.sql): 11 funciones mas senalan
-- conflictos con ERRCODE = '40001' y PostgREST las reintenta sin fin. Correccion agrupada: '40001' -> 'PT409'.
-- Requiere antes el cambio de frontend que reconoce PT409 (src/lib/adminOperation.ts y servicios de
-- emprendedores); sin el, los conflictos se mostrarian como error generico en lugar de conflicto.

-- Paso 1 (solo lectura): revisar que la lista coincide con las 11 funciones del diagnostico Q2.
SELECT p.oid::regprocedure AS firma, pg_get_userbyid(p.proowner) AS propietario, p.prosecdef, p.proconfig
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prosrc ~* '40001|serialization_failure'
  AND p.proname NOT IN ('sigre_admin_editar_proyecto', 'sigre_admin_eliminar_proyecto')
ORDER BY 1::text;

-- Paso 2: aplicar.
BEGIN;

CREATE TEMP TABLE _pt409_antes ON COMMIT DROP AS
SELECT p.oid, p.oid::regprocedure::text AS firma, p.prorettype, p.proowner, p.prosecdef, p.provolatile,
       p.proisstrict, p.proleakproof, p.proparallel, p.procost, p.prorows, p.proconfig,
       p.proacl::text AS permisos, obj_description(p.oid, 'pg_proc') AS comentario, p.prosrc
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prosrc ~* '40001|serialization_failure'
  AND p.proname NOT IN ('sigre_admin_editar_proyecto', 'sigre_admin_eliminar_proyecto');

DO $$
DECLARE
    v_fn     regprocedure;
    v_def    text;
    v_nueva  text;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = 'bbd440b7-717e-416c-a2e7-0a33ee1d1320') THEN
        RAISE EXCEPTION 'ABORTADO: este proyecto no es STAGING';
    END IF;
    IF (SELECT count(*) FROM _pt409_antes) <> 11 THEN
        RAISE EXCEPTION 'ABORTADO: se esperaban 11 funciones y hay %', (SELECT count(*) FROM _pt409_antes);
    END IF;
    IF EXISTS (SELECT 1 FROM _pt409_antes WHERE prosrc ~ 'PT409') THEN
        RAISE EXCEPTION 'ABORTADO: alguna funcion ya contiene PT409';
    END IF;

    FOR v_fn IN SELECT oid::regprocedure FROM _pt409_antes LOOP
        v_def := pg_get_functiondef(v_fn);
        v_nueva := regexp_replace(v_def, $re$(ERRCODE\s*=\s*')40001(')$re$, $re$\1PT409\2$re$, 'gi');
        IF v_nueva = v_def OR v_nueva ~* '40001|serialization_failure' THEN
            RAISE EXCEPTION 'ABORTADO: % usa 40001 de una forma no prevista; corregir manualmente', v_fn;
        END IF;
        EXECUTE v_nueva;
        RAISE NOTICE 'Actualizada: %', v_fn;
    END LOOP;
END;
$$;

DO $$
BEGIN
    IF EXISTS (SELECT 1
               FROM _pt409_antes a
               LEFT JOIN pg_proc p ON p.oid = a.oid
               WHERE p.oid IS NULL
                  OR p.prosrc ~* '40001|serialization_failure'
                  OR p.prosrc = a.prosrc
                  OR replace(p.prosrc, 'PT409', '40001') <> a.prosrc) THEN
        RAISE EXCEPTION 'ABORTADO: el cuerpo de alguna funcion cambio mas alla del codigo de error';
    END IF;
    IF EXISTS (SELECT 1
               FROM _pt409_antes a
               JOIN pg_proc p ON p.oid = a.oid
               WHERE (p.oid::regprocedure::text, p.prorettype, p.proowner, p.prosecdef, p.provolatile,
                      p.proisstrict, p.proleakproof, p.proparallel, p.procost, p.prorows, p.proconfig,
                      p.proacl::text, obj_description(p.oid, 'pg_proc'))
                     IS DISTINCT FROM
                     (a.firma, a.prorettype, a.proowner, a.prosecdef, a.provolatile,
                      a.proisstrict, a.proleakproof, a.proparallel, a.procost, a.prorows, a.proconfig,
                      a.permisos, a.comentario)) THEN
        RAISE EXCEPTION 'ABORTADO: cambiaron firma, propietario, permisos u otras propiedades';
    END IF;
END;
$$;

NOTIFY pgrst, 'reload schema';

COMMIT;
