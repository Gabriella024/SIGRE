-- SIGRE · Miniperfil del proyecto para el Evaluador asignado.
-- Aplicada en STAGING el 2026-10-30 desde supabase/proposals/pitch_evaluador_miniperfil_proyecto.sql (verificación incluida).
-- Solo lectura (SELECT) del proyecto y su emprendedor mientras el Evaluador tenga una asignación activa
-- en un pitch de ese proyecto. No cambia escrituras ni otras políticas. Idempotente.
-- Requiere 20261030120000_ruta_retos_pitch_evaluaciones.sql (public.sigre_evalua_pitch).

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
