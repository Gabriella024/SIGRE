-- SIGRE · REVERSIÓN de orientaciones_inscripcion_mismo_centro.sql · Solo STAGING.
-- Retira el bloque insertado y deja sigre_inscribir_en_jornada exactamente como antes (md5(prosrc) = 6143acbc…).
-- Solo actúa si la función contiene el bloque; conserva propietario, atributos y GRANT.

BEGIN;

DO $$
DECLARE
    v_oid    constant regprocedure := 'public.sigre_inscribir_en_jornada(uuid,uuid)'::regprocedure;
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
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE oid = v_oid AND position(v_bloque IN prosrc) > 0) THEN
        RAISE EXCEPTION 'ABORTADO: la función no contiene el bloque de mismo centro; nada que revertir';
    END IF;

    SELECT pg_get_functiondef(oid), proacl::text INTO v_def, v_acl FROM pg_proc WHERE oid = v_oid;
    EXECUTE replace(v_def, v_bloque, '');

    IF NOT EXISTS (SELECT 1 FROM pg_proc
                   WHERE oid = v_oid AND md5(prosrc) = '6143acbc6ad25153d16500dc2d4ddf47'
                     AND prosecdef AND proconfig @> ARRAY['search_path=""'] AND proacl::text IS NOT DISTINCT FROM v_acl) THEN
        RAISE EXCEPTION 'ABORTADO: la reversión no reproduce exactamente la versión original';
    END IF;
END;
$$;

COMMIT;

SELECT CASE WHEN md5(prosrc) = '6143acbc6ad25153d16500dc2d4ddf47' THEN 'original' ELSE 'mismo_centro' END AS version
FROM pg_proc WHERE oid = 'public.sigre_inscribir_en_jornada(uuid,uuid)'::regprocedure;
