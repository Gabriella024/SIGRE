-- A5-11: control de documentos duplicados en invitaciones abiertas.
-- PENDIENTE en STAGING: verificado el 2026-10-30 que la columna numero_documento no existe allí (la Edge Function
-- A5 versionada la usa). Aplicarla en cualquier entorno requiere autorización expresa.
-- No elimina ni modifica registros existentes.

BEGIN;

ALTER TABLE public.sigre_invitaciones
    ADD COLUMN IF NOT EXISTS numero_documento text;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.sigre_invitaciones'::regclass
          AND conname = 'sigre_invitaciones_documento_valido'
    ) THEN
        ALTER TABLE public.sigre_invitaciones
            ADD CONSTRAINT sigre_invitaciones_documento_valido
            CHECK (
                numero_documento IS NULL
                OR (
                    length(numero_documento) > 0
                    AND numero_documento = btrim(numero_documento)
                )
            );
    END IF;
END;
$$;

-- Abortar si ya existen documentos duplicados en invitaciones abiertas.
DO $$
DECLARE
    v_duplicados text;
BEGIN
    SELECT string_agg(numero_documento || ' (' || total || ')', ', ')
    INTO v_duplicados
    FROM (
        SELECT numero_documento, count(*) AS total
        FROM public.sigre_invitaciones
        WHERE numero_documento IS NOT NULL
          AND estado IN ('pendiente', 'requiere_revision')
        GROUP BY numero_documento
        HAVING count(*) > 1
    ) AS duplicados;

    IF v_duplicados IS NOT NULL THEN
        RAISE EXCEPTION
            'Documentos duplicados en invitaciones abiertas: %', v_duplicados
            USING ERRCODE = '23505';
    END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS sigre_invitaciones_documento_abierto_uk
    ON public.sigre_invitaciones (numero_documento)
    WHERE numero_documento IS NOT NULL
      AND estado IN ('pendiente', 'requiere_revision');

COMMENT ON COLUMN public.sigre_invitaciones.numero_documento IS
    'Documento del invitado; único entre invitaciones pendientes o en revisión.';

COMMIT;
