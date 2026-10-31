-- SIGRE · Orientación masiva: carga de asistentes, prospectos orientados y cola de invitaciones.
-- Idempotente. La orientación masiva es captación: no crea emprendedores; los aprendices deciden
-- voluntariamente si continúan con el registro formal (sigre_responder_invitacion_ruta).

ALTER TABLE public.registros_carga_masiva
  ADD COLUMN IF NOT EXISTS fila integer,
  ADD COLUMN IF NOT EXISTS nombres text,
  ADD COLUMN IF NOT EXISTS apellidos text,
  ADD COLUMN IF NOT EXISTS numero_documento text,
  ADD COLUMN IF NOT EXISTS departamento text,
  ADD COLUMN IF NOT EXISTS municipio text,
  ADD COLUMN IF NOT EXISTS fecha_nacimiento date,
  ADD COLUMN IF NOT EXISTS edad smallint,
  ADD COLUMN IF NOT EXISTS genero text,
  ADD COLUMN IF NOT EXISTS nacionalidad text,
  ADD COLUMN IF NOT EXISTS celular text,
  ADD COLUMN IF NOT EXISTS clasificacion_poblacional text,
  ADD COLUMN IF NOT EXISTS tipo_emprendedor text,
  ADD COLUMN IF NOT EXISTS nivel_formacion text,
  ADD COLUMN IF NOT EXISTS segmentacion text,
  ADD COLUMN IF NOT EXISTS id_prospecto_fk uuid;

ALTER TABLE public.cargas
  ADD COLUMN IF NOT EXISTS inscritos integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS prospectos integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS invitaciones integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.prospectos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_documento text NOT NULL,
  numero_documento text NOT NULL,
  nombres text NOT NULL,
  apellidos text NOT NULL,
  correo text,
  celular text,
  departamento text,
  municipio text,
  fecha_nacimiento date,
  genero text,
  nacionalidad text,
  clasificacion_poblacional text,
  tipo_emprendedor text,
  nivel_formacion text,
  segmentacion text,
  id_orientacion_origen_fk uuid REFERENCES public.orientaciones(id) ON DELETE SET NULL,
  id_carga_origen_fk uuid REFERENCES public.cargas(id) ON DELETE SET NULL,
  estado text NOT NULL DEFAULT 'orientado',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT prospectos_documento_unico UNIQUE (tipo_documento, numero_documento),
  CONSTRAINT prospectos_estado_check CHECK (estado IN ('orientado', 'invitado', 'acepto', 'rechazo', 'registrado'))
);

CREATE TABLE IF NOT EXISTS public.invitaciones_ruta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_prospecto_fk uuid NOT NULL REFERENCES public.prospectos(id) ON DELETE CASCADE,
  id_carga_fk uuid REFERENCES public.cargas(id) ON DELETE SET NULL,
  correo text NOT NULL,
  token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  estado text NOT NULL DEFAULT 'pendiente',
  intentos integer NOT NULL DEFAULT 0,
  enviada_at timestamptz,
  respondida_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT invitaciones_ruta_estado_check CHECK (estado IN ('pendiente', 'enviada', 'aceptada', 'rechazada', 'error'))
);

CREATE UNIQUE INDEX IF NOT EXISTS invitaciones_ruta_una_activa
  ON public.invitaciones_ruta (id_prospecto_fk) WHERE estado IN ('pendiente', 'enviada');

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'registros_carga_masiva_prospecto_fk') THEN
    ALTER TABLE public.registros_carga_masiva ADD CONSTRAINT registros_carga_masiva_prospecto_fk
      FOREIGN KEY (id_prospecto_fk) REFERENCES public.prospectos(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'registros_carga_masiva_estado_check') THEN
    ALTER TABLE public.registros_carga_masiva ADD CONSTRAINT registros_carga_masiva_estado_check
      CHECK (estado_validacion IN ('pendiente', 'valida', 'error', 'duplicada', 'existente'));
  END IF;
END $$;

ALTER TABLE public.prospectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitaciones_ruta ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.prospectos, public.invitaciones_ruta FROM anon;
GRANT SELECT ON public.prospectos, public.invitaciones_ruta TO authenticated;

-- Lectura: Administrador todo; Coordinador por centro de la jornada; Orientador sus jornadas.
CREATE OR REPLACE FUNCTION public.sigre_puede_ver_carga_jornada(p_id_orientacion uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
  SELECT public.tiene_rol('administrador')
      OR EXISTS (SELECT 1 FROM public.orientaciones o
                 WHERE o.id = p_id_orientacion AND o.deleted_at IS NULL
                   AND ((public.tiene_rol('orientador') AND o.id_orientador_fk = auth.uid())
                     OR (public.tiene_rol('coordinador') AND public.coordinador_puede_ver_centro(o.id_centro_sena_fk))));
$$;
REVOKE ALL ON FUNCTION public.sigre_puede_ver_carga_jornada(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sigre_puede_ver_carga_jornada(uuid) TO authenticated;

DROP POLICY IF EXISTS sigre_prospectos_select ON public.prospectos;
CREATE POLICY sigre_prospectos_select ON public.prospectos FOR SELECT TO authenticated
  USING (public.sigre_puede_ver_carga_jornada(id_orientacion_origen_fk));

DROP POLICY IF EXISTS sigre_invitaciones_ruta_select ON public.invitaciones_ruta;
CREATE POLICY sigre_invitaciones_ruta_select ON public.invitaciones_ruta FOR SELECT TO authenticated
  USING (public.tiene_rol('administrador'));

DROP POLICY IF EXISTS sigre_cargas_select ON public.cargas;
CREATE POLICY sigre_cargas_select ON public.cargas FOR SELECT TO authenticated
  USING (public.sigre_puede_ver_carga_jornada(id_orientacion_fk));

DROP POLICY IF EXISTS sigre_registros_carga_select ON public.registros_carga_masiva;
CREATE POLICY sigre_registros_carga_select ON public.registros_carga_masiva FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.cargas c WHERE c.id = id_carga_fk AND public.sigre_puede_ver_carga_jornada(c.id_orientacion_fk)));

CREATE OR REPLACE FUNCTION public.sigre_registrar_carga_asistentes(
  p_id_orientacion uuid,
  p_nombre_archivo text,
  p_asistentes jsonb,
  p_rechazados jsonb DEFAULT '[]'::jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_es_admin boolean := public.tiene_rol('administrador');
  v_jornada public.orientaciones%ROWTYPE;
  v_carga uuid;
  v_item jsonb;
  v_fila integer;
  v_tipo text; v_doc text; v_nombres text; v_apellidos text; v_correo text;
  v_fecha date; v_edad smallint;
  v_emprendedor uuid; v_centro_emp uuid; v_prospecto uuid; v_prospecto_nuevo boolean;
  v_estado text; v_mensaje text;
  v_docs text[] := '{}'; v_correos text[] := '{}';
  v_resultados jsonb := '[]'::jsonb;
  v_validas integer := 0; v_errores integer := 0; v_duplicadas integer := 0; v_existentes integer := 0;
  v_inscritos integer := 0; v_prospectos integer := 0; v_invitaciones integer := 0; v_n integer;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Sesión requerida' USING ERRCODE = '42501'; END IF;

  SELECT * INTO v_jornada FROM public.orientaciones WHERE id = p_id_orientacion AND deleted_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Jornada no encontrada o archivada' USING ERRCODE = 'P0002'; END IF;

  IF NOT (v_es_admin OR (public.tiene_rol('orientador') AND v_jornada.id_orientador_fk IS NOT DISTINCT FROM v_uid
                         AND coalesce(public.tiene_permiso('orientacion_masiva', 'crear'), false))) THEN
    RAISE EXCEPTION 'Carga masiva no autorizada' USING ERRCODE = '42501';
  END IF;
  IF lower(coalesce(v_jornada.estado, '')) = 'cancelada' THEN
    RAISE EXCEPTION 'La jornada está cancelada' USING ERRCODE = '22023';
  END IF;
  IF jsonb_typeof(p_asistentes) <> 'array' OR jsonb_typeof(coalesce(p_rechazados, '[]'::jsonb)) <> 'array' THEN
    RAISE EXCEPTION 'Formato de carga no válido' USING ERRCODE = '22023';
  END IF;
  IF jsonb_array_length(p_asistentes) + jsonb_array_length(coalesce(p_rechazados, '[]'::jsonb)) > 2000 THEN
    RAISE EXCEPTION 'La carga supera el máximo de 2000 filas' USING ERRCODE = '22023';
  END IF;
  IF nullif(btrim(p_nombre_archivo), '') IS NULL THEN
    RAISE EXCEPTION 'El nombre del archivo es obligatorio' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.cargas (id_orientacion_fk, id_usuario_fk, nombre_archivo, estado_carga)
  VALUES (p_id_orientacion, v_uid, left(btrim(p_nombre_archivo), 255), 'pendiente')
  RETURNING id INTO v_carga;

  -- Filas rechazadas por el validador del cliente: se conservan para trazabilidad.
  FOR v_item IN SELECT value FROM jsonb_array_elements(coalesce(p_rechazados, '[]'::jsonb)) LOOP
    v_estado := CASE WHEN v_item->>'estado' = 'duplicada' THEN 'duplicada' ELSE 'error' END;
    INSERT INTO public.registros_carga_masiva (id_carga_fk, fila, nombre_apellido, numero_documento, correo, estado_validacion, mensaje_error)
    VALUES (v_carga, (v_item->>'fila')::integer, left(v_item->>'nombre', 200), left(v_item->>'numero_documento', 20),
            left(lower(v_item->>'correo'), 254), v_estado, left(v_item->>'mensaje', 500));
    IF v_estado = 'duplicada' THEN v_duplicadas := v_duplicadas + 1; ELSE v_errores := v_errores + 1; END IF;
  END LOOP;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_asistentes) LOOP
    v_fila := nullif(v_item->>'fila', '')::integer;
    v_tipo := upper(btrim(coalesce(v_item->>'tipo_documento', '')));
    v_doc := upper(btrim(coalesce(v_item->>'numero_documento', '')));
    v_nombres := btrim(coalesce(v_item->>'nombres', ''));
    v_apellidos := btrim(coalesce(v_item->>'apellidos', ''));
    v_correo := nullif(lower(btrim(coalesce(v_item->>'correo', ''))), '');
    v_emprendedor := NULL; v_prospecto := NULL; v_prospecto_nuevo := false; v_mensaje := NULL;
    v_fecha := NULL; v_edad := NULL;

    BEGIN
      v_fecha := nullif(v_item->>'fecha_nacimiento', '')::date;
      v_edad := nullif(v_item->>'edad', '')::smallint;
    EXCEPTION WHEN others THEN
      v_mensaje := 'Fecha de nacimiento o edad no válidas.';
    END;

    IF v_mensaje IS NULL AND (v_fila IS NULL OR v_tipo !~ '^[A-Z]{1,5}$' OR v_doc !~ '^[A-Z0-9-]{4,20}$'
        OR v_nombres = '' OR v_apellidos = '' OR length(v_nombres) > 80 OR length(v_apellidos) > 80
        OR (v_correo IS NOT NULL AND v_correo !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')) THEN
      v_mensaje := 'Datos obligatorios incompletos o con formato no válido.';
    END IF;

    IF v_mensaje IS NOT NULL THEN
      v_estado := 'error'; v_errores := v_errores + 1;
    ELSIF (v_tipo || ':' || v_doc) = ANY (v_docs) OR (v_correo IS NOT NULL AND v_correo = ANY (v_correos)) THEN
      v_estado := 'duplicada'; v_duplicadas := v_duplicadas + 1;
      v_mensaje := 'Documento o correo repetido en el archivo.';
    ELSE
      v_docs := v_docs || (v_tipo || ':' || v_doc);
      IF v_correo IS NOT NULL THEN v_correos := v_correos || v_correo; END IF;

      SELECT e.id, e.id_centro_sena_fk INTO v_emprendedor, v_centro_emp
      FROM public.emprendedores e JOIN public.usuarios u ON u.id = e.usuario_id
      WHERE e.deleted_at IS NULL AND (upper(u.numero_documento) = v_doc OR (v_correo IS NOT NULL AND lower(u.correo_electronico) = v_correo))
      ORDER BY (upper(u.numero_documento) = v_doc) DESC LIMIT 1;

      IF v_emprendedor IS NOT NULL THEN
        v_estado := 'existente'; v_existentes := v_existentes + 1;
        IF v_es_admin OR v_centro_emp IS NOT DISTINCT FROM v_jornada.id_centro_sena_fk THEN
          INSERT INTO public.orientacion_inscripciones (id_orientacion_fk, id_emprendedor_fk, origen)
          VALUES (p_id_orientacion, v_emprendedor, 'masivo') ON CONFLICT DO NOTHING;
          GET DIAGNOSTICS v_n = ROW_COUNT;
          v_inscritos := v_inscritos + v_n;
          v_mensaje := CASE WHEN v_n = 1 THEN 'Emprendedor registrado: inscrito en la jornada.' ELSE 'Emprendedor registrado: ya estaba inscrito.' END;
        ELSE
          v_mensaje := 'Emprendedor registrado de otro centro: no se inscribió.';
        END IF;
      ELSE
        SELECT id INTO v_prospecto FROM public.prospectos WHERE tipo_documento = v_tipo AND numero_documento = v_doc;
        IF v_prospecto IS NOT NULL THEN
          v_estado := 'existente'; v_existentes := v_existentes + 1;
          v_mensaje := 'Prospecto ya orientado anteriormente.';
          IF v_correo IS NOT NULL THEN
            UPDATE public.prospectos SET correo = coalesce(correo, v_correo), updated_at = now() WHERE id = v_prospecto;
          END IF;
        ELSE
          v_estado := 'valida'; v_validas := v_validas + 1;
          IF v_correo IS NOT NULL THEN
            INSERT INTO public.prospectos (tipo_documento, numero_documento, nombres, apellidos, correo, celular, departamento, municipio,
              fecha_nacimiento, genero, nacionalidad, clasificacion_poblacional, tipo_emprendedor, nivel_formacion, segmentacion,
              id_orientacion_origen_fk, id_carga_origen_fk)
            VALUES (v_tipo, v_doc, v_nombres, v_apellidos, v_correo, nullif(btrim(v_item->>'celular'), ''),
              nullif(btrim(v_item->>'departamento'), ''), nullif(btrim(v_item->>'municipio'), ''), v_fecha,
              nullif(btrim(v_item->>'genero'), ''), nullif(btrim(v_item->>'nacionalidad'), ''),
              nullif(btrim(v_item->>'clasificacion_poblacional'), ''), nullif(btrim(v_item->>'tipo_emprendedor'), ''),
              nullif(btrim(v_item->>'nivel_formacion'), ''), nullif(btrim(v_item->>'segmentacion'), ''), p_id_orientacion, v_carga)
            RETURNING id INTO v_prospecto;
            v_prospecto_nuevo := true;
            v_prospectos := v_prospectos + 1;
            v_mensaje := 'Prospecto orientado creado.';
          ELSE
            v_mensaje := 'Asistente registrado sin correo: no se crea prospecto ni invitación.';
          END IF;
        END IF;

        IF v_prospecto IS NOT NULL AND v_correo IS NOT NULL THEN
          INSERT INTO public.invitaciones_ruta (id_prospecto_fk, id_carga_fk, correo)
          SELECT v_prospecto, v_carga, coalesce(p.correo, v_correo) FROM public.prospectos p
          WHERE p.id = v_prospecto AND p.estado IN ('orientado', 'invitado')
          ON CONFLICT DO NOTHING;
          GET DIAGNOSTICS v_n = ROW_COUNT;
          IF v_n = 1 THEN
            v_invitaciones := v_invitaciones + 1;
            UPDATE public.prospectos SET estado = 'invitado', updated_at = now() WHERE id = v_prospecto AND estado = 'orientado';
            v_mensaje := v_mensaje || ' Invitación en cola.';
          END IF;
        END IF;
      END IF;
    END IF;

    INSERT INTO public.registros_carga_masiva (id_carga_fk, fila, nombre_apellido, nombres, apellidos, tipo_documento, numero_documento, correo,
      departamento, municipio, fecha_nacimiento, edad, genero, nacionalidad, celular, clasificacion_poblacional, tipo_emprendedor,
      nivel_formacion, segmentacion, estado_validacion, mensaje_error, id_emprendedor_fk, id_prospecto_fk)
    VALUES (v_carga, v_fila, left(btrim(v_nombres || ' ' || v_apellidos), 200), left(v_nombres, 80), left(v_apellidos, 80), left(v_tipo, 5),
      left(v_doc, 20), left(v_correo, 254), left(v_item->>'departamento', 80), left(v_item->>'municipio', 80),
      CASE WHEN v_estado = 'error' THEN NULL ELSE v_fecha END, CASE WHEN v_estado = 'error' THEN NULL ELSE v_edad END,
      left(v_item->>'genero', 40), left(v_item->>'nacionalidad', 60), left(v_item->>'celular', 20), left(v_item->>'clasificacion_poblacional', 80),
      left(v_item->>'tipo_emprendedor', 80), left(v_item->>'nivel_formacion', 80), left(v_item->>'segmentacion', 80),
      v_estado, v_mensaje, v_emprendedor, v_prospecto);

    v_resultados := v_resultados || jsonb_build_object('fila', v_fila,
      'estado', CASE v_estado WHEN 'valida' THEN 'registrada' WHEN 'existente' THEN 'existente' ELSE 'rechazada' END,
      'mensaje', v_mensaje);
  END LOOP;

  UPDATE public.cargas SET
    total_fila = v_validas + v_errores + v_duplicadas + v_existentes, fila_valida = v_validas, fila_error = v_errores,
    fila_duplicada = v_duplicadas, fila_existente = v_existentes, inscritos = v_inscritos, prospectos = v_prospectos,
    invitaciones = v_invitaciones, estado_carga = 'procesada'
  WHERE id = v_carga;

  INSERT INTO public.auditorias (id_usuario_fk, tabla_afectada, accion, valor_anterior, valor_nuevo, razon_cambio)
  VALUES (v_uid, 'cargas', 'CARGA_MASIVA_REGISTRADA', NULL,
    jsonb_build_object('id', v_carga, 'id_orientacion_fk', p_id_orientacion, 'archivo', left(btrim(p_nombre_archivo), 255),
      'validas', v_validas, 'errores', v_errores, 'duplicadas', v_duplicadas, 'existentes', v_existentes,
      'inscritos', v_inscritos, 'prospectos', v_prospectos, 'invitaciones', v_invitaciones),
    'Carga masiva de asistentes de orientación');

  RETURN jsonb_build_object('id_carga', v_carga, 'resultados', v_resultados,
    'resumen', jsonb_build_object('validas', v_validas, 'errores', v_errores, 'duplicadas', v_duplicadas, 'existentes', v_existentes,
      'inscritos', v_inscritos, 'prospectos', v_prospectos, 'invitaciones', v_invitaciones));
END;
$$;
REVOKE ALL ON FUNCTION public.sigre_registrar_carga_asistentes(uuid, text, jsonb, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sigre_registrar_carga_asistentes(uuid, text, jsonb, jsonb) TO authenticated;

-- Respuesta voluntaria del aprendiz desde el enlace de su invitación (token no adivinable).
CREATE OR REPLACE FUNCTION public.sigre_consultar_invitacion_ruta(p_token uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
  SELECT jsonb_build_object('nombres', p.nombres, 'estado', i.estado, 'jornada', o.tema, 'fecha', o.fecha)
  FROM public.invitaciones_ruta i
  JOIN public.prospectos p ON p.id = i.id_prospecto_fk
  LEFT JOIN public.orientaciones o ON o.id = p.id_orientacion_origen_fk
  WHERE i.token = p_token;
$$;

CREATE OR REPLACE FUNCTION public.sigre_responder_invitacion_ruta(p_token uuid, p_acepta boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
DECLARE
  v_inv public.invitaciones_ruta%ROWTYPE;
  v_estado text := CASE WHEN p_acepta THEN 'aceptada' ELSE 'rechazada' END;
BEGIN
  IF p_token IS NULL OR p_acepta IS NULL THEN RAISE EXCEPTION 'Respuesta no válida' USING ERRCODE = '22023'; END IF;
  SELECT * INTO v_inv FROM public.invitaciones_ruta WHERE token = p_token FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invitación no encontrada' USING ERRCODE = 'P0002'; END IF;
  IF v_inv.estado NOT IN ('pendiente', 'enviada') THEN
    RAISE EXCEPTION 'La invitación ya fue respondida' USING ERRCODE = '22023';
  END IF;

  UPDATE public.invitaciones_ruta SET estado = v_estado, respondida_at = now(), updated_at = now() WHERE id = v_inv.id;
  UPDATE public.prospectos SET estado = CASE WHEN p_acepta THEN 'acepto' ELSE 'rechazo' END, updated_at = now()
  WHERE id = v_inv.id_prospecto_fk AND estado IN ('orientado', 'invitado');

  INSERT INTO public.auditorias (id_usuario_fk, tabla_afectada, accion, valor_anterior, valor_nuevo, razon_cambio)
  VALUES (auth.uid(), 'invitaciones_ruta', 'INVITACION_RESPONDIDA', jsonb_build_object('estado', v_inv.estado),
    jsonb_build_object('id', v_inv.id, 'id_prospecto_fk', v_inv.id_prospecto_fk, 'estado', v_estado),
    'Decisión voluntaria del aprendiz sobre el registro formal');

  RETURN jsonb_build_object('estado', v_estado);
END;
$$;
REVOKE ALL ON FUNCTION public.sigre_consultar_invitacion_ruta(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sigre_responder_invitacion_ruta(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sigre_consultar_invitacion_ruta(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sigre_responder_invitacion_ruta(uuid, boolean) TO anon, authenticated;
