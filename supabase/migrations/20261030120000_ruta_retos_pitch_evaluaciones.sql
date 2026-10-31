-- SIGRE · Ruta emprendedora: retos, pitch, evaluadores y evaluaciones.
-- Idempotente. Lecturas por RLS según rol y asignación; escrituras solo por RPC SECURITY DEFINER con auditoría.
-- Conflicto de versión: PT409. Estados de cumplimiento: asignado → entregado → aprobado | requiere_ajustes | no_aprobado.
-- Asignaciones de evaluador activas: estado 'activo' (lo exige public.puede_ver_emprendedor).

-- Visibilidad ------------------------------------------------------------------------------------------
-- Proyecto visible para la ruta: Administrador, Coordinador de su centro, Orientador asignado al emprendedor
-- o el propio emprendedor. El Evaluador solo accede por sus asignaciones de pitch.
CREATE OR REPLACE FUNCTION public.sigre_puede_ver_proyecto_ruta(p_id_proyecto uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.proyectos p JOIN public.emprendedores e ON e.id = p.id_emprendedor_fk
    WHERE p.id = p_id_proyecto AND p.deleted_at IS NULL AND e.deleted_at IS NULL
      AND (public.tiene_rol('administrador')
        OR (public.tiene_rol('coordinador') AND public.coordinador_puede_ver_centro(e.id_centro_sena_fk))
        OR (public.tiene_rol('orientador') AND e.id_orientador_fk = auth.uid())
        OR (public.tiene_rol('emprendedor') AND e.usuario_id = auth.uid())));
$$;

CREATE OR REPLACE FUNCTION public.sigre_orienta_proyecto(p_id_proyecto uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
  SELECT public.tiene_rol('orientador') AND EXISTS (
    SELECT 1 FROM public.proyectos p JOIN public.emprendedores e ON e.id = p.id_emprendedor_fk
    WHERE p.id = p_id_proyecto AND p.deleted_at IS NULL AND e.deleted_at IS NULL AND e.id_orientador_fk = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.sigre_mi_evaluador_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
  SELECT ev.id FROM public.evaluadores ev
  WHERE ev.id_usuario_fk = auth.uid() AND ev.estado = 'activo' AND ev.deleted_at IS NULL AND public.tiene_rol('evaluador');
$$;

CREATE OR REPLACE FUNCTION public.sigre_evalua_pitch(p_id_pitch uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.asignacion_evaluadores ae
                 WHERE ae.id_pitch_fk = p_id_pitch AND ae.deleted_at IS NULL AND ae.estado = 'activo'
                   AND ae.id_evaluador_fk = public.sigre_mi_evaluador_id());
$$;

REVOKE ALL ON FUNCTION public.sigre_puede_ver_proyecto_ruta(uuid), public.sigre_orienta_proyecto(uuid),
  public.sigre_mi_evaluador_id(), public.sigre_evalua_pitch(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sigre_puede_ver_proyecto_ruta(uuid), public.sigre_orienta_proyecto(uuid),
  public.sigre_mi_evaluador_id(), public.sigre_evalua_pitch(uuid) TO authenticated;

-- Políticas de lectura (las de "Admin acceso total" se conservan) -------------------------------------
DROP POLICY IF EXISTS sigre_retos_select ON public.retos;
CREATE POLICY sigre_retos_select ON public.retos FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND public.tiene_permiso('retos', 'ver'));

DROP POLICY IF EXISTS sigre_cumplimiento_retos_select ON public.cumplimiento_retos;
CREATE POLICY sigre_cumplimiento_retos_select ON public.cumplimiento_retos FOR SELECT TO authenticated
  USING (public.sigre_puede_ver_proyecto_ruta(id_proyecto_fk));

DROP POLICY IF EXISTS sigre_sustentacion_retos_select ON public.sustentacion_retos;
CREATE POLICY sigre_sustentacion_retos_select ON public.sustentacion_retos FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.cumplimiento_retos c
                 WHERE c.id = id_cumplimiento_reto_fk AND public.sigre_puede_ver_proyecto_ruta(c.id_proyecto_fk)));

DROP POLICY IF EXISTS sigre_pitch_select ON public.pitch;
CREATE POLICY sigre_pitch_select ON public.pitch FOR SELECT TO authenticated
  USING (public.sigre_puede_ver_proyecto_ruta(id_proyecto_fk) OR public.sigre_evalua_pitch(id));

DROP POLICY IF EXISTS sigre_preparaciones_pitch_select ON public.preparaciones_pitch;
CREATE POLICY sigre_preparaciones_pitch_select ON public.preparaciones_pitch FOR SELECT TO authenticated
  USING (public.sigre_puede_ver_proyecto_ruta(id_proyecto_fk));

DROP POLICY IF EXISTS sigre_asignacion_evaluadores_select ON public.asignacion_evaluadores;
CREATE POLICY sigre_asignacion_evaluadores_select ON public.asignacion_evaluadores FOR SELECT TO authenticated
  USING (id_evaluador_fk = public.sigre_mi_evaluador_id()
      OR EXISTS (SELECT 1 FROM public.pitch pi WHERE pi.id = id_pitch_fk AND public.sigre_puede_ver_proyecto_ruta(pi.id_proyecto_fk)));

DROP POLICY IF EXISTS sigre_evaluadores_select ON public.evaluadores;
CREATE POLICY sigre_evaluadores_select ON public.evaluadores FOR SELECT TO authenticated
  USING (public.tiene_rol('coordinador') OR id_usuario_fk = auth.uid()
      OR EXISTS (SELECT 1 FROM public.asignacion_evaluadores ae JOIN public.pitch pi ON pi.id = ae.id_pitch_fk
                 WHERE ae.id_evaluador_fk = evaluadores.id AND ae.deleted_at IS NULL
                   AND public.sigre_puede_ver_proyecto_ruta(pi.id_proyecto_fk)));

-- Calificaciones: cada Evaluador solo la suya; Administrador y Coordinador supervisan; Orientador y
-- Emprendedor las consultan cuando el pitch está cerrado.
DROP POLICY IF EXISTS sigre_calificaciones_pitch_select ON public.calificaciones_pitch;
CREATE POLICY sigre_calificaciones_pitch_select ON public.calificaciones_pitch FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.asignacion_evaluadores ae JOIN public.pitch pi ON pi.id = ae.id_pitch_fk
                 WHERE ae.id = id_asignacion_evaluador_fk
                   AND (ae.id_evaluador_fk = public.sigre_mi_evaluador_id()
                     OR (public.tiene_rol('coordinador') AND public.sigre_puede_ver_proyecto_ruta(pi.id_proyecto_fk))
                     OR (pi.estado = 'cerrado' AND public.sigre_puede_ver_proyecto_ruta(pi.id_proyecto_fk)))));

-- Auxiliares --------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sigre_auditar(p_tabla text, p_accion text, p_anterior jsonb, p_nuevo jsonb, p_razon text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path TO '' AS $$
  INSERT INTO public.auditorias (id_usuario_fk, tabla_afectada, accion, valor_anterior, valor_nuevo, razon_cambio)
  VALUES (auth.uid(), p_tabla, p_accion, p_anterior, p_nuevo, p_razon);
$$;
REVOKE ALL ON FUNCTION public.sigre_auditar(text, text, jsonb, jsonb, text) FROM PUBLIC, anon, authenticated;

-- RETOS -------------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sigre_admin_guardar_reto(
  p_id_reto uuid, p_updated_at_esperado timestamptz, p_titulo text, p_descripcion text, p_orden integer, p_estado text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
DECLARE v_old public.retos%ROWTYPE; v_id uuid;
BEGIN
  IF NOT public.tiene_rol('administrador') THEN RAISE EXCEPTION 'Gestión de retos no autorizada' USING ERRCODE = '42501'; END IF;
  IF nullif(btrim(p_titulo), '') IS NULL OR p_orden IS NULL OR p_orden < 1 OR p_orden > 32767
     OR p_estado NOT IN ('programado', 'en_curso', 'finalizado', 'cancelado') THEN
    RAISE EXCEPTION 'Datos del reto no válidos' USING ERRCODE = '22023';
  END IF;
  IF p_id_reto IS NULL THEN
    INSERT INTO public.retos (titulo, descripcion, orden, estado)
    VALUES (btrim(p_titulo), nullif(btrim(p_descripcion), ''), p_orden, p_estado) RETURNING id INTO v_id;
    PERFORM public.sigre_auditar('retos', 'RETO_CREADO', NULL, jsonb_build_object('id', v_id, 'titulo', btrim(p_titulo), 'orden', p_orden, 'estado', p_estado), 'Creación de reto');
    RETURN v_id;
  END IF;
  SELECT * INTO v_old FROM public.retos WHERE id = p_id_reto AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Reto no encontrado' USING ERRCODE = 'P0002'; END IF;
  IF v_old.updated_at IS DISTINCT FROM p_updated_at_esperado THEN RAISE EXCEPTION 'El reto cambió' USING ERRCODE = 'PT409'; END IF;
  UPDATE public.retos SET titulo = btrim(p_titulo), descripcion = nullif(btrim(p_descripcion), ''), orden = p_orden, estado = p_estado, updated_at = now()
  WHERE id = p_id_reto;
  PERFORM public.sigre_auditar('retos', 'RETO_EDITADO', to_jsonb(v_old),
    jsonb_build_object('id', p_id_reto, 'titulo', btrim(p_titulo), 'orden', p_orden, 'estado', p_estado), 'Edición de reto');
  RETURN p_id_reto;
END;
$$;

CREATE OR REPLACE FUNCTION public.sigre_admin_cambiar_estado_reto(p_id_reto uuid, p_estado text, p_updated_at_esperado timestamptz)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
DECLARE v_old public.retos%ROWTYPE;
BEGIN
  IF NOT public.tiene_rol('administrador') THEN RAISE EXCEPTION 'Gestión de retos no autorizada' USING ERRCODE = '42501'; END IF;
  IF p_estado NOT IN ('programado', 'en_curso', 'finalizado', 'cancelado') THEN RAISE EXCEPTION 'Estado no válido' USING ERRCODE = '22023'; END IF;
  SELECT * INTO v_old FROM public.retos WHERE id = p_id_reto AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Reto no encontrado' USING ERRCODE = 'P0002'; END IF;
  IF v_old.updated_at IS DISTINCT FROM p_updated_at_esperado THEN RAISE EXCEPTION 'El reto cambió' USING ERRCODE = 'PT409'; END IF;
  UPDATE public.retos SET estado = p_estado, updated_at = now() WHERE id = p_id_reto;
  PERFORM public.sigre_auditar('retos', 'RETO_ESTADO', jsonb_build_object('estado', v_old.estado), jsonb_build_object('id', p_id_reto, 'estado', p_estado), 'Cambio de estado de reto');
  RETURN p_id_reto;
END;
$$;

-- Asigna un reto a un proyecto. Los retos son secuenciales: el de orden N exige el de orden N-1 aprobado.
CREATE OR REPLACE FUNCTION public.sigre_admin_asignar_reto_proyecto(p_id_reto uuid, p_id_proyecto uuid, p_fecha_entrega date)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
DECLARE v_reto public.retos%ROWTYPE; v_id uuid;
BEGIN
  IF NOT (public.tiene_rol('administrador') OR public.sigre_orienta_proyecto(p_id_proyecto)) THEN
    RAISE EXCEPTION 'Asignación de retos no autorizada' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_reto FROM public.retos WHERE id = p_id_reto AND deleted_at IS NULL;
  IF NOT FOUND OR NOT EXISTS (SELECT 1 FROM public.proyectos WHERE id = p_id_proyecto AND deleted_at IS NULL) THEN
    RAISE EXCEPTION 'Reto o proyecto no encontrado' USING ERRCODE = 'P0002';
  END IF;
  IF v_reto.estado IN ('finalizado', 'cancelado') THEN RAISE EXCEPTION 'El reto no admite asignaciones' USING ERRCODE = '22023'; END IF;
  IF EXISTS (SELECT 1 FROM public.cumplimiento_retos WHERE id_reto_fk = p_id_reto AND id_proyecto_fk = p_id_proyecto) THEN
    RAISE EXCEPTION 'El reto ya está asignado al proyecto' USING ERRCODE = '23505';
  END IF;
  IF EXISTS (SELECT 1 FROM public.retos r WHERE r.deleted_at IS NULL AND r.estado <> 'cancelado' AND r.orden < v_reto.orden
               AND NOT EXISTS (SELECT 1 FROM public.cumplimiento_retos c
                               WHERE c.id_reto_fk = r.id AND c.id_proyecto_fk = p_id_proyecto AND c.estado_cumplimiento = 'aprobado')) THEN
    RAISE EXCEPTION 'El proyecto debe aprobar los retos anteriores' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.cumplimiento_retos (id_reto_fk, id_proyecto_fk, fecha_entrega, estado_cumplimiento)
  VALUES (p_id_reto, p_id_proyecto, p_fecha_entrega, 'asignado') RETURNING id INTO v_id;
  PERFORM public.sigre_auditar('cumplimiento_retos', 'RETO_ASIGNADO', NULL,
    jsonb_build_object('id', v_id, 'id_reto_fk', p_id_reto, 'id_proyecto_fk', p_id_proyecto, 'fecha_entrega', p_fecha_entrega), 'Asignación de reto a proyecto');
  RETURN v_id;
END;
$$;

-- El emprendedor (o su orientador) registra el desarrollo o el ajuste del reto.
CREATE OR REPLACE FUNCTION public.sigre_registrar_avance_reto(p_id_cumplimiento uuid, p_archivo_evidencia text, p_observacion text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
DECLARE v_old public.cumplimiento_retos%ROWTYPE;
BEGIN
  SELECT * INTO v_old FROM public.cumplimiento_retos WHERE id = p_id_cumplimiento FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Cumplimiento no encontrado' USING ERRCODE = 'P0002'; END IF;
  IF NOT (public.tiene_rol('administrador') OR public.sigre_orienta_proyecto(v_old.id_proyecto_fk)
          OR (public.tiene_rol('emprendedor') AND EXISTS (
                SELECT 1 FROM public.proyectos p JOIN public.emprendedores e ON e.id = p.id_emprendedor_fk
                WHERE p.id = v_old.id_proyecto_fk AND p.deleted_at IS NULL AND e.usuario_id = auth.uid()))) THEN
    RAISE EXCEPTION 'Registro de avance no autorizado' USING ERRCODE = '42501';
  END IF;
  IF coalesce(v_old.estado_cumplimiento, 'asignado') NOT IN ('asignado', 'requiere_ajustes') THEN
    RAISE EXCEPTION 'El reto no admite nuevos avances en su estado actual' USING ERRCODE = '22023';
  END IF;
  IF nullif(btrim(p_archivo_evidencia), '') IS NULL AND nullif(btrim(p_observacion), '') IS NULL THEN
    RAISE EXCEPTION 'Registra la evidencia o una descripción del avance' USING ERRCODE = '22023';
  END IF;
  UPDATE public.cumplimiento_retos SET estado_cumplimiento = 'entregado',
    archivo_evidencia = coalesce(nullif(btrim(p_archivo_evidencia), ''), archivo_evidencia),
    observacion = coalesce(nullif(btrim(p_observacion), ''), observacion), updated_at = now()
  WHERE id = p_id_cumplimiento;
  PERFORM public.sigre_auditar('cumplimiento_retos', 'RETO_AVANCE', jsonb_build_object('estado', v_old.estado_cumplimiento, 'evidencia', v_old.archivo_evidencia),
    jsonb_build_object('id', p_id_cumplimiento, 'estado', 'entregado', 'evidencia', nullif(btrim(p_archivo_evidencia), '')), 'Registro de desarrollo del reto');
  RETURN p_id_cumplimiento;
END;
$$;

-- El Orientador revisa la sustentación: aprueba, solicita ajustes o no aprueba.
CREATE OR REPLACE FUNCTION public.sigre_revisar_reto(p_id_cumplimiento uuid, p_resultado text, p_observacion text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
DECLARE v_old public.cumplimiento_retos%ROWTYPE; v_orientador uuid; v_id uuid;
BEGIN
  SELECT * INTO v_old FROM public.cumplimiento_retos WHERE id = p_id_cumplimiento FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Cumplimiento no encontrado' USING ERRCODE = 'P0002'; END IF;
  IF NOT (public.tiene_rol('administrador') OR public.sigre_orienta_proyecto(v_old.id_proyecto_fk)) THEN
    RAISE EXCEPTION 'Revisión de reto no autorizada' USING ERRCODE = '42501';
  END IF;
  IF p_resultado NOT IN ('aprobado', 'requiere_ajustes', 'no_aprobado') THEN RAISE EXCEPTION 'Resultado no válido' USING ERRCODE = '22023'; END IF;
  IF v_old.estado_cumplimiento IS DISTINCT FROM 'entregado' THEN
    RAISE EXCEPTION 'Solo se revisan retos entregados' USING ERRCODE = '22023';
  END IF;
  IF p_resultado <> 'aprobado' AND nullif(btrim(p_observacion), '') IS NULL THEN
    RAISE EXCEPTION 'Indica las observaciones de la revisión' USING ERRCODE = '22023';
  END IF;
  SELECT e.id_orientador_fk INTO v_orientador FROM public.proyectos p JOIN public.emprendedores e ON e.id = p.id_emprendedor_fk WHERE p.id = v_old.id_proyecto_fk;
  INSERT INTO public.sustentacion_retos (id_cumplimiento_reto_fk, id_orientador_fk, id_evaluado_por_fk, fecha_sustentacion, resultado, observacion)
  VALUES (p_id_cumplimiento, v_orientador, auth.uid(), now(), p_resultado, nullif(btrim(p_observacion), '')) RETURNING id INTO v_id;
  UPDATE public.cumplimiento_retos SET estado_cumplimiento = p_resultado, updated_at = now() WHERE id = p_id_cumplimiento;
  PERFORM public.sigre_auditar('sustentacion_retos', 'RETO_REVISADO', jsonb_build_object('estado', v_old.estado_cumplimiento),
    jsonb_build_object('id', v_id, 'id_cumplimiento', p_id_cumplimiento, 'resultado', p_resultado, 'observacion', nullif(btrim(p_observacion), '')), 'Sustentación y validación del reto');
  RETURN v_id;
END;
$$;

-- EVALUADORES -------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sigre_puede_gestionar_evaluadores()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
  SELECT public.tiene_rol('administrador') OR (public.tiene_rol('coordinador') AND coalesce(public.tiene_permiso('evaluadores', 'editar'), false));
$$;
REVOKE ALL ON FUNCTION public.sigre_puede_gestionar_evaluadores() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sigre_puede_gestionar_evaluadores() TO authenticated;

CREATE OR REPLACE FUNCTION public.sigre_admin_guardar_evaluador(
  p_id_evaluador uuid, p_id_usuario uuid, p_updated_at_esperado timestamptz, p_especialidad text, p_entidad text, p_experiencia text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
DECLARE v_old public.evaluadores%ROWTYPE; v_id uuid;
BEGIN
  IF NOT public.sigre_puede_gestionar_evaluadores() THEN RAISE EXCEPTION 'Gestión de evaluadores no autorizada' USING ERRCODE = '42501'; END IF;
  IF p_id_evaluador IS NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.usuarios u JOIN public.usuario_roles ur ON ur.id_usuario_fk = u.id JOIN public.roles r ON r.id = ur.id_rol_fk
                   WHERE u.id = p_id_usuario AND u.estado = 'activo' AND u.deleted_at IS NULL AND lower(r.nombre_rol) = 'evaluador'
                     AND ur.estado = 'activo' AND ur.deleted_at IS NULL) THEN
      RAISE EXCEPTION 'El usuario debe estar activo y tener el rol Evaluador' USING ERRCODE = '22023';
    END IF;
    IF EXISTS (SELECT 1 FROM public.evaluadores WHERE id_usuario_fk = p_id_usuario) THEN
      RAISE EXCEPTION 'El usuario ya es evaluador' USING ERRCODE = '23505';
    END IF;
    INSERT INTO public.evaluadores (id_usuario_fk, especialidad, entidad, experiencia, estado)
    VALUES (p_id_usuario, nullif(btrim(p_especialidad), ''), nullif(btrim(p_entidad), ''), nullif(btrim(p_experiencia), ''), 'activo')
    RETURNING id INTO v_id;
    PERFORM public.sigre_auditar('evaluadores', 'EVALUADOR_CREADO', NULL, jsonb_build_object('id', v_id, 'id_usuario_fk', p_id_usuario), 'Registro de evaluador');
    RETURN v_id;
  END IF;
  SELECT * INTO v_old FROM public.evaluadores WHERE id = p_id_evaluador AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Evaluador no encontrado' USING ERRCODE = 'P0002'; END IF;
  IF v_old.updated_at IS DISTINCT FROM p_updated_at_esperado THEN RAISE EXCEPTION 'El evaluador cambió' USING ERRCODE = 'PT409'; END IF;
  UPDATE public.evaluadores SET especialidad = nullif(btrim(p_especialidad), ''), entidad = nullif(btrim(p_entidad), ''),
    experiencia = nullif(btrim(p_experiencia), ''), updated_at = now() WHERE id = p_id_evaluador;
  PERFORM public.sigre_auditar('evaluadores', 'EVALUADOR_EDITADO', to_jsonb(v_old),
    jsonb_build_object('id', p_id_evaluador, 'especialidad', p_especialidad, 'entidad', p_entidad, 'experiencia', p_experiencia), 'Edición de evaluador');
  RETURN p_id_evaluador;
END;
$$;

CREATE OR REPLACE FUNCTION public.sigre_admin_cambiar_estado_evaluador(p_id_evaluador uuid, p_estado text, p_updated_at_esperado timestamptz)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
DECLARE v_old public.evaluadores%ROWTYPE;
BEGIN
  IF NOT public.sigre_puede_gestionar_evaluadores() THEN RAISE EXCEPTION 'Gestión de evaluadores no autorizada' USING ERRCODE = '42501'; END IF;
  IF p_estado NOT IN ('activo', 'inactivo') THEN RAISE EXCEPTION 'Estado no válido' USING ERRCODE = '22023'; END IF;
  SELECT * INTO v_old FROM public.evaluadores WHERE id = p_id_evaluador AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Evaluador no encontrado' USING ERRCODE = 'P0002'; END IF;
  IF v_old.updated_at IS DISTINCT FROM p_updated_at_esperado THEN RAISE EXCEPTION 'El evaluador cambió' USING ERRCODE = 'PT409'; END IF;
  IF p_estado = 'inactivo' AND EXISTS (SELECT 1 FROM public.asignacion_evaluadores ae JOIN public.pitch pi ON pi.id = ae.id_pitch_fk
       WHERE ae.id_evaluador_fk = p_id_evaluador AND ae.deleted_at IS NULL AND pi.estado NOT IN ('cerrado', 'cancelado')) THEN
    RAISE EXCEPTION 'Retira primero al evaluador de los pitch abiertos' USING ERRCODE = '22023';
  END IF;
  UPDATE public.evaluadores SET estado = p_estado, updated_at = now() WHERE id = p_id_evaluador;
  PERFORM public.sigre_auditar('evaluadores', 'EVALUADOR_ESTADO', jsonb_build_object('estado', v_old.estado), jsonb_build_object('id', p_id_evaluador, 'estado', p_estado), 'Cambio de estado de evaluador');
  RETURN p_id_evaluador;
END;
$$;

-- PITCH ---------------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sigre_pitch_validar_estado(p_id_pitch uuid, p_actual text, p_nuevo text)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO '' AS $$
DECLARE v_activos integer; v_pendientes integer; v_aprob integer;
BEGIN
  IF p_nuevo NOT IN ('programado', 'confirmado', 'en_evaluacion', 'cerrado', 'cancelado') THEN
    RAISE EXCEPTION 'Estado de pitch no válido' USING ERRCODE = '22023';
  END IF;
  IF p_actual IN ('cerrado', 'cancelado') AND p_nuevo IS DISTINCT FROM p_actual THEN
    RAISE EXCEPTION 'El pitch ya está %', p_actual USING ERRCODE = '22023';
  END IF;
  SELECT count(*) INTO v_activos FROM public.asignacion_evaluadores WHERE id_pitch_fk = p_id_pitch AND deleted_at IS NULL AND estado = 'activo';
  IF p_nuevo IN ('confirmado', 'en_evaluacion') AND v_activos NOT BETWEEN 2 AND 3 THEN
    RAISE EXCEPTION 'El pitch necesita entre 2 y 3 evaluadores asignados' USING ERRCODE = '22023';
  END IF;
  IF p_nuevo = 'cerrado' THEN
    IF p_actual IS DISTINCT FROM 'en_evaluacion' THEN RAISE EXCEPTION 'Solo se cierra un pitch en evaluación' USING ERRCODE = '22023'; END IF;
    SELECT count(*) FILTER (WHERE c.id IS NULL OR c.estado <> 'registrada'), count(*) FILTER (WHERE c.resultado = 'aprobado')
    INTO v_pendientes, v_aprob
    FROM public.asignacion_evaluadores ae LEFT JOIN public.calificaciones_pitch c ON c.id_asignacion_evaluador_fk = ae.id
    WHERE ae.id_pitch_fk = p_id_pitch AND ae.deleted_at IS NULL AND ae.estado = 'activo';
    IF v_pendientes > 0 THEN RAISE EXCEPTION 'Faltan calificaciones de evaluadores' USING ERRCODE = '22023'; END IF;
    RETURN format('%s de %s evaluadores aprobaron', v_aprob, v_activos);
  END IF;
  RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.sigre_pitch_validar_estado(uuid, text, text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.sigre_admin_guardar_pitch(
  p_id_pitch uuid, p_updated_at_esperado timestamptz, p_id_proyecto uuid, p_fecha_hora timestamptz,
  p_modalidad text, p_lugar_link text, p_estado text, p_observacion text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
DECLARE v_old public.pitch%ROWTYPE; v_id uuid; v_resultado text;
BEGIN
  IF NOT public.tiene_rol('administrador') THEN RAISE EXCEPTION 'Gestión de pitch no autorizada' USING ERRCODE = '42501'; END IF;
  IF p_fecha_hora IS NULL OR p_modalidad NOT IN ('presencial', 'virtual') THEN RAISE EXCEPTION 'Datos del pitch no válidos' USING ERRCODE = '22023'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.proyectos WHERE id = p_id_proyecto AND deleted_at IS NULL) THEN
    RAISE EXCEPTION 'Proyecto no encontrado' USING ERRCODE = 'P0002';
  END IF;
  IF p_id_pitch IS NULL THEN
    INSERT INTO public.pitch (id_proyecto_fk, fecha_hora, modalidad, lugar_link, estado, observacion)
    VALUES (p_id_proyecto, p_fecha_hora, p_modalidad, nullif(btrim(p_lugar_link), ''), 'programado', nullif(btrim(p_observacion), ''))
    RETURNING id INTO v_id;
    PERFORM public.sigre_auditar('pitch', 'PITCH_CREADO', NULL, jsonb_build_object('id', v_id, 'id_proyecto_fk', p_id_proyecto, 'fecha_hora', p_fecha_hora, 'modalidad', p_modalidad), 'Programación de pitch');
    RETURN v_id;
  END IF;
  SELECT * INTO v_old FROM public.pitch WHERE id = p_id_pitch FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pitch no encontrado' USING ERRCODE = 'P0002'; END IF;
  IF v_old.updated_at IS DISTINCT FROM p_updated_at_esperado THEN RAISE EXCEPTION 'El pitch cambió' USING ERRCODE = 'PT409'; END IF;
  IF v_old.estado IN ('cerrado', 'cancelado') THEN RAISE EXCEPTION 'El pitch ya está %', v_old.estado USING ERRCODE = '22023'; END IF;
  v_resultado := public.sigre_pitch_validar_estado(p_id_pitch, v_old.estado, coalesce(p_estado, v_old.estado));
  UPDATE public.pitch SET id_proyecto_fk = p_id_proyecto, fecha_hora = p_fecha_hora, modalidad = p_modalidad,
    lugar_link = nullif(btrim(p_lugar_link), ''), estado = coalesce(p_estado, v_old.estado), observacion = nullif(btrim(p_observacion), ''),
    resultado_general = coalesce(v_resultado, resultado_general), updated_at = now()
  WHERE id = p_id_pitch;
  PERFORM public.sigre_auditar('pitch', 'PITCH_EDITADO', to_jsonb(v_old),
    jsonb_build_object('id', p_id_pitch, 'fecha_hora', p_fecha_hora, 'modalidad', p_modalidad, 'estado', coalesce(p_estado, v_old.estado)), 'Edición de pitch');
  RETURN p_id_pitch;
END;
$$;

CREATE OR REPLACE FUNCTION public.sigre_admin_cambiar_estado_pitch(p_id_pitch uuid, p_estado text, p_updated_at_esperado timestamptz)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
DECLARE v_old public.pitch%ROWTYPE; v_resultado text;
BEGIN
  IF NOT public.tiene_rol('administrador') THEN RAISE EXCEPTION 'Gestión de pitch no autorizada' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_old FROM public.pitch WHERE id = p_id_pitch FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pitch no encontrado' USING ERRCODE = 'P0002'; END IF;
  IF v_old.updated_at IS DISTINCT FROM p_updated_at_esperado THEN RAISE EXCEPTION 'El pitch cambió' USING ERRCODE = 'PT409'; END IF;
  v_resultado := public.sigre_pitch_validar_estado(p_id_pitch, v_old.estado, p_estado);
  UPDATE public.pitch SET estado = p_estado, resultado_general = coalesce(v_resultado, resultado_general), updated_at = now() WHERE id = p_id_pitch;
  PERFORM public.sigre_auditar('pitch', 'PITCH_ESTADO', jsonb_build_object('estado', v_old.estado),
    jsonb_build_object('id', p_id_pitch, 'estado', p_estado, 'resultado_general', v_resultado), 'Cambio de estado de pitch');
  RETURN p_id_pitch;
END;
$$;

-- Asignación progresiva: hasta 3 evaluadores; el mínimo de 2 se exige al confirmar.
CREATE OR REPLACE FUNCTION public.sigre_admin_asignar_evaluador_pitch(p_id_pitch uuid, p_id_evaluador uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
DECLARE v_pitch public.pitch%ROWTYPE; v_ev public.evaluadores%ROWTYPE; v_prev public.asignacion_evaluadores%ROWTYPE; v_id uuid;
BEGIN
  IF NOT public.sigre_puede_gestionar_evaluadores() THEN RAISE EXCEPTION 'Asignación de evaluadores no autorizada' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_pitch FROM public.pitch WHERE id = p_id_pitch FOR UPDATE;
  SELECT * INTO v_ev FROM public.evaluadores WHERE id = p_id_evaluador AND deleted_at IS NULL;
  IF v_pitch.id IS NULL OR v_ev.id IS NULL THEN RAISE EXCEPTION 'Pitch o evaluador no encontrado' USING ERRCODE = 'P0002'; END IF;
  IF NOT public.tiene_rol('administrador') AND NOT public.sigre_puede_ver_proyecto_ruta(v_pitch.id_proyecto_fk) THEN
    RAISE EXCEPTION 'Asignación de evaluadores no autorizada' USING ERRCODE = '42501';
  END IF;
  IF v_pitch.estado IN ('cerrado', 'cancelado', 'en_evaluacion') THEN RAISE EXCEPTION 'El pitch no admite cambios de evaluadores' USING ERRCODE = '22023'; END IF;
  IF v_ev.estado <> 'activo' THEN RAISE EXCEPTION 'El evaluador no está activo' USING ERRCODE = '22023'; END IF;
  IF EXISTS (SELECT 1 FROM public.proyectos p JOIN public.emprendedores e ON e.id = p.id_emprendedor_fk
             WHERE p.id = v_pitch.id_proyecto_fk AND v_ev.id_usuario_fk IN (e.usuario_id, e.id_orientador_fk)) THEN
    RAISE EXCEPTION 'El evaluador no puede evaluar un proyecto propio o que orienta' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_prev FROM public.asignacion_evaluadores WHERE id_pitch_fk = p_id_pitch AND id_evaluador_fk = p_id_evaluador;
  IF v_prev.id IS NOT NULL AND v_prev.deleted_at IS NULL THEN RAISE EXCEPTION 'El evaluador ya está asignado' USING ERRCODE = '23505'; END IF;
  IF (SELECT count(*) FROM public.asignacion_evaluadores WHERE id_pitch_fk = p_id_pitch AND deleted_at IS NULL AND estado = 'activo') >= 3 THEN
    RAISE EXCEPTION 'El pitch ya tiene el máximo de 3 evaluadores' USING ERRCODE = '22023';
  END IF;
  IF v_prev.id IS NOT NULL THEN
    UPDATE public.asignacion_evaluadores SET deleted_at = NULL, estado = 'activo', fecha_asignacion = now(), updated_at = now()
    WHERE id = v_prev.id RETURNING id INTO v_id;
  ELSE
    INSERT INTO public.asignacion_evaluadores (id_pitch_fk, id_evaluador_fk, estado) VALUES (p_id_pitch, p_id_evaluador, 'activo') RETURNING id INTO v_id;
  END IF;
  PERFORM public.sigre_auditar('asignacion_evaluadores', 'EVALUADOR_ASIGNADO', NULL,
    jsonb_build_object('id', v_id, 'id_pitch_fk', p_id_pitch, 'id_evaluador_fk', p_id_evaluador), 'Asignación de evaluador a pitch');
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.sigre_admin_retirar_evaluador_pitch(p_id_asignacion uuid, p_updated_at_esperado timestamptz)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
DECLARE v_old public.asignacion_evaluadores%ROWTYPE; v_pitch public.pitch%ROWTYPE;
BEGIN
  IF NOT public.sigre_puede_gestionar_evaluadores() THEN RAISE EXCEPTION 'Retiro de evaluadores no autorizado' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_old FROM public.asignacion_evaluadores WHERE id = p_id_asignacion AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Asignación no encontrada' USING ERRCODE = 'P0002'; END IF;
  SELECT * INTO v_pitch FROM public.pitch WHERE id = v_old.id_pitch_fk FOR UPDATE;
  IF NOT public.tiene_rol('administrador') AND NOT public.sigre_puede_ver_proyecto_ruta(v_pitch.id_proyecto_fk) THEN
    RAISE EXCEPTION 'Retiro de evaluadores no autorizado' USING ERRCODE = '42501';
  END IF;
  IF v_old.updated_at IS DISTINCT FROM p_updated_at_esperado THEN RAISE EXCEPTION 'La asignación cambió' USING ERRCODE = 'PT409'; END IF;
  IF EXISTS (SELECT 1 FROM public.calificaciones_pitch WHERE id_asignacion_evaluador_fk = p_id_asignacion) THEN
    RAISE EXCEPTION 'El evaluador ya registró su calificación' USING ERRCODE = '22023';
  END IF;
  IF v_pitch.estado IN ('cerrado', 'cancelado', 'en_evaluacion')
     OR (v_pitch.estado = 'confirmado' AND (SELECT count(*) FROM public.asignacion_evaluadores
                                             WHERE id_pitch_fk = v_pitch.id AND deleted_at IS NULL AND estado = 'activo') <= 2) THEN
    RAISE EXCEPTION 'El pitch quedaría sin el mínimo de evaluadores o ya no admite cambios' USING ERRCODE = '22023';
  END IF;
  UPDATE public.asignacion_evaluadores SET deleted_at = now(), estado = 'retirado', updated_at = now() WHERE id = p_id_asignacion;
  PERFORM public.sigre_auditar('asignacion_evaluadores', 'EVALUADOR_RETIRADO', to_jsonb(v_old),
    jsonb_build_object('id', p_id_asignacion, 'estado', 'retirado'), 'Retiro de evaluador de pitch');
  RETURN p_id_asignacion;
END;
$$;

-- EVALUACIONES --------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sigre_evaluador_registrar_calificacion(
  p_id_asignacion uuid, p_puntaje numeric, p_resultado text, p_observacion text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
DECLARE v_asig public.asignacion_evaluadores%ROWTYPE; v_estado_pitch text; v_old public.calificaciones_pitch%ROWTYPE; v_id uuid;
BEGIN
  SELECT * INTO v_asig FROM public.asignacion_evaluadores WHERE id = p_id_asignacion AND deleted_at IS NULL AND estado = 'activo';
  IF NOT FOUND OR v_asig.id_evaluador_fk IS DISTINCT FROM public.sigre_mi_evaluador_id() THEN
    RAISE EXCEPTION 'Calificación no autorizada' USING ERRCODE = '42501';
  END IF;
  SELECT estado INTO v_estado_pitch FROM public.pitch WHERE id = v_asig.id_pitch_fk FOR UPDATE;
  IF v_estado_pitch IS DISTINCT FROM 'en_evaluacion' THEN RAISE EXCEPTION 'El pitch no está en evaluación' USING ERRCODE = '22023'; END IF;
  IF p_puntaje IS NULL OR p_puntaje < 0 OR p_puntaje > 100 OR p_resultado NOT IN ('aprobado', 'no_aprobado') THEN
    RAISE EXCEPTION 'Calificación no válida' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_old FROM public.calificaciones_pitch WHERE id_asignacion_evaluador_fk = p_id_asignacion FOR UPDATE;
  IF v_old.id IS NULL THEN
    INSERT INTO public.calificaciones_pitch (id_asignacion_evaluador_fk, puntaje, resultado, observacion, estado)
    VALUES (p_id_asignacion, round(p_puntaje, 2), p_resultado, nullif(btrim(p_observacion), ''), 'registrada') RETURNING id INTO v_id;
  ELSE
    UPDATE public.calificaciones_pitch SET puntaje = round(p_puntaje, 2), resultado = p_resultado, observacion = nullif(btrim(p_observacion), ''),
      estado = 'registrada', updated_at = now() WHERE id = v_old.id RETURNING id INTO v_id;
  END IF;
  PERFORM public.sigre_auditar('calificaciones_pitch', CASE WHEN v_old.id IS NULL THEN 'CALIFICACION_REGISTRADA' ELSE 'CALIFICACION_EDITADA' END,
    CASE WHEN v_old.id IS NULL THEN NULL ELSE jsonb_build_object('puntaje', v_old.puntaje, 'resultado', v_old.resultado) END,
    jsonb_build_object('id', v_id, 'id_asignacion', p_id_asignacion, 'puntaje', round(p_puntaje, 2), 'resultado', p_resultado), 'Calificación de pitch');
  RETURN v_id;
END;
$$;

DO $$
DECLARE f text;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'sigre_admin_guardar_reto(uuid,timestamptz,text,text,integer,text)', 'sigre_admin_cambiar_estado_reto(uuid,text,timestamptz)',
    'sigre_admin_asignar_reto_proyecto(uuid,uuid,date)', 'sigre_registrar_avance_reto(uuid,text,text)', 'sigre_revisar_reto(uuid,text,text)',
    'sigre_admin_guardar_evaluador(uuid,uuid,timestamptz,text,text,text)', 'sigre_admin_cambiar_estado_evaluador(uuid,text,timestamptz)',
    'sigre_admin_guardar_pitch(uuid,timestamptz,uuid,timestamptz,text,text,text,text)', 'sigre_admin_cambiar_estado_pitch(uuid,text,timestamptz)',
    'sigre_admin_asignar_evaluador_pitch(uuid,uuid)', 'sigre_admin_retirar_evaluador_pitch(uuid,timestamptz)',
    'sigre_evaluador_registrar_calificacion(uuid,numeric,text,text)'] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated', f);
  END LOOP;
END $$;
