-- SIGRE · Orientaciones · Inscripción solo en jornadas del mismo centro SENA salvo Administrador.
-- sigre_inscribir_en_jornada no validaba el centro. Tras resolver el emprendedor, los no Administradores solo
-- inscriben si la ficha y la jornada tienen el mismo centro (no nulo): 42501 'Inscripción entre centros SENA
-- no autorizada'. El resto de reglas no cambia (identidad, estado, cupo, inicio, duplicado, auditoría).
-- Idempotente (CREATE OR REPLACE con el cuerpo completo; misma firma y atributos).
-- Antes de aplicarla en otro entorno, comparar su sigre_inscribir_en_jornada con la versión de la que parte
-- esta migración (ver supabase/proposals/orientaciones_cierre_migraciones.md).
-- Reversión: supabase/proposals/orientaciones_inscripcion_mismo_centro_reversion.sql.
-- Pruebas: supabase/tests/orientaciones_inscripcion_mismo_centro_pruebas.sql.

BEGIN;

DO $$
DECLARE
    v_faltan text;
BEGIN
    SELECT string_agg(e.t || '.' || e.c, ', ') INTO v_faltan
    FROM (VALUES ('orientaciones', 'id_centro_sena_fk'),
                 ('emprendedores', 'id_centro_sena_fk'),
                 ('orientacion_inscripciones', 'origen'),
                 ('auditorias', 'valor_nuevo')) AS e(t, c)
    WHERE NOT EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_schema = 'public' AND table_name = e.t AND column_name = e.c);
    IF v_faltan IS NOT NULL THEN
        RAISE EXCEPTION 'Migración abortada: faltan columnas: %', v_faltan;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.sigre_inscribir_en_jornada(p_orientacion_id uuid, p_emprendedor_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_emprendedor uuid;
  v_jornada public.orientaciones%ROWTYPE;
  v_inscripcion uuid;
  v_activos bigint;
  v_es_admin boolean;
  v_es_orientador boolean;
  v_es_emprendedor boolean;
  v_origen text;
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'Autenticación requerida' USING ERRCODE='42501'; END IF;
  -- Comprobar usuario real y activo, no solo claims JWT.
  IF NOT EXISTS (SELECT 1 FROM public.usuarios u
                 WHERE u.id=v_actor AND u.deleted_at IS NULL AND u.estado='activo') THEN
    RAISE EXCEPTION 'Usuario no activo' USING ERRCODE='42501';
  END IF;
  v_es_admin := public.tiene_rol('administrador');
  v_es_orientador := public.tiene_rol('orientador');
  v_es_emprendedor := public.tiene_rol('emprendedor');

  -- El bloqueo de fila serializa los intentos concurrentes de esta jornada.
  SELECT * INTO v_jornada FROM public.orientaciones
  WHERE id=p_orientacion_id AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Jornada no disponible' USING ERRCODE='22023'; END IF;
  IF v_jornada.estado <> 'programada' OR v_jornada.cupo IS NULL OR v_jornada.cupo <= 0
     OR (v_jornada.fecha + v_jornada.hora_inicio) <= (now() AT TIME ZONE 'America/Bogota') THEN
    RAISE EXCEPTION 'Jornada no disponible para inscripciones' USING ERRCODE='22023';
  END IF;

  IF p_emprendedor_id IS NULL THEN
    IF NOT v_es_emprendedor THEN RAISE EXCEPTION 'Rol emprendedor requerido' USING ERRCODE='42501'; END IF;
    SELECT e.id INTO v_emprendedor FROM public.emprendedores e
    WHERE e.usuario_id=v_actor AND e.deleted_at IS NULL AND e.estado='activo'
    FOR UPDATE OF e;
    v_origen := 'web';
  ELSE
    IF NOT COALESCE((v_es_admin OR (v_es_orientador AND v_jornada.id_orientador_fk=v_actor)), FALSE) THEN
      RAISE EXCEPTION 'Inscripción manual no autorizada' USING ERRCODE='42501';
    END IF;
    SELECT e.id INTO v_emprendedor FROM public.emprendedores e
    WHERE e.id=p_emprendedor_id AND e.deleted_at IS NULL AND e.estado='activo'
    FOR UPDATE OF e;
    v_origen := 'manual';
  END IF;
  IF v_emprendedor IS NULL THEN RAISE EXCEPTION 'Emprendedor no disponible' USING ERRCODE='22023'; END IF;
  -- SIGRE: inscripción entre centros solo con autorización expresa (Administrador).
  IF NOT v_es_admin AND NOT EXISTS (SELECT 1 FROM public.emprendedores e WHERE e.id = v_emprendedor AND e.id_centro_sena_fk IS NOT NULL AND e.id_centro_sena_fk = v_jornada.id_centro_sena_fk) THEN RAISE EXCEPTION 'Inscripción entre centros SENA no autorizada' USING ERRCODE='42501'; END IF;
  IF EXISTS (SELECT 1 FROM public.orientacion_inscripciones i
             WHERE i.id_orientacion_fk=p_orientacion_id AND i.id_emprendedor_fk=v_emprendedor) THEN
    RAISE EXCEPTION 'Ya existe inscripción para esta jornada' USING ERRCODE='23505';
  END IF;
  SELECT count(*) INTO v_activos FROM public.orientacion_inscripciones i
  WHERE i.id_orientacion_fk=p_orientacion_id AND i.estado='inscrito' AND i.deleted_at IS NULL;
  IF v_activos >= v_jornada.cupo THEN RAISE EXCEPTION 'Cupo agotado' USING ERRCODE='22023'; END IF;

  INSERT INTO public.orientacion_inscripciones(id_orientacion_fk,id_emprendedor_fk,origen)
  VALUES (p_orientacion_id,v_emprendedor,v_origen) RETURNING id INTO v_inscripcion;
  INSERT INTO public.auditorias(id_usuario_fk,tabla_afectada,accion,valor_anterior,valor_nuevo,razon_cambio)
  VALUES (v_actor,'orientacion_inscripciones','INSCRIPCION_CREADA',NULL,
    jsonb_build_object('id',v_inscripcion,'id_orientacion_fk',p_orientacion_id,
      'id_emprendedor_fk',v_emprendedor,'origen',v_origen),
    'Inscripción a jornada');
  RETURN v_inscripcion;
END;
$function$;

-- Permisos de STAGING (en una base nueva CREATE FUNCTION concedería EXECUTE a PUBLIC y anon).
REVOKE ALL ON FUNCTION public.sigre_inscribir_en_jornada(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sigre_inscribir_en_jornada(uuid, uuid) TO authenticated, service_role;

COMMIT;
