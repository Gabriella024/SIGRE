-- SIGRE · PROPUESTA · Miniperfil del proyecto para el Evaluador asignado.
-- Destino: STAGING. Requiere autorización expresa.
-- Problema: el Evaluador ve su asignación y el pitch, pero proyectos/emprendedores no son visibles por RLS,
-- por lo que la pantalla Evaluación muestra el pitch sin proyecto ni emprendedor.
-- Solución: lectura (solo SELECT) del proyecto y su emprendedor mientras el Evaluador tenga una asignación
-- activa en un pitch de ese proyecto. No cambia escrituras ni otras políticas.

BEGIN;

DROP TABLE IF EXISTS _miniperfil_informe;
CREATE TEMP TABLE _miniperfil_informe (informe text);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = 'bbd440b7-717e-416c-a2e7-0a33ee1d1320') THEN
    RAISE EXCEPTION 'ABORTADO: este proyecto no es STAGING';
  END IF;
  IF to_regprocedure('public.sigre_evalua_proyecto(uuid)') IS NOT NULL
     OR to_regprocedure('public.sigre_evalua_emprendedor(uuid)') IS NOT NULL
     OR EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public'
                AND policyname IN ('sigre_proyectos_select_evaluador', 'sigre_emprendedores_select_evaluador')) THEN
    RAISE EXCEPTION 'ABORTADO: la propuesta ya fue aplicada (no se reaplica)';
  END IF;
END $$;


CREATE OR REPLACE FUNCTION public.sigre_evalua_proyecto(p_id_proyecto uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.pitch pi
                 WHERE pi.id_proyecto_fk = p_id_proyecto AND public.sigre_evalua_pitch(pi.id));
$$;
-- SECURITY DEFINER evita recursión de RLS entre proyectos y emprendedores.
CREATE OR REPLACE FUNCTION public.sigre_evalua_emprendedor(p_id_emprendedor uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.proyectos p
                 WHERE p.id_emprendedor_fk = p_id_emprendedor AND p.deleted_at IS NULL
                   AND public.sigre_evalua_proyecto(p.id));
$$;
REVOKE ALL ON FUNCTION public.sigre_evalua_proyecto(uuid), public.sigre_evalua_emprendedor(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sigre_evalua_proyecto(uuid), public.sigre_evalua_emprendedor(uuid) TO authenticated;

DROP POLICY IF EXISTS sigre_proyectos_select_evaluador ON public.proyectos;
CREATE POLICY sigre_proyectos_select_evaluador ON public.proyectos FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND public.sigre_evalua_proyecto(id));

DROP POLICY IF EXISTS sigre_emprendedores_select_evaluador ON public.emprendedores;
CREATE POLICY sigre_emprendedores_select_evaluador ON public.emprendedores FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND public.sigre_evalua_emprendedor(id));

-- Verificación en la misma transacción: cualquier fallo revierte todo.
DO $$
DECLARE
  v_eval1 constant uuid := '214327e6-3d2f-44e7-b214-6eb3e7587148';
  v_laura constant uuid := 'bbd440b7-717e-416c-a2e7-0a33ee1d1320';
  v_proyecto constant uuid := '4c6285a5-faee-4490-8a48-08db46307b40';
  v_proy uuid[]; v_emp uuid[]; v_emp_esperado uuid[]; v_laura_extra int; v_cmds text[];
BEGIN
  SELECT array_agg(DISTINCT cmd) INTO v_cmds FROM pg_policies
  WHERE schemaname = 'public' AND policyname IN ('sigre_proyectos_select_evaluador', 'sigre_emprendedores_select_evaluador');
  IF v_cmds IS DISTINCT FROM ARRAY['SELECT'] THEN RAISE EXCEPTION 'ABORTADO: las políticas nuevas deben ser solo SELECT (%)', v_cmds; END IF;

  SELECT array_agg(id_emprendedor_fk) INTO v_emp_esperado FROM public.proyectos WHERE id = v_proyecto;

  PERFORM set_config('request.jwt.claims', jsonb_build_object('sub', v_eval1, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  SELECT array_agg(id ORDER BY id) INTO v_proy FROM public.proyectos;
  SELECT array_agg(id ORDER BY id) INTO v_emp FROM public.emprendedores;
  RESET ROLE;
  IF v_proy IS DISTINCT FROM ARRAY[v_proyecto] THEN RAISE EXCEPTION 'ABORTADO: Evaluador1 debe ver solo el proyecto asignado (%)', v_proy; END IF;
  IF v_emp IS DISTINCT FROM v_emp_esperado THEN RAISE EXCEPTION 'ABORTADO: Evaluador1 debe ver solo el emprendedor del proyecto (%)', v_emp; END IF;

  PERFORM set_config('request.jwt.claims', jsonb_build_object('sub', v_laura, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO v_laura_extra FROM public.proyectos WHERE public.sigre_evalua_proyecto(id);
  RESET ROLE;
  IF v_laura_extra <> 0 THEN RAISE EXCEPTION 'ABORTADO: un usuario no evaluador obtiene acceso nuevo'; END IF;
  PERFORM set_config('request.jwt.claims', '', true);

  INSERT INTO _miniperfil_informe VALUES (jsonb_pretty(jsonb_build_object(
    'resultado', 'ACEPTADO', 'politicas_solo_select', true,
    'evaluador1_proyectos', v_proy, 'evaluador1_emprendedores', v_emp,
    'no_evaluador_sin_acceso_nuevo', true)));
END $$;

COMMIT;

SELECT informe FROM _miniperfil_informe;

-- REVERSIÓN
-- BEGIN;
-- DROP POLICY IF EXISTS sigre_emprendedores_select_evaluador ON public.emprendedores;
-- DROP POLICY IF EXISTS sigre_proyectos_select_evaluador ON public.proyectos;
-- DROP FUNCTION IF EXISTS public.sigre_evalua_emprendedor(uuid);
-- DROP FUNCTION IF EXISTS public.sigre_evalua_proyecto(uuid);
-- COMMIT;
