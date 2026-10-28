-- SIGRE - Destino exclusivo: STAGING (febelffifcqzvnttpued). Prohibido en PRODUCTION.
-- Problema: sigre_admin_editar_proyecto / sigre_admin_eliminar_proyecto senalan el conflicto de version
-- con ERRCODE = '40001' (serialization_failure). PostgREST trata 40001 como transitorio y reintenta la
-- transaccion sin fin, por lo que la peticion nunca responde.
-- Correccion: sustituir solo ese codigo por PT409 (PostgREST responde HTTP 409, codigo "PT409").
-- Cada funcion se reescribe desde su definicion actual (pg_get_functiondef). Antes del COMMIT se verifica
-- que el cuerpo solo cambio en '40001' -> 'PT409' y que firma, propietario, permisos, SECURITY
-- DEFINER/INVOKER, search_path y demas propiedades son identicos. Cualquier diferencia aborta todo.

BEGIN;

CREATE TEMP TABLE _pt409_antes ON COMMIT DROP AS
SELECT p.oid, p.oid::regprocedure::text AS firma, p.prorettype, p.proowner, p.prosecdef, p.provolatile,
       p.proisstrict, p.proleakproof, p.proparallel, p.procost, p.prorows, p.proconfig,
       p.proacl::text AS permisos, obj_description(p.oid, 'pg_proc') AS comentario, p.prosrc
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('sigre_admin_editar_proyecto', 'sigre_admin_eliminar_proyecto');

DO $$
DECLARE
    v_fn     regprocedure;
    v_def    text;
    v_nueva  text;
    v_total  int := 0;
BEGIN
    -- Guarda de entorno: la cuenta Auth DEMO solo existe en STAGING.
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = 'bbd440b7-717e-416c-a2e7-0a33ee1d1320') THEN
        RAISE EXCEPTION 'ABORTADO: este proyecto no es STAGING';
    END IF;

    IF (SELECT count(*) FROM _pt409_antes) <> 2 THEN
        RAISE EXCEPTION 'ABORTADO: se esperaban exactamente 2 funciones de proyectos';
    END IF;
    IF EXISTS (SELECT 1 FROM _pt409_antes WHERE prosrc ~ 'PT409') THEN
        RAISE EXCEPTION 'ABORTADO: alguna funcion ya contiene PT409 (migracion aplicada previamente?)';
    END IF;

    FOR v_fn IN SELECT oid::regprocedure FROM _pt409_antes LOOP
        v_def := pg_get_functiondef(v_fn);
        v_nueva := regexp_replace(v_def, $re$(ERRCODE\s*=\s*')40001(')$re$, $re$\1PT409\2$re$, 'gi');

        IF v_nueva = v_def THEN
            RAISE EXCEPTION 'ABORTADO: % no usa ERRCODE = ''40001''', v_fn;
        END IF;
        IF v_nueva ~* '40001|serialization_failure' THEN
            RAISE EXCEPTION 'ABORTADO: % usa 40001 de una forma no prevista; corregir manualmente', v_fn;
        END IF;

        EXECUTE v_nueva;
        v_total := v_total + 1;
        RAISE NOTICE 'Actualizada: %', v_fn;
    END LOOP;

    IF v_total <> 2 THEN
        RAISE EXCEPTION 'ABORTADO: se esperaban 2 funciones y se actualizaron %', v_total;
    END IF;
END;
$$;

DO $$
BEGIN
    -- Logica intacta: revertir PT409 -> 40001 debe reproducir exactamente el cuerpo original.
    IF EXISTS (SELECT 1
               FROM _pt409_antes a
               LEFT JOIN pg_proc p ON p.oid = a.oid
               WHERE p.oid IS NULL
                  OR p.prosrc ~* '40001|serialization_failure'
                  OR p.prosrc = a.prosrc
                  OR replace(p.prosrc, 'PT409', '40001') <> a.prosrc) THEN
        RAISE EXCEPTION 'ABORTADO: el cuerpo de alguna funcion cambio mas alla del codigo de error';
    END IF;

    -- Propiedades intactas.
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

-- Comprobacion posterior (solo lectura): debe devolver 2 filas con usa_pt409 = true y usa_40001 = false.
SELECT p.oid::regprocedure AS firma,
       pg_get_userbyid(p.proowner) AS propietario,
       p.prosecdef AS security_definer,
       p.proconfig AS configuracion,
       p.proacl AS permisos,
       p.prosrc ~ 'PT409' AS usa_pt409,
       p.prosrc ~* '40001|serialization_failure' AS usa_40001
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('sigre_admin_editar_proyecto', 'sigre_admin_eliminar_proyecto');
