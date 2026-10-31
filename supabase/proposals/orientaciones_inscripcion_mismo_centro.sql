-- SIGRE · MIGRACIÓN (NO APLICADA) · Requiere autorización expresa antes de ejecutarse.
-- Destino exclusivo: STAGING (febelffifcqzvnttpued). Prohibido en PRODUCTION.
-- Riesgo detectado (2026-10-29): sigre_inscribir_en_jornada no valida el centro SENA; un Emprendedor (o un
-- Orientador en su jornada) puede inscribir en una jornada de otro centro si conoce su id.
-- Corrección: tras resolver el emprendedor, los no Administradores solo inscriben si la ficha y la jornada
-- tienen el mismo centro (no nulo). El Administrador conserva la inscripción entre centros (autorización expresa).
-- Rechazo: SQLSTATE 42501 'Inscripción entre centros SENA no autorizada' (el frontend ya lo traduce como
-- "No tienes autorización para inscribir emprendedores en esta jornada.").
-- Mecánica: inserta un bloque tras la validación 'Emprendedor no disponible' sobre la definición actual
-- (pg_get_functiondef) y la recrea; el resto del cuerpo, firma, atributos, propietario y GRANT no cambian.
-- No toca inscripciones existentes (en STAGING no hay inscripciones entre centros).

BEGIN;

DO $$
DECLARE
    v_oid    constant regprocedure := 'public.sigre_inscribir_en_jornada(uuid,uuid)'::regprocedure;
    v_ancla  constant text := 'IF v_emprendedor IS NULL THEN RAISE EXCEPTION ''Emprendedor no disponible'' USING ERRCODE=''22023''; END IF;';
    v_bloque constant text := E'\r\n  -- SIGRE: inscripción entre centros solo con autorización expresa (Administrador).\r\n'
        || '  IF NOT v_es_admin AND NOT EXISTS (SELECT 1 FROM public.emprendedores e WHERE e.id = v_emprendedor '
        || 'AND e.id_centro_sena_fk IS NOT NULL AND e.id_centro_sena_fk = v_jornada.id_centro_sena_fk) THEN '
        || 'RAISE EXCEPTION ''Inscripción entre centros SENA no autorizada'' USING ERRCODE=''42501''; END IF;';
    v_def    text;
    v_acl    text;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = 'bbd440b7-717e-416c-a2e7-0a33ee1d1320') THEN
        RAISE EXCEPTION 'ABORTADO: este proyecto no es STAGING';
    END IF;
    IF (SELECT md5(prosrc) FROM pg_proc WHERE oid = v_oid) IS DISTINCT FROM '6143acbc6ad25153d16500dc2d4ddf47' THEN
        RAISE EXCEPTION 'ABORTADO: sigre_inscribir_en_jornada no es la versión original esperada (¿ya aplicada o cambiada?)';
    END IF;
    IF (SELECT (length(prosrc) - length(replace(prosrc, v_ancla, ''))) / length(v_ancla) FROM pg_proc WHERE oid = v_oid) <> 1 THEN
        RAISE EXCEPTION 'ABORTADO: el punto de inserción no aparece exactamente una vez';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE oid = v_oid AND prosecdef AND proconfig @> ARRAY['search_path=""']
                     AND pg_get_userbyid(proowner) = 'postgres') THEN
        RAISE EXCEPTION 'ABORTADO: atributos de la función distintos de los esperados';
    END IF;

    SELECT pg_get_functiondef(oid), proacl::text INTO v_def, v_acl FROM pg_proc WHERE oid = v_oid;
    EXECUTE replace(v_def, v_ancla, v_ancla || v_bloque);

    IF NOT EXISTS (SELECT 1 FROM pg_proc
                   WHERE oid = v_oid AND prosecdef AND proconfig @> ARRAY['search_path=""']
                     AND pg_get_userbyid(proowner) = 'postgres' AND proacl::text IS NOT DISTINCT FROM v_acl
                     AND position(v_bloque IN prosrc) > 0
                     AND md5(replace(prosrc, v_bloque, '')) = '6143acbc6ad25153d16500dc2d4ddf47') THEN
        RAISE EXCEPTION 'ABORTADO: la función resultante no es la original más el bloque previsto';
    END IF;
END;
$$;

COMMIT;

-- Esperado: version = mismo_centro.
SELECT CASE WHEN md5(prosrc) = '6143acbc6ad25153d16500dc2d4ddf47' THEN 'original'
            WHEN prosrc LIKE '%Inscripción entre centros SENA no autorizada%' THEN 'mismo_centro' ELSE 'desconocida' END AS version
FROM pg_proc WHERE oid = 'public.sigre_inscribir_en_jornada(uuid,uuid)'::regprocedure;
