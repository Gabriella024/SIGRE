-- SIGRE · REVERSIÓN de 20261030090000_orientacion_masiva_carga_prospectos.sql. Ejecutar solo con autorización.
-- Aborta si ya existen cargas, prospectos o invitaciones (datos reales que se perderían).

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.prospectos') IS NOT NULL AND (EXISTS (SELECT 1 FROM public.prospectos) OR EXISTS (SELECT 1 FROM public.invitaciones_ruta)) THEN
    RAISE EXCEPTION 'ABORTADO: existen prospectos o invitaciones; respaldarlos antes de revertir';
  END IF;
  IF EXISTS (SELECT 1 FROM public.cargas) THEN
    RAISE EXCEPTION 'ABORTADO: existen cargas registradas; respaldarlas antes de revertir';
  END IF;
END $$;

DROP FUNCTION IF EXISTS public.sigre_responder_invitacion_ruta(uuid, boolean);
DROP FUNCTION IF EXISTS public.sigre_consultar_invitacion_ruta(uuid);
DROP FUNCTION IF EXISTS public.sigre_registrar_carga_asistentes(uuid, text, jsonb, jsonb);
DROP POLICY IF EXISTS sigre_registros_carga_select ON public.registros_carga_masiva;
DROP POLICY IF EXISTS sigre_cargas_select ON public.cargas;
ALTER TABLE public.registros_carga_masiva DROP CONSTRAINT IF EXISTS registros_carga_masiva_prospecto_fk;
ALTER TABLE public.registros_carga_masiva DROP CONSTRAINT IF EXISTS registros_carga_masiva_estado_check;
DROP TABLE IF EXISTS public.invitaciones_ruta;
DROP TABLE IF EXISTS public.prospectos;
DROP FUNCTION IF EXISTS public.sigre_puede_ver_carga_jornada(uuid);

ALTER TABLE public.cargas DROP COLUMN IF EXISTS inscritos, DROP COLUMN IF EXISTS prospectos, DROP COLUMN IF EXISTS invitaciones;
ALTER TABLE public.registros_carga_masiva
  DROP COLUMN IF EXISTS fila, DROP COLUMN IF EXISTS nombres, DROP COLUMN IF EXISTS apellidos, DROP COLUMN IF EXISTS numero_documento,
  DROP COLUMN IF EXISTS departamento, DROP COLUMN IF EXISTS municipio, DROP COLUMN IF EXISTS fecha_nacimiento, DROP COLUMN IF EXISTS edad,
  DROP COLUMN IF EXISTS genero, DROP COLUMN IF EXISTS nacionalidad, DROP COLUMN IF EXISTS celular, DROP COLUMN IF EXISTS clasificacion_poblacional,
  DROP COLUMN IF EXISTS tipo_emprendedor, DROP COLUMN IF EXISTS nivel_formacion, DROP COLUMN IF EXISTS segmentacion, DROP COLUMN IF EXISTS id_prospecto_fk;

COMMIT;
