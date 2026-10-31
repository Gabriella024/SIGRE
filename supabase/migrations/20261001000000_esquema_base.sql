-- SIGRE · Línea base del esquema public (estructura previa a las migraciones del repositorio).
-- Generada con supabase/scripts/esquema_base_generar.py desde la extracción de SOLO LECTURA de STAGING
-- (supabase/diagnostics/esquema_base_extraer.sql, 2026-10-30). Sin datos de personas, contraseñas ni auditorías.
-- STAGING ya contiene este esquema: NO ejecutar allí (registrar con `supabase migration repair --status applied`).
-- Requiere un proyecto Supabase (o equivalente): roles anon, authenticated y service_role; auth.users y auth.uid().
-- No incluye objetos que crean las migraciones posteriores. Excepciones:
--   sigre_puede_ver_orientacion_fila: la usa la política base sigre_orientaciones_select_autorizado; 20261029190000 la reemplaza por la misma versión
--   sigre_admin_editar_proyecto / sigre_admin_eliminar_proyecto: versión previa (40001), la corrige 20261028120000.
-- Objetos de la extracción: 924; incluidos aquí: 385; catálogos: 426; excluidos: 112.

SET check_function_bodies = false;

-- 20 · Tablas ----------------------------------------------------------------------------------------------
CREATE TABLE public.app_acciones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo text NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    estado text DEFAULT 'activo'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone
);
CREATE TABLE public.app_modulos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo text NOT NULL,
    nombre text NOT NULL,
    ruta_base text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone
);
CREATE TABLE public.app_pantallas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    modulo_id uuid,
    codigo text NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    ruta text,
    orden smallint DEFAULT '1'::smallint,
    estado text DEFAULT 'activo'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone
);
CREATE TABLE public.asignacion_evaluadores (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_pitch_fk uuid NOT NULL,
    id_evaluador_fk uuid NOT NULL,
    estado text DEFAULT 'asignado'::text,
    fecha_asignacion timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone
);
CREATE TABLE public.asistencias (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_orientacion_fk uuid,
    id_emprendedor_fk uuid,
    asistio boolean DEFAULT false,
    observacion text,
    fecha_registro timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    estado_asistencia text,
    registrado_por_usuario_id uuid,
    confirmado_at timestamp with time zone
);
CREATE TABLE public.auditorias (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_usuario_fk uuid,
    tabla_afectada text NOT NULL,
    accion text NOT NULL,
    valor_anterior jsonb,
    valor_nuevo jsonb,
    razon_cambio text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.calificaciones_pitch (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_asignacion_evaluador_fk uuid NOT NULL,
    puntaje numeric,
    resultado text DEFAULT '''pendiente'''::text,
    observacion text,
    estado text DEFAULT 'borrador'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE public.cargas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_orientacion_fk uuid,
    id_usuario_fk uuid,
    nombre_archivo text NOT NULL,
    total_fila integer DEFAULT 0,
    fila_valida integer DEFAULT 0,
    fila_error integer DEFAULT 0,
    fila_duplicada integer DEFAULT 0,
    fila_existente integer DEFAULT 0,
    estado_carga text DEFAULT 'pendiente'::text,
    observacion text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.coordinador_alcances (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_usuario_fk uuid NOT NULL,
    tipo_alcance text NOT NULL,
    id_regional_fk uuid,
    id_centro_fk uuid,
    estado text DEFAULT 'activo'::text NOT NULL,
    fecha_inicio timestamp with time zone DEFAULT now() NOT NULL,
    fecha_fin timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);
CREATE TABLE public.cumplimiento_retos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_proyecto_fk uuid,
    id_reto_fk uuid,
    estado_cumplimiento text,
    fecha_entrega timestamp with time zone,
    archivo_evidencia text,
    observacion text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE public.emprendedores (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    usuario_id uuid NOT NULL,
    nombre_completo text NOT NULL,
    centro_sena text,
    programa_formacion text,
    nivel_formacion text,
    tipo_emprendedor text,
    segmentacion text,
    estado text DEFAULT 'activo'::text NOT NULL,
    id_orientador_fk uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    id_centro_sena_fk uuid
);
CREATE TABLE public.evaluadores (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_usuario_fk uuid NOT NULL,
    especialidad text,
    experiencia text,
    entidad text,
    estado text DEFAULT 'activo'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone
);
CREATE TABLE public.miniperfiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_proyecto_fk uuid NOT NULL,
    id_usuario_fk uuid,
    fecha_aprobacion timestamp with time zone,
    resumen_proyecto text,
    problema text,
    solucion text,
    mercado_objetivo text,
    propuesta_valor text,
    modelo_ingreso text,
    estado text DEFAULT 'borrador'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone
);
CREATE TABLE public.municipios (
    id integer GENERATED BY DEFAULT AS IDENTITY NOT NULL,
    nombre_municipio text NOT NULL,
    departamento text DEFAULT ''::text NOT NULL,
    esta_activo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.orientacion_inscripciones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_orientacion_fk uuid NOT NULL,
    id_emprendedor_fk uuid NOT NULL,
    estado text DEFAULT 'inscrito'::text NOT NULL,
    origen text DEFAULT 'web'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);
CREATE TABLE public.orientaciones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tema text NOT NULL,
    descripcion text,
    fecha date NOT NULL,
    hora_inicio time without time zone NOT NULL,
    hora_fin time without time zone NOT NULL,
    id_orientador_fk uuid,
    modalidad text,
    lugar_link text,
    fuente text,
    audiencia_esperada text,
    estado text DEFAULT 'programada'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    cupo integer,
    id_centro_sena_fk uuid,
    observaciones text
);
CREATE TABLE public.pantalla_acciones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_pantalla_fk uuid,
    id_accion_fk uuid,
    estado text DEFAULT 'activo'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.permiso_cambios_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_permiso_fk uuid NOT NULL,
    id_usuario_fk uuid NOT NULL,
    anterior_valor jsonb,
    nuevo_valor jsonb NOT NULL,
    razones_cambios text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.pitch (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_proyecto_fk uuid,
    fecha_hora timestamp with time zone,
    lugar_link text,
    modalidad text DEFAULT '''presencial'''::text,
    estado text DEFAULT 'programado'::text,
    resultado_general text,
    observacion text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE public.preparaciones_pitch (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_proyecto_fk uuid NOT NULL,
    id_orientador_fk uuid,
    fecha date,
    tema text,
    observacion text,
    estado text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE public.proyectos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_emprendedor_fk uuid,
    titulo text NOT NULL,
    descripcion text,
    sector_economico text,
    problema_oportunidad text,
    propuesta_valor text,
    estado_proyecto text DEFAULT 'borrador'::text,
    etapa_actual text,
    observaciones text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone
);
CREATE TABLE public.registros_carga_masiva (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_carga_fk uuid NOT NULL,
    nombre_apellido text,
    tipo_documento text,
    correo text,
    centro_sena text,
    programa_formacion text,
    estado_validacion text DEFAULT 'pendiente'::text,
    mensaje_error text,
    id_emprendedor_fk uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.retos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    titulo text NOT NULL,
    descripcion text,
    entregable text,
    orden smallint DEFAULT '1'::smallint,
    estado text DEFAULT 'activo'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone
);
CREATE TABLE public.rol_pantalla_permisos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_rol_fk smallint,
    id_pantalla_accion_fk uuid,
    habilitado boolean DEFAULT true,
    nivel_acceso text,
    estado text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone
);
CREATE TABLE public.roles (
    id smallint GENERATED BY DEFAULT AS IDENTITY NOT NULL,
    nombre_rol text NOT NULL,
    estado text DEFAULT 'activo'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone
);
CREATE TABLE public.rutas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_proyecto_fk uuid NOT NULL,
    etapa text NOT NULL,
    estado_etapa text DEFAULT 'pendiente'::text,
    fecha_inicio date,
    fecha_fin date,
    observacion text,
    id_responsable_fk uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE public.sena_centros (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_regional_fk uuid NOT NULL,
    codigo text NOT NULL,
    nombre text NOT NULL,
    estado text DEFAULT 'activo'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);
CREATE TABLE public.sena_regionales (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo text NOT NULL,
    nombre text NOT NULL,
    estado text DEFAULT 'activo'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);
CREATE TABLE public.sigre_invitaciones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    correo_electronico text NOT NULL,
    id_administrador uuid NOT NULL,
    id_usuario_auth uuid,
    id_rol smallint NOT NULL,
    estado text DEFAULT 'pendiente'::text NOT NULL,
    codigo_error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.sustentacion_retos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_cumplimiento_reto_fk uuid NOT NULL,
    id_orientador_fk uuid,
    id_evaluado_por_fk uuid,
    fecha_sustentacion timestamp with time zone,
    resultado text DEFAULT '''pendiente'''::text,
    observacion text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE public.usuario_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_usuario_fk uuid NOT NULL,
    id_rol_fk smallint NOT NULL,
    estado text DEFAULT 'activo'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone
);
CREATE TABLE public.usuarios (
    id uuid NOT NULL,
    tipo_documento text NOT NULL,
    numero_documento text NOT NULL,
    primer_nombre text NOT NULL,
    segundo_nombre text,
    primer_apellido text NOT NULL,
    segundo_apellido text,
    numero_telefono text,
    correo_electronico text NOT NULL,
    estado text DEFAULT 'activo'::text,
    ultimo_acceso timestamp with time zone,
    id_municipio_fk integer,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);

-- 30 · Claves primarias, únicas y CHECK --------------------------------------------------------------------
ALTER TABLE ONLY public.app_acciones ADD CONSTRAINT app_acciones_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.app_acciones ADD CONSTRAINT app_acciones_codigo_key UNIQUE (codigo);
ALTER TABLE ONLY public.app_modulos ADD CONSTRAINT app_modulos_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.app_modulos ADD CONSTRAINT app_modulos_codigo_key UNIQUE (codigo);
ALTER TABLE ONLY public.app_pantallas ADD CONSTRAINT app_pantallas_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.app_pantallas ADD CONSTRAINT app_pantallas_codigo_key UNIQUE (codigo);
ALTER TABLE ONLY public.asignacion_evaluadores ADD CONSTRAINT asignacion_retos_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.asignacion_evaluadores ADD CONSTRAINT unique_pitch_evaluador UNIQUE (id_pitch_fk, id_evaluador_fk);
ALTER TABLE ONLY public.asistencias ADD CONSTRAINT asistencias_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.asistencias ADD CONSTRAINT unique_orientaciones_emprendedor UNIQUE (id_orientacion_fk, id_emprendedor_fk);
ALTER TABLE ONLY public.asistencias ADD CONSTRAINT asistencias_estado_explicito_check CHECK (((estado_asistencia IS NULL) OR (estado_asistencia = ANY (ARRAY['asistio'::text, 'no_asistio'::text]))));
ALTER TABLE ONLY public.auditorias ADD CONSTRAINT auditoria_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.calificaciones_pitch ADD CONSTRAINT calificaciones_pitch_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.calificaciones_pitch ADD CONSTRAINT calificaciones_pitch_id_asignacion_evaluador_fk_key UNIQUE (id_asignacion_evaluador_fk);
ALTER TABLE ONLY public.cargas ADD CONSTRAINT cargas_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.coordinador_alcances ADD CONSTRAINT coordinador_alcances_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.coordinador_alcances ADD CONSTRAINT coordinador_alcance_destino_chk CHECK ((((tipo_alcance = 'regional'::text) AND (id_regional_fk IS NOT NULL) AND (id_centro_fk IS NULL)) OR ((tipo_alcance = 'centro'::text) AND (id_centro_fk IS NOT NULL) AND (id_regional_fk IS NULL))));
ALTER TABLE ONLY public.coordinador_alcances ADD CONSTRAINT coordinador_alcance_fechas_chk CHECK (((fecha_fin IS NULL) OR (fecha_fin > fecha_inicio)));
ALTER TABLE ONLY public.coordinador_alcances ADD CONSTRAINT coordinador_alcances_estado_check CHECK ((estado = ANY (ARRAY['activo'::text, 'inactivo'::text])));
ALTER TABLE ONLY public.coordinador_alcances ADD CONSTRAINT coordinador_alcances_tipo_alcance_check CHECK ((tipo_alcance = ANY (ARRAY['regional'::text, 'centro'::text])));
ALTER TABLE ONLY public.cumplimiento_retos ADD CONSTRAINT cumplimiento_retos_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.emprendedores ADD CONSTRAINT emprendedores_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.emprendedores ADD CONSTRAINT emprendedores_usuario_id_key UNIQUE (usuario_id);
ALTER TABLE ONLY public.emprendedores ADD CONSTRAINT sigre_emprendedores_estado_check CHECK ((estado = ANY (ARRAY['activo'::text, 'inactivo'::text])));
ALTER TABLE ONLY public.evaluadores ADD CONSTRAINT evaluadores_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.evaluadores ADD CONSTRAINT evaluadores_id_usuario_fk_key UNIQUE (id_usuario_fk);
ALTER TABLE ONLY public.miniperfiles ADD CONSTRAINT miniperfiles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.miniperfiles ADD CONSTRAINT miniperfiles_id_proyecto_fk_key UNIQUE (id_proyecto_fk);
ALTER TABLE ONLY public.municipios ADD CONSTRAINT municipios_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.orientacion_inscripciones ADD CONSTRAINT orientacion_inscripciones_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.orientacion_inscripciones ADD CONSTRAINT orientacion_inscripciones_unica UNIQUE (id_orientacion_fk, id_emprendedor_fk);
ALTER TABLE ONLY public.orientacion_inscripciones ADD CONSTRAINT orientacion_inscripciones_estado_check CHECK ((estado = ANY (ARRAY['inscrito'::text, 'cancelado'::text])));
ALTER TABLE ONLY public.orientacion_inscripciones ADD CONSTRAINT orientacion_inscripciones_origen_check CHECK ((origen = ANY (ARRAY['web'::text, 'manual'::text, 'masivo'::text])));
ALTER TABLE ONLY public.orientaciones ADD CONSTRAINT orientaciones_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.orientaciones ADD CONSTRAINT orientaciones_cupo_positivo CHECK (((cupo IS NULL) OR (cupo > 0))) NOT VALID;
ALTER TABLE ONLY public.orientaciones ADD CONSTRAINT orientaciones_horario_valido CHECK ((hora_fin > hora_inicio)) NOT VALID;
ALTER TABLE ONLY public.pantalla_acciones ADD CONSTRAINT pantalla_acciones_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.pantalla_acciones ADD CONSTRAINT unique_pantalla_accion UNIQUE (id_pantalla_fk, id_accion_fk);
ALTER TABLE ONLY public.permiso_cambios_logs ADD CONSTRAINT permiso_cambios_logs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.pitch ADD CONSTRAINT pitch_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.preparaciones_pitch ADD CONSTRAINT preparacion_pitch_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.proyectos ADD CONSTRAINT proyectos_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.registros_carga_masiva ADD CONSTRAINT registros_carga_masiva_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.retos ADD CONSTRAINT retos_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.rol_pantalla_permisos ADD CONSTRAINT permisos_rol_pantalla_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.rol_pantalla_permisos ADD CONSTRAINT unique_rol_pantalla_accion UNIQUE (id_rol_fk, id_pantalla_accion_fk);
ALTER TABLE ONLY public.roles ADD CONSTRAINT roles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.rutas ADD CONSTRAINT rutas_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.sena_centros ADD CONSTRAINT sena_centros_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.sena_centros ADD CONSTRAINT sena_centros_codigo_key UNIQUE (codigo);
ALTER TABLE ONLY public.sena_centros ADD CONSTRAINT sena_centros_estado_check CHECK ((estado = ANY (ARRAY['activo'::text, 'inactivo'::text])));
ALTER TABLE ONLY public.sena_regionales ADD CONSTRAINT sena_regionales_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.sena_regionales ADD CONSTRAINT sena_regionales_codigo_key UNIQUE (codigo);
ALTER TABLE ONLY public.sena_regionales ADD CONSTRAINT sena_regionales_estado_check CHECK ((estado = ANY (ARRAY['activo'::text, 'inactivo'::text])));
ALTER TABLE ONLY public.sigre_invitaciones ADD CONSTRAINT sigre_invitaciones_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.sigre_invitaciones ADD CONSTRAINT sigre_invitaciones_correo_valido CHECK (((length(btrim(correo_electronico)) > 3) AND (correo_electronico = lower(btrim(correo_electronico)))));
ALTER TABLE ONLY public.sigre_invitaciones ADD CONSTRAINT sigre_invitaciones_estado_check CHECK ((estado = ANY (ARRAY['pendiente'::text, 'completada'::text, 'requiere_revision'::text])));
ALTER TABLE ONLY public.sustentacion_retos ADD CONSTRAINT sustentacion_retos_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.usuario_roles ADD CONSTRAINT usuario_roles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.usuario_roles ADD CONSTRAINT unique_usuario_rol UNIQUE (id_usuario_fk, id_rol_fk);
ALTER TABLE ONLY public.usuarios ADD CONSTRAINT perfiles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.usuarios ADD CONSTRAINT perfiles_correo_electronico_key UNIQUE (correo_electronico);
ALTER TABLE ONLY public.usuarios ADD CONSTRAINT perfiles_numero_documento_key UNIQUE (numero_documento);

-- 35 · Claves foráneas -------------------------------------------------------------------------------------
ALTER TABLE ONLY public.app_pantallas ADD CONSTRAINT app_pantallas_modulo_id_fkey FOREIGN KEY (modulo_id) REFERENCES app_modulos(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.asignacion_evaluadores ADD CONSTRAINT asignacion_evaluadores_id_evaluador_fk_fkey FOREIGN KEY (id_evaluador_fk) REFERENCES evaluadores(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.asignacion_evaluadores ADD CONSTRAINT asignacion_retos_id_pitch_fk_fkey FOREIGN KEY (id_pitch_fk) REFERENCES pitch(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.asistencias ADD CONSTRAINT asistencias_id_emprendedor_fk_fkey FOREIGN KEY (id_emprendedor_fk) REFERENCES emprendedores(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.asistencias ADD CONSTRAINT asistencias_id_orientacion_fk_fkey FOREIGN KEY (id_orientacion_fk) REFERENCES orientaciones(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.asistencias ADD CONSTRAINT asistencias_responsable_fk FOREIGN KEY (registrado_por_usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT;
ALTER TABLE ONLY public.auditorias ADD CONSTRAINT auditoria_id_usuario_fk_fkey FOREIGN KEY (id_usuario_fk) REFERENCES usuarios(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.calificaciones_pitch ADD CONSTRAINT calificaciones_pitch_id_asignacion_evaluador_fk_fkey FOREIGN KEY (id_asignacion_evaluador_fk) REFERENCES asignacion_evaluadores(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.cargas ADD CONSTRAINT cargas_id_orientacion_fk_fkey FOREIGN KEY (id_orientacion_fk) REFERENCES orientaciones(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.cargas ADD CONSTRAINT cargas_id_usuario_fk_fkey FOREIGN KEY (id_usuario_fk) REFERENCES usuarios(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.coordinador_alcances ADD CONSTRAINT coordinador_alcances_id_centro_fk_fkey FOREIGN KEY (id_centro_fk) REFERENCES sena_centros(id);
ALTER TABLE ONLY public.coordinador_alcances ADD CONSTRAINT coordinador_alcances_id_regional_fk_fkey FOREIGN KEY (id_regional_fk) REFERENCES sena_regionales(id);
ALTER TABLE ONLY public.coordinador_alcances ADD CONSTRAINT coordinador_alcances_id_usuario_fk_fkey FOREIGN KEY (id_usuario_fk) REFERENCES usuarios(id);
ALTER TABLE ONLY public.cumplimiento_retos ADD CONSTRAINT cumplimiento_retos_id_proyecto_fk_fkey FOREIGN KEY (id_proyecto_fk) REFERENCES proyectos(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.cumplimiento_retos ADD CONSTRAINT cumplimiento_retos_id_reto_fk_fkey FOREIGN KEY (id_reto_fk) REFERENCES retos(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.emprendedores ADD CONSTRAINT emprendedores_id_centro_sena_fk_fkey FOREIGN KEY (id_centro_sena_fk) REFERENCES sena_centros(id);
ALTER TABLE ONLY public.emprendedores ADD CONSTRAINT emprendedores_id_orientador_fk_fkey FOREIGN KEY (id_orientador_fk) REFERENCES usuarios(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.emprendedores ADD CONSTRAINT emprendedores_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.evaluadores ADD CONSTRAINT evaluadores_id_usuario_fk_fkey FOREIGN KEY (id_usuario_fk) REFERENCES usuarios(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.miniperfiles ADD CONSTRAINT miniperfiles_id_proyecto_fk_fkey FOREIGN KEY (id_proyecto_fk) REFERENCES proyectos(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.miniperfiles ADD CONSTRAINT miniperfiles_id_usuario_fk_fkey FOREIGN KEY (id_usuario_fk) REFERENCES usuarios(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.orientacion_inscripciones ADD CONSTRAINT orientacion_inscripciones_id_emprendedor_fk_fkey FOREIGN KEY (id_emprendedor_fk) REFERENCES emprendedores(id) ON DELETE RESTRICT;
ALTER TABLE ONLY public.orientacion_inscripciones ADD CONSTRAINT orientacion_inscripciones_id_orientacion_fk_fkey FOREIGN KEY (id_orientacion_fk) REFERENCES orientaciones(id) ON DELETE RESTRICT;
ALTER TABLE ONLY public.orientaciones ADD CONSTRAINT orientaciones_centro_sena_fk FOREIGN KEY (id_centro_sena_fk) REFERENCES sena_centros(id) NOT VALID;
ALTER TABLE ONLY public.orientaciones ADD CONSTRAINT orientaciones_id_orientador_fk_fkey FOREIGN KEY (id_orientador_fk) REFERENCES usuarios(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.pantalla_acciones ADD CONSTRAINT pantalla_acciones_id_accion_fk_fkey FOREIGN KEY (id_accion_fk) REFERENCES app_acciones(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.pantalla_acciones ADD CONSTRAINT pantalla_acciones_id_pantalla_fk_fkey FOREIGN KEY (id_pantalla_fk) REFERENCES app_pantallas(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.permiso_cambios_logs ADD CONSTRAINT permiso_cambios_logs_id_permiso_fk_fkey FOREIGN KEY (id_permiso_fk) REFERENCES rol_pantalla_permisos(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.permiso_cambios_logs ADD CONSTRAINT permiso_cambios_logs_id_usuario_fk_fkey FOREIGN KEY (id_usuario_fk) REFERENCES usuarios(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.pitch ADD CONSTRAINT pitch_id_proyecto_fk_fkey FOREIGN KEY (id_proyecto_fk) REFERENCES proyectos(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.preparaciones_pitch ADD CONSTRAINT preparacion_pitch_id_orientador_fk_fkey FOREIGN KEY (id_orientador_fk) REFERENCES usuarios(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.preparaciones_pitch ADD CONSTRAINT preparacion_pitch_id_proyecto_fk_fkey FOREIGN KEY (id_proyecto_fk) REFERENCES proyectos(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.proyectos ADD CONSTRAINT proyectos_id_emprendedor_fk_fkey FOREIGN KEY (id_emprendedor_fk) REFERENCES emprendedores(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.registros_carga_masiva ADD CONSTRAINT registros_carga_masiva_id_carga_fk_fkey FOREIGN KEY (id_carga_fk) REFERENCES cargas(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.registros_carga_masiva ADD CONSTRAINT registros_carga_masiva_id_emprendedor_fk_fkey FOREIGN KEY (id_emprendedor_fk) REFERENCES emprendedores(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.rol_pantalla_permisos ADD CONSTRAINT permisos_rol_pantalla_id_pantalla_accion_fk_fkey FOREIGN KEY (id_pantalla_accion_fk) REFERENCES pantalla_acciones(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.rol_pantalla_permisos ADD CONSTRAINT permisos_rol_pantalla_id_rol_fk_fkey FOREIGN KEY (id_rol_fk) REFERENCES roles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.rutas ADD CONSTRAINT rutas_id_proyecto_fk_fkey FOREIGN KEY (id_proyecto_fk) REFERENCES proyectos(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.rutas ADD CONSTRAINT rutas_id_responsable_fk_fkey FOREIGN KEY (id_responsable_fk) REFERENCES usuarios(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.sena_centros ADD CONSTRAINT sena_centros_id_regional_fk_fkey FOREIGN KEY (id_regional_fk) REFERENCES sena_regionales(id);
ALTER TABLE ONLY public.sigre_invitaciones ADD CONSTRAINT sigre_invitaciones_id_administrador_fkey FOREIGN KEY (id_administrador) REFERENCES usuarios(id);
ALTER TABLE ONLY public.sigre_invitaciones ADD CONSTRAINT sigre_invitaciones_id_rol_fkey FOREIGN KEY (id_rol) REFERENCES roles(id);
ALTER TABLE ONLY public.sigre_invitaciones ADD CONSTRAINT sigre_invitaciones_id_usuario_auth_fkey FOREIGN KEY (id_usuario_auth) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.sustentacion_retos ADD CONSTRAINT sustentacion_retos_id_cumplimiento_reto_fk_fkey FOREIGN KEY (id_cumplimiento_reto_fk) REFERENCES cumplimiento_retos(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.sustentacion_retos ADD CONSTRAINT sustentacion_retos_id_evaluado_por_fk_fkey FOREIGN KEY (id_evaluado_por_fk) REFERENCES usuarios(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.sustentacion_retos ADD CONSTRAINT sustentacion_retos_id_orientador_fk_fkey FOREIGN KEY (id_orientador_fk) REFERENCES usuarios(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.usuario_roles ADD CONSTRAINT usuario_roles_id_rol_fk_fkey FOREIGN KEY (id_rol_fk) REFERENCES roles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.usuario_roles ADD CONSTRAINT usuario_roles_id_usuario_fk_fkey FOREIGN KEY (id_usuario_fk) REFERENCES usuarios(id);
ALTER TABLE ONLY public.usuarios ADD CONSTRAINT perfiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id);
ALTER TABLE ONLY public.usuarios ADD CONSTRAINT perfiles_id_municipio_fk_fkey1 FOREIGN KEY (id_municipio_fk) REFERENCES municipios(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.usuarios ADD CONSTRAINT usuarios_id_auth_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE RESTRICT;

-- 40 · Índices ---------------------------------------------------------------------------------------------
CREATE INDEX idx_asignacion_evaluadores_evaluador_seguridad ON public.asignacion_evaluadores USING btree (id_evaluador_fk);
CREATE INDEX idx_asistencias_emprendedor_seguridad ON public.asistencias USING btree (id_emprendedor_fk);
CREATE INDEX idx_coordinador_alcances_centro ON public.coordinador_alcances USING btree (id_centro_fk);
CREATE INDEX idx_coordinador_alcances_regional ON public.coordinador_alcances USING btree (id_regional_fk);
CREATE INDEX idx_coordinador_alcances_usuario ON public.coordinador_alcances USING btree (id_usuario_fk);
CREATE UNIQUE INDEX uq_coordinador_alcance_centro_activo ON public.coordinador_alcances USING btree (id_usuario_fk, id_centro_fk) WHERE ((tipo_alcance = 'centro'::text) AND (estado = 'activo'::text) AND (deleted_at IS NULL) AND (fecha_fin IS NULL));
CREATE UNIQUE INDEX uq_coordinador_alcance_regional_activo ON public.coordinador_alcances USING btree (id_usuario_fk, id_regional_fk) WHERE ((tipo_alcance = 'regional'::text) AND (estado = 'activo'::text) AND (deleted_at IS NULL) AND (fecha_fin IS NULL));
CREATE INDEX idx_emprendedores_id_centro_sena_fk ON public.emprendedores USING btree (id_centro_sena_fk);
CREATE INDEX idx_emprendedores_orientador_seguridad ON public.emprendedores USING btree (id_orientador_fk);
CREATE INDEX idx_emprendedores_usuario_seguridad ON public.emprendedores USING btree (usuario_id);
CREATE INDEX idx_ori_inscripciones_emprendedor ON public.orientacion_inscripciones USING btree (id_emprendedor_fk) WHERE (deleted_at IS NULL);
CREATE INDEX idx_ori_inscripciones_jornada_estado ON public.orientacion_inscripciones USING btree (id_orientacion_fk, estado) WHERE (deleted_at IS NULL);
CREATE INDEX idx_orientaciones_centro_sena ON public.orientaciones USING btree (id_centro_sena_fk) WHERE (deleted_at IS NULL);
CREATE INDEX idx_orientaciones_orientador_seguridad ON public.orientaciones USING btree (id_orientador_fk);
CREATE INDEX idx_proyectos_emprendedor_seguridad ON public.proyectos USING btree (id_emprendedor_fk);
CREATE INDEX idx_sena_centros_regional ON public.sena_centros USING btree (id_regional_fk);
CREATE INDEX idx_sigre_invitaciones_correo ON public.sigre_invitaciones USING btree (correo_electronico);
CREATE INDEX idx_sigre_invitaciones_estado ON public.sigre_invitaciones USING btree (estado);
CREATE UNIQUE INDEX sigre_invitaciones_correo_abierto_uk ON public.sigre_invitaciones USING btree (correo_electronico) WHERE (estado = ANY (ARRAY['pendiente'::text, 'requiere_revision'::text]));
CREATE INDEX idx_usuario_roles_usuario_seguridad ON public.usuario_roles USING btree (id_usuario_fk);

-- 50 · Funciones -------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.coordinador_puede_ver_centro(p_centro_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
    SELECT
      p_centro_id IS NOT NULL
      AND auth.uid() IS NOT NULL

      AND EXISTS (
        SELECT 1
        FROM public.usuarios u
        JOIN public.usuario_roles ur
          ON ur.id_usuario_fk = u.id
        JOIN public.roles r
          ON r.id = ur.id_rol_fk
        JOIN public.coordinador_alcances ca
          ON ca.id_usuario_fk = u.id
        JOIN public.sena_centros c
          ON c.id = p_centro_id
        JOIN public.sena_regionales reg
          ON reg.id = c.id_regional_fk

        WHERE u.id = (SELECT auth.uid())
          AND u.estado = 'activo'
          AND u.deleted_at IS NULL

          AND ur.estado = 'activo'
          AND ur.deleted_at IS NULL

          AND r.nombre_rol = 'coordinador'
          AND r.estado = 'activo'
          AND r.deleted_at IS NULL

          AND ca.estado = 'activo'
          AND ca.deleted_at IS NULL
          AND ca.fecha_inicio <= now()
          AND (
            ca.fecha_fin IS NULL
            OR ca.fecha_fin > now()
          )

          AND c.estado = 'activo'
          AND c.deleted_at IS NULL

          AND reg.estado = 'activo'
          AND reg.deleted_at IS NULL

          AND (
            (
              ca.tipo_alcance = 'regional'
              AND ca.id_regional_fk = reg.id
            )
            OR
            (
              ca.tipo_alcance = 'centro'
              AND ca.id_centro_fk = c.id
            )
          )
      );
$function$;
CREATE OR REPLACE FUNCTION public.handle_nuevo_usuario()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
insert into public.usuarios (
  id,
  correo_electronico,
  tipo_documento,
  numero_documento,
  primer_nombre,
  primer_apellido,
  estado,
  created_at,
  updated_at
) values (
  NEW.id,
  NEW.email,
  coalesce(new.raw_user_meta_data->>'tipo_documento', 'CC'),
  coalesce(new.raw_user_meta_data->> 'numero_documento', NEW.id::text),
  coalesce(new.raw_user_meta_data->> 'primer_nombre', 'Usuario'),
  coalesce(new.raw_user_meta_data->> 'primer_apellido', 'Registrado'),
  'activo',
  new.created_at,
  new.created_at
)
on conflict (id) do update set
correo_electronico = excluded.correo_electronico,
updated_at = excluded.updated_at;
return new;
end;
$function$;
CREATE OR REPLACE FUNCTION public.obtener_mis_centros_coordinacion()
 RETURNS TABLE(centro_id uuid, centro_codigo text, centro_nombre text, regional_id uuid, regional_nombre text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
    SELECT
      c.id,
      c.codigo,
      c.nombre,
      reg.id,
      reg.nombre
    FROM public.sena_centros c
    JOIN public.sena_regionales reg
      ON reg.id = c.id_regional_fk
    WHERE c.estado = 'activo'
      AND c.deleted_at IS NULL
      AND reg.estado = 'activo'
      AND reg.deleted_at IS NULL
      AND public.coordinador_puede_ver_centro(c.id)
    ORDER BY reg.nombre, c.nombre;
$function$;
CREATE OR REPLACE FUNCTION public.obtener_mis_permisos()
 RETURNS TABLE(rol text, modulo text, pantalla text, accion text, nivel_acceso text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
    SELECT DISTINCT
        r.nombre_rol::text,
        m.codigo::text,
        p.codigo::text,
        a.codigo::text,
        rp.nivel_acceso::text
    FROM public.usuarios u

    JOIN public.usuario_roles ur
      ON ur.id_usuario_fk = u.id

    JOIN public.roles r
      ON r.id = ur.id_rol_fk

    JOIN public.rol_pantalla_permisos rp
      ON rp.id_rol_fk = r.id

    JOIN public.pantalla_acciones pa
      ON pa.id = rp.id_pantalla_accion_fk

    JOIN public.app_pantallas p
      ON p.id = pa.id_pantalla_fk

    JOIN public.app_modulos m
      ON m.id = p.modulo_id

    JOIN public.app_acciones a
      ON a.id = pa.id_accion_fk

    WHERE u.id = (SELECT auth.uid())

      AND u.estado = 'activo'
      AND u.deleted_at IS NULL

      AND ur.estado = 'activo'
      AND ur.deleted_at IS NULL

      AND r.estado = 'activo'
      AND r.deleted_at IS NULL

      AND rp.estado = 'activo'
      AND rp.habilitado IS TRUE
      AND rp.nivel_acceso IN ('SL', 'LE', 'AT')

      AND pa.estado = 'activo'

      AND p.estado = 'activo'
      AND p.deleted_at IS NULL

      AND m.deleted_at IS NULL

      AND a.estado = 'activo'
      AND a.deleted_at IS NULL;
$function$;
CREATE OR REPLACE FUNCTION public.puede_ver_asistencia(p_asistencia_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
    SELECT EXISTS (
        SELECT 1
        FROM public.asistencias asi
        JOIN public.orientaciones o
          ON o.id = asi.id_orientacion_fk
        JOIN public.emprendedores e
          ON e.id = asi.id_emprendedor_fk
        WHERE asi.id = p_asistencia_id
          AND asi.deleted_at IS NULL
          AND o.deleted_at IS NULL
          AND e.deleted_at IS NULL
          AND (
              public.tiene_rol('administrador')

              OR (
                  public.tiene_rol('orientador')
                  AND o.id_orientador_fk = (SELECT auth.uid())
              )

              OR (
                  public.tiene_rol('emprendedor')
                  AND e.usuario_id = (SELECT auth.uid())
              )

              OR (
                  public.tiene_rol('coordinador')
                  AND public.coordinador_puede_ver_centro(
                      e.id_centro_sena_fk
                  )
              )
          )
    );
$function$;
CREATE OR REPLACE FUNCTION public.puede_ver_emprendedor(p_emprendedor_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
    SELECT EXISTS (
        SELECT 1
        FROM public.emprendedores e
        WHERE e.id = p_emprendedor_id
          AND e.deleted_at IS NULL
          AND (
              public.tiene_rol('administrador')

              OR (
                  public.tiene_rol('coordinador')
                  AND public.coordinador_puede_ver_centro(
                      e.id_centro_sena_fk
                  )
              )

              OR (
                  public.tiene_rol('orientador')
                  AND e.id_orientador_fk = (SELECT auth.uid())
              )

              OR (
                  public.tiene_rol('emprendedor')
                  AND e.usuario_id = (SELECT auth.uid())
              )

              OR (
                  public.tiene_rol('evaluador')
                  AND EXISTS (
                      SELECT 1
                      FROM public.evaluadores ev
                      JOIN public.asignacion_evaluadores ae
                        ON ae.id_evaluador_fk = ev.id
                      JOIN public.pitch pi
                        ON pi.id = ae.id_pitch_fk
                      JOIN public.proyectos pr
                        ON pr.id = pi.id_proyecto_fk
                      WHERE ev.id_usuario_fk = (SELECT auth.uid())
                        AND ev.estado = 'activo'
                        AND ev.deleted_at IS NULL
                        AND ae.estado = 'activo'
                        AND ae.deleted_at IS NULL
                        AND pr.id_emprendedor_fk = e.id
                        AND pr.deleted_at IS NULL
                  )
              )
          )
    );
$function$;
CREATE OR REPLACE FUNCTION public.puede_ver_orientacion(p_orientacion_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
    SELECT EXISTS (
        SELECT 1
        FROM public.orientaciones o
        WHERE o.id = p_orientacion_id
          AND o.deleted_at IS NULL
          AND (
              public.tiene_rol('administrador')

              OR (
                  public.tiene_rol('orientador')
                  AND o.id_orientador_fk = (SELECT auth.uid())
              )

              OR (
                  public.tiene_rol('emprendedor')
                  AND EXISTS (
                      SELECT 1
                      FROM public.asistencias asi
                      JOIN public.emprendedores e
                        ON e.id = asi.id_emprendedor_fk
                      WHERE asi.id_orientacion_fk = o.id
                        AND asi.deleted_at IS NULL
                        AND e.deleted_at IS NULL
                        AND e.usuario_id = (SELECT auth.uid())
                  )
              )

              OR (
                  public.tiene_rol('coordinador')
                  AND EXISTS (
                      SELECT 1
                      FROM public.asistencias asi
                      JOIN public.emprendedores e
                        ON e.id = asi.id_emprendedor_fk
                      WHERE asi.id_orientacion_fk = o.id
                        AND asi.deleted_at IS NULL
                        AND e.deleted_at IS NULL
                        AND public.coordinador_puede_ver_centro(
                            e.id_centro_sena_fk
                        )
                  )
              )
          )
    );
$function$;
CREATE OR REPLACE FUNCTION public.puede_ver_proyecto(p_proyecto_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
    SELECT EXISTS (
      SELECT 1
      FROM public.proyectos pr
      JOIN public.emprendedores e
        ON e.id = pr.id_emprendedor_fk
      WHERE pr.id = p_proyecto_id
        AND pr.deleted_at IS NULL
        AND public.puede_ver_emprendedor(e.id)
    );
$function$;
CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;
CREATE OR REPLACE FUNCTION public.sigre_admin_asignar_orientador(p_id_emprendedor uuid, p_updated_at_esperado timestamp with time zone, p_id_orientador uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    v_emprendedor public.emprendedores%ROWTYPE;
    v_actor uuid := auth.uid();
BEGIN
    -- Autorización administrativa.
    IF v_actor IS NULL
       OR NOT EXISTS (
           SELECT 1
           FROM public.usuarios u
           WHERE u.id = v_actor
             AND u.estado = 'activo'
             AND u.deleted_at IS NULL
       )
       OR NOT COALESCE(public.tiene_rol('administrador'), false)
       OR NOT COALESCE(
           public.tiene_permiso('emprendedores', 'editar'),
           false
       )
    THEN
        RAISE EXCEPTION 'No autorizado para asignar orientadores'
            USING ERRCODE = '42501';
    END IF;

    IF p_id_emprendedor IS NULL
       OR p_updated_at_esperado IS NULL
    THEN
        RAISE EXCEPTION 'Datos obligatorios incompletos'
            USING ERRCODE = '22023';
    END IF;

    -- Bloquear emprendedor para impedir escrituras concurrentes.
    SELECT e.*
    INTO v_emprendedor
    FROM public.emprendedores e
    WHERE e.id = p_id_emprendedor
    FOR UPDATE;

    IF NOT FOUND OR v_emprendedor.deleted_at IS NOT NULL THEN
        RAISE EXCEPTION 'Emprendedor no encontrado'
            USING ERRCODE = 'P0002';
    END IF;

    -- E5-13: congelar cualquier cambio de orientador mientras esté inactivo.
    IF v_emprendedor.estado IS DISTINCT FROM 'activo' THEN
        RAISE EXCEPTION 'No se puede modificar el orientador de un emprendedor inactivo'
            USING ERRCODE = '23514';
    END IF;

    IF v_emprendedor.updated_at IS DISTINCT FROM
       p_updated_at_esperado
    THEN
        RAISE EXCEPTION 'El emprendedor fue modificado por otro usuario'
            USING ERRCODE = 'PT409';
    END IF;

    IF v_emprendedor.id_orientador_fk
       IS NOT DISTINCT FROM p_id_orientador
    THEN
        RAISE EXCEPTION 'La asignación no presenta cambios'
            USING ERRCODE = '22023';
    END IF;

    -- NULL significa quitar el orientador.
    -- Si se asigna uno, debe estar activo y tener rol vigente.
    IF p_id_orientador IS NOT NULL THEN
        PERFORM 1
        FROM public.usuarios u
        JOIN public.usuario_roles ur
          ON ur.id_usuario_fk = u.id
        JOIN public.roles r
          ON r.id = ur.id_rol_fk
        WHERE u.id = p_id_orientador
          AND u.estado = 'activo'
          AND u.deleted_at IS NULL
          AND ur.estado = 'activo'
          AND ur.deleted_at IS NULL
          AND r.nombre_rol = 'orientador'
          AND r.estado = 'activo'
          AND r.deleted_at IS NULL
        FOR SHARE OF u, ur, r;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Orientador no elegible'
                USING ERRCODE = '22023';
        END IF;
    END IF;

    -- Solo modificar la asignación.
    UPDATE public.emprendedores
    SET id_orientador_fk = p_id_orientador
    WHERE id = p_id_emprendedor;

    -- Auditoría de la asignación.
    INSERT INTO public.auditorias (
        id_usuario_fk,
        tabla_afectada,
        accion,
        valor_anterior,
        valor_nuevo,
        razon_cambio
    )
    VALUES (
        v_actor,
        'emprendedores',
        CASE
            WHEN v_emprendedor.id_orientador_fk IS NULL
                THEN 'ORIENTADOR_ASIGNADO'
            WHEN p_id_orientador IS NULL
                THEN 'ORIENTADOR_RETIRADO'
            ELSE 'ORIENTADOR_CAMBIADO'
        END,
        jsonb_build_object(
            'id_emprendedor', p_id_emprendedor,
            'id_orientador', v_emprendedor.id_orientador_fk
        ),
        jsonb_build_object(
            'id_emprendedor', p_id_emprendedor,
            'id_orientador', p_id_orientador
        ),
        'Gestión administrativa de asignación de orientador'
    );

    RETURN p_id_emprendedor;
END;
$function$;
CREATE OR REPLACE FUNCTION public.sigre_admin_cambiar_estado_emprendedor(p_id_emprendedor uuid, p_updated_at_esperado timestamp with time zone, p_estado_nuevo text, p_justificacion text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_emprendedor public.emprendedores%ROWTYPE;
  v_justificacion text := btrim(p_justificacion);
BEGIN
  IF v_actor IS NULL
     OR NOT EXISTS (
       SELECT 1 FROM public.usuarios u
       WHERE u.id = v_actor AND u.estado = 'activo' AND u.deleted_at IS NULL
     )
     OR NOT COALESCE(public.tiene_rol('administrador'), false)
     OR NOT COALESCE(public.tiene_permiso('emprendedores', 'editar'), false)
  THEN
    RAISE EXCEPTION 'No autorizado para cambiar estado de emprendedor'
      USING ERRCODE = '42501';
  END IF;

  IF p_id_emprendedor IS NULL OR p_updated_at_esperado IS NULL
     OR p_estado_nuevo IS NULL OR p_estado_nuevo NOT IN ('activo','inactivo')
     OR v_justificacion IS NULL OR v_justificacion = ''
  THEN
    RAISE EXCEPTION 'Identificador, version, estado y justificacion validos son obligatorios'
      USING ERRCODE = '22023';
  END IF;

  SELECT e.* INTO v_emprendedor
  FROM public.emprendedores e
  WHERE e.id = p_id_emprendedor
  FOR UPDATE;

  IF NOT FOUND OR v_emprendedor.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Emprendedor no encontrado' USING ERRCODE = 'P0002';
  END IF;

  IF v_emprendedor.updated_at IS DISTINCT FROM p_updated_at_esperado THEN
    RAISE EXCEPTION 'El emprendedor fue modificado por otro usuario'
      USING ERRCODE = 'PT409';
  END IF;

  IF v_emprendedor.estado IS NOT DISTINCT FROM p_estado_nuevo THEN
    RAISE EXCEPTION 'El emprendedor ya tiene el estado solicitado'
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.emprendedores
  SET estado = p_estado_nuevo
  WHERE id = p_id_emprendedor;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se pudo actualizar el emprendedor' USING ERRCODE = 'P0002';
  END IF;
  -- El trigger existente set_updated_at_emprendedores mantiene updated_at.

  INSERT INTO public.auditorias (
    id_usuario_fk, tabla_afectada, accion,
    valor_anterior, valor_nuevo, razon_cambio
  ) VALUES (
    v_actor, 'emprendedores', 'ESTADO_EMPRENDEDOR_CAMBIADO',
    jsonb_build_object('id_emprendedor', p_id_emprendedor, 'estado', v_emprendedor.estado),
    jsonb_build_object('id_emprendedor', p_id_emprendedor, 'estado', p_estado_nuevo),
    v_justificacion
  );

  RETURN p_id_emprendedor;
END;
$function$;
CREATE OR REPLACE FUNCTION public.sigre_admin_crear_emprendedor(p_usuario_id uuid, p_nombre_completo text, p_id_centro_sena uuid, p_programa_formacion text DEFAULT NULL::text, p_nivel_formacion text DEFAULT NULL::text, p_tipo_emprendedor text DEFAULT NULL::text, p_segmentacion text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_usuario public.usuarios%ROWTYPE;
  v_centro_nombre text;
  v_emprendedor_id uuid;
  v_nombre text;
BEGIN
  -- 1. Autorizar administrador
  IF auth.uid() IS NULL
     OR NOT COALESCE(public.tiene_rol('administrador'), false)
     OR NOT COALESCE(public.tiene_permiso('emprendedores', 'crear'), false)
  THEN
    RAISE EXCEPTION
      'No autorizado para registrar emprendedores'
      USING ERRCODE = '42501';
  END IF;

  -- 2. Validar campos obligatorios
  v_nombre := NULLIF(btrim(p_nombre_completo), '');

  IF p_usuario_id IS NULL
     OR v_nombre IS NULL
     OR p_id_centro_sena IS NULL
  THEN
    RAISE EXCEPTION
      'Datos obligatorios incompletos'
      USING ERRCODE = '22023';
  END IF;

  -- 3. Bloquear usuario durante registro
  SELECT u.*
  INTO v_usuario
  FROM public.usuarios u
  WHERE u.id = p_usuario_id
  FOR UPDATE;

  IF NOT FOUND
     OR v_usuario.estado IS DISTINCT FROM 'activo'
     OR v_usuario.deleted_at IS NOT NULL
  THEN
    RAISE EXCEPTION 'Usuario no elegible'
      USING ERRCODE = '22023';
  END IF;

  -- 4. Exigir rol emprendedor activo
  IF NOT EXISTS (
    SELECT 1
    FROM public.usuario_roles ur
    JOIN public.roles r
      ON r.id = ur.id_rol_fk
    WHERE ur.id_usuario_fk = p_usuario_id
      AND ur.estado = 'activo'
      AND ur.deleted_at IS NULL
      AND r.nombre_rol = 'emprendedor'
      AND r.estado = 'activo'
      AND r.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Usuario no elegible'
      USING ERRCODE = '22023';
  END IF;

  -- 5. Rechazar roles incompatibles
  IF EXISTS (
    SELECT 1
    FROM public.usuario_roles ur
    JOIN public.roles r
      ON r.id = ur.id_rol_fk
    WHERE ur.id_usuario_fk = p_usuario_id
      AND ur.estado = 'activo'
      AND ur.deleted_at IS NULL
      AND r.estado = 'activo'
      AND r.deleted_at IS NULL
      AND r.nombre_rol IN (
        'administrador',
        'coordinador',
        'orientador',
        'evaluador'
      )
  ) THEN
    RAISE EXCEPTION 'Usuario no elegible'
      USING ERRCODE = '22023';
  END IF;

  -- 6. No permitir registro duplicado
  IF EXISTS (
    SELECT 1
    FROM public.emprendedores e
    WHERE e.usuario_id = p_usuario_id
  ) THEN
    RAISE EXCEPTION 'Usuario ya vinculado'
      USING ERRCODE = '23505';
  END IF;

  -- 7. Centro y regional activos
  SELECT c.nombre
  INTO v_centro_nombre
  FROM public.sena_centros c
  JOIN public.sena_regionales r
    ON r.id = c.id_regional_fk
  WHERE c.id = p_id_centro_sena
    AND c.estado = 'activo'
    AND c.deleted_at IS NULL
    AND r.estado = 'activo'
    AND r.deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Centro SENA no valido'
      USING ERRCODE = '23503';
  END IF;

  -- 8. Crear registro
  INSERT INTO public.emprendedores (
    usuario_id,
    nombre_completo,
    id_centro_sena_fk,
    centro_sena,
    programa_formacion,
    nivel_formacion,
    tipo_emprendedor,
    segmentacion,
    id_orientador_fk,
    estado
  )
  VALUES (
    p_usuario_id,
    v_nombre,
    p_id_centro_sena,
    v_centro_nombre,
    NULLIF(btrim(p_programa_formacion), ''),
    NULLIF(btrim(p_nivel_formacion), ''),
    NULLIF(btrim(p_tipo_emprendedor), ''),
    NULLIF(btrim(p_segmentacion), ''),
    NULL,
    'activo'
  )
  RETURNING id INTO v_emprendedor_id;

  RETURN v_emprendedor_id;

EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Usuario ya vinculado'
      USING ERRCODE = '23505';
END;
$function$;
CREATE OR REPLACE FUNCTION public.sigre_admin_crear_proyecto(p_id_emprendedor uuid, p_titulo text, p_descripcion text DEFAULT NULL::text, p_sector_economico text DEFAULT NULL::text, p_problema_oportunidad text DEFAULT NULL::text, p_propuesta_valor text DEFAULT NULL::text, p_observaciones text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
    v_proyecto_id uuid;
BEGIN
    -- 1. Validar autorización administrativa.
    IF auth.uid() IS NULL
       OR NOT public.tiene_rol('administrador')
       OR NOT public.tiene_permiso('proyectos', 'crear')
    THEN
        RAISE EXCEPTION
            'No tiene autorización para crear proyectos'
            USING ERRCODE = '42501';
    END IF;

    -- 2. Validar título.
    IF p_titulo IS NULL
       OR btrim(p_titulo) = ''
    THEN
        RAISE EXCEPTION
            'El título del proyecto es obligatorio'
            USING ERRCODE = '23514';
    END IF;

    -- 3. Validar emprendedor activo.
    IF p_id_emprendedor IS NULL
       OR NOT EXISTS (
           SELECT 1
           FROM public.emprendedores e
           WHERE e.id = p_id_emprendedor
             AND e.estado = 'activo'
             AND e.deleted_at IS NULL
       )
    THEN
        RAISE EXCEPTION
            'Debe seleccionar un emprendedor activo'
            USING ERRCODE = '23514';
    END IF;

    -- 4. Crear el proyecto con valores controlados.
    INSERT INTO public.proyectos (
        id_emprendedor_fk,
        titulo,
        descripcion,
        sector_economico,
        problema_oportunidad,
        propuesta_valor,
        observaciones,
        estado_proyecto,
        etapa_actual,
        deleted_at
    )
    VALUES (
        p_id_emprendedor,
        btrim(p_titulo),
        p_descripcion,
        p_sector_economico,
        p_problema_oportunidad,
        p_propuesta_valor,
        p_observaciones,
        'borrador',
        NULL,
        NULL
    )
    RETURNING id INTO v_proyecto_id;

    RETURN v_proyecto_id;
END;
$function$;
CREATE OR REPLACE FUNCTION public.sigre_admin_editar_emprendedor(p_id_emprendedor uuid, p_updated_at_esperado timestamp with time zone, p_nombre_completo text, p_id_centro_sena uuid, p_programa_formacion text DEFAULT NULL::text, p_nivel_formacion text DEFAULT NULL::text, p_tipo_emprendedor text DEFAULT NULL::text, p_segmentacion text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    v_emprendedor public.emprendedores%ROWTYPE;
    v_centro_nombre text;
    v_nombre text;
BEGIN
    -- 1. Autenticacion, rol y permiso
    IF auth.uid() IS NULL
       OR NOT COALESCE(
           public.tiene_rol('administrador'), false
       )
       OR NOT COALESCE(
           public.tiene_permiso('emprendedores', 'editar'),
           false
       )
    THEN
        RAISE EXCEPTION
            'No autorizado para editar emprendedores'
            USING ERRCODE = '42501';
    END IF;

    -- 2. Validar campos obligatorios
    v_nombre := NULLIF(
        btrim(p_nombre_completo), ''
    );

    IF p_id_emprendedor IS NULL
       OR p_updated_at_esperado IS NULL
       OR v_nombre IS NULL
       OR p_id_centro_sena IS NULL
    THEN
        RAISE EXCEPTION
            'Datos obligatorios incompletos'
            USING ERRCODE = '22023';
    END IF;

    -- 3. Bloquear registro durante la edicion
    SELECT e.*
    INTO v_emprendedor
    FROM public.emprendedores e
    WHERE e.id = p_id_emprendedor
    FOR UPDATE;

    IF NOT FOUND
       OR v_emprendedor.deleted_at IS NOT NULL
    THEN
        RAISE EXCEPTION
            'Emprendedor no encontrado'
            USING ERRCODE = 'P0002';
    END IF;

    -- 4. Control de concurrencia
    IF v_emprendedor.updated_at IS DISTINCT FROM
       p_updated_at_esperado
    THEN
        RAISE EXCEPTION
            'El emprendedor fue modificado por otro usuario'
            USING ERRCODE = 'PT409';
    END IF;

    -- 5. Validar centro SENA y regional
    SELECT c.nombre
    INTO v_centro_nombre
    FROM public.sena_centros c
    JOIN public.sena_regionales r
      ON r.id = c.id_regional_fk
    WHERE c.id = p_id_centro_sena
      AND c.estado = 'activo'
      AND c.deleted_at IS NULL
      AND r.estado = 'activo'
      AND r.deleted_at IS NULL
    FOR SHARE OF c, r;

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'Centro SENA no valido'
            USING ERRCODE = '23503';
    END IF;

    -- 6. Actualizar exclusivamente campos autorizados
    UPDATE public.emprendedores
    SET
        nombre_completo = v_nombre,
        id_centro_sena_fk = p_id_centro_sena,
        centro_sena = v_centro_nombre,
        programa_formacion = NULLIF(
            btrim(p_programa_formacion), ''
        ),
        nivel_formacion = NULLIF(
            btrim(p_nivel_formacion), ''
        ),
        tipo_emprendedor = NULLIF(
            btrim(p_tipo_emprendedor), ''
        ),
        segmentacion = NULLIF(
            btrim(p_segmentacion), ''
        )
    WHERE id = p_id_emprendedor;

    -- updated_at lo actualiza el trigger existente.
    RETURN p_id_emprendedor;
END;
$function$;
CREATE OR REPLACE FUNCTION public.sigre_admin_editar_proyecto(p_id_proyecto uuid, p_updated_at_esperado timestamp with time zone, p_titulo text, p_descripcion text DEFAULT NULL::text, p_sector_economico text DEFAULT NULL::text, p_problema_oportunidad text DEFAULT NULL::text, p_propuesta_valor text DEFAULT NULL::text, p_observaciones text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
    v_proyecto public.proyectos%ROWTYPE;
    v_id uuid;
BEGIN
    -- 1. Autenticación, rol y permiso
    IF auth.uid() IS NULL
       OR NOT public.tiene_rol('administrador')
       OR NOT public.tiene_permiso('proyectos', 'editar')
    THEN
        RAISE EXCEPTION
            'No tiene autorización para editar proyectos'
            USING ERRCODE = '42501';
    END IF;

    -- 2. Identificador obligatorio
    IF p_id_proyecto IS NULL THEN
        RAISE EXCEPTION
            'Debe indicar el proyecto'
            USING ERRCODE = '23514';
    END IF;

    -- 3. Versión obligatoria
    IF p_updated_at_esperado IS NULL THEN
        RAISE EXCEPTION
            'Debe indicar la versión del proyecto'
            USING ERRCODE = '23514';
    END IF;

    -- 4. Título válido
    IF p_titulo IS NULL
       OR btrim(p_titulo) = ''
    THEN
        RAISE EXCEPTION
            'El título del proyecto es obligatorio'
            USING ERRCODE = '23514';
    END IF;

    -- 5. Bloquear exclusivamente el proyecto solicitado
    SELECT *
    INTO v_proyecto
    FROM public.proyectos
    WHERE id = p_id_proyecto
      AND deleted_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'Proyecto no encontrado o eliminado'
            USING ERRCODE = 'P0002';
    END IF;

    -- 6. Evitar sobrescribir cambios de otra sesión
    IF v_proyecto.updated_at
       IS DISTINCT FROM p_updated_at_esperado
    THEN
        RAISE EXCEPTION
            'El proyecto fue modificado. Actualice la información antes de guardar.'
            USING ERRCODE = '40001';
    END IF;

    -- 7. Actualizar únicamente columnas autorizadas
    UPDATE public.proyectos
    SET
        titulo = btrim(p_titulo),
        descripcion = NULLIF(btrim(p_descripcion), ''),
        sector_economico = NULLIF(btrim(p_sector_economico), ''),
        problema_oportunidad =
            NULLIF(btrim(p_problema_oportunidad), ''),
        propuesta_valor =
            NULLIF(btrim(p_propuesta_valor), ''),
        observaciones =
            NULLIF(btrim(p_observaciones), '')
    WHERE id = p_id_proyecto
      AND deleted_at IS NULL
    RETURNING id INTO v_id;

    IF v_id IS NULL THEN
        RAISE EXCEPTION
            'No fue posible actualizar el proyecto'
            USING ERRCODE = 'P0002';
    END IF;

    RETURN v_id;
END;
$function$;
CREATE OR REPLACE FUNCTION public.sigre_admin_eliminar_proyecto(p_id_proyecto uuid, p_updated_at_esperado timestamp with time zone)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    v_proyecto public.proyectos%ROWTYPE;
    v_id uuid;
BEGIN

    -- Identidad, rol y permiso
    IF auth.uid() IS NULL
       OR NOT public.tiene_rol('administrador')
       OR NOT public.tiene_permiso('proyectos', 'eliminar')
    THEN
        RAISE EXCEPTION
            'No tiene autorización para eliminar proyectos'
            USING ERRCODE = '42501';
    END IF;

    -- Validación de parámetros
    IF p_id_proyecto IS NULL THEN
        RAISE EXCEPTION
            'Debe indicar el proyecto'
            USING ERRCODE = '23514';
    END IF;

    IF p_updated_at_esperado IS NULL THEN
        RAISE EXCEPTION
            'Debe indicar la versión del proyecto'
            USING ERRCODE = '23514';
    END IF;

    -- Bloquear registro
    SELECT *
    INTO v_proyecto
    FROM public.proyectos
    WHERE id = p_id_proyecto
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'Proyecto no encontrado'
            USING ERRCODE = 'P0002';
    END IF;

    IF v_proyecto.deleted_at IS NOT NULL THEN
        RAISE EXCEPTION
            'El proyecto ya fue eliminado'
            USING ERRCODE = '23514';
    END IF;

    -- Control de concurrencia
    IF v_proyecto.updated_at
       IS DISTINCT FROM p_updated_at_esperado
    THEN
        RAISE EXCEPTION
            'El proyecto fue modificado. Actualice antes de eliminar.'
            USING ERRCODE = '40001';
    END IF;

    -- Eliminación lógica
    UPDATE public.proyectos
    SET deleted_at = now()
    WHERE id = p_id_proyecto
      AND deleted_at IS NULL
    RETURNING id INTO v_id;

    IF v_id IS NULL THEN
        RAISE EXCEPTION
            'No fue posible eliminar el proyecto'
            USING ERRCODE = 'P0002';
    END IF;

    RETURN v_id;

END;
$function$;
CREATE OR REPLACE FUNCTION public.sigre_e513_validar_inscripcion_activa()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF NEW.id_emprendedor_fk IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.emprendedores e
    WHERE e.id = NEW.id_emprendedor_fk AND e.estado='activo' AND e.deleted_at IS NULL
    FOR SHARE
  ) THEN
    RAISE EXCEPTION 'E5-13: inscripcion requiere emprendedor activo'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.sigre_e513_validar_proyecto_activo()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF NEW.id_emprendedor_fk IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.emprendedores e
    WHERE e.id = NEW.id_emprendedor_fk
      AND e.estado = 'activo'
      AND e.deleted_at IS NULL
    FOR SHARE OF e
  ) THEN
    RAISE EXCEPTION 'E5-13: proyecto nuevo requiere emprendedor activo'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.sigre_emprendedor_editar_mi_ficha(p_id_emprendedor uuid, p_updated_at_esperado timestamp with time zone, p_nombre_completo text, p_numero_telefono text, p_programa_formacion text, p_nivel_formacion text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    v_actor uuid := auth.uid();
    v_e public.emprendedores%ROWTYPE;
    v_nombre text;
    v_telefono_anterior text;
    v_telefono_nuevo text;
BEGIN
    IF v_actor IS NULL
       OR NOT COALESCE(public.tiene_rol('emprendedor'), false)
       OR NOT COALESCE(
           public.tiene_permiso('emprendedores', 'editar'),
           false
       )
    THEN
        RAISE EXCEPTION 'No autorizado'
            USING ERRCODE = '42501';
    END IF;

    v_nombre := NULLIF(btrim(p_nombre_completo), '');
    v_telefono_nuevo :=
        NULLIF(btrim(p_numero_telefono), '');

    IF p_id_emprendedor IS NULL
       OR p_updated_at_esperado IS NULL
       OR v_nombre IS NULL
    THEN
        RAISE EXCEPTION 'Datos obligatorios incompletos'
            USING ERRCODE = '22023';
    END IF;

    IF v_telefono_nuevo IS NOT NULL
       AND (
           length(v_telefono_nuevo) NOT BETWEEN 7 AND 20
           OR v_telefono_nuevo !~ '^[0-9+() -]+$'
       )
    THEN
        RAISE EXCEPTION 'Telefono no valido'
            USING ERRCODE = '22023';
    END IF;

    SELECT *
    INTO v_e
    FROM public.emprendedores
    WHERE id = p_id_emprendedor
    FOR UPDATE;

    IF NOT FOUND OR v_e.deleted_at IS NOT NULL THEN
        RAISE EXCEPTION 'Emprendedor no encontrado'
            USING ERRCODE = 'P0002';
    END IF;

    IF v_e.usuario_id IS DISTINCT FROM v_actor THEN
        RAISE EXCEPTION 'No autorizado para editar esta ficha'
            USING ERRCODE = '42501';
    END IF;

    IF v_e.estado IS DISTINCT FROM 'activo' THEN
        RAISE EXCEPTION 'Emprendedor inactivo'
            USING ERRCODE = '23514';
    END IF;

    IF v_e.updated_at IS DISTINCT FROM p_updated_at_esperado THEN
        RAISE EXCEPTION 'Registro modificado por otro usuario'
            USING ERRCODE = 'PT409';
    END IF;

    SELECT numero_telefono
    INTO v_telefono_anterior
    FROM public.usuarios
    WHERE id = v_actor
      AND estado = 'activo'
      AND deleted_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Usuario no disponible'
            USING ERRCODE = '23514';
    END IF;

    UPDATE public.emprendedores
    SET
        nombre_completo = v_nombre,
        programa_formacion =
            NULLIF(btrim(p_programa_formacion), ''),
        nivel_formacion =
            NULLIF(btrim(p_nivel_formacion), '')
    WHERE id = p_id_emprendedor;

    UPDATE public.usuarios
    SET numero_telefono = v_telefono_nuevo
    WHERE id = v_actor;

    INSERT INTO public.auditorias (
        id_usuario_fk,
        tabla_afectada,
        accion,
        valor_anterior,
        valor_nuevo,
        razon_cambio
    )
    VALUES (
        v_actor,
        'emprendedores',
        'EDICION_PROPIA_FICHA',
        jsonb_build_object(
            'id_emprendedor', v_e.id,
            'nombre_completo', v_e.nombre_completo,
            'telefono', v_telefono_anterior,
            'programa_formacion', v_e.programa_formacion,
            'nivel_formacion', v_e.nivel_formacion
        ),
        jsonb_build_object(
            'id_emprendedor', v_e.id,
            'nombre_completo', v_nombre,
            'telefono', v_telefono_nuevo,
            'programa_formacion', p_programa_formacion,
            'nivel_formacion', p_nivel_formacion
        ),
        'Actualizacion de ficha propia'
    );

    RETURN v_e.id;
END;
$function$;
CREATE OR REPLACE FUNCTION public.sigre_listar_centros_sena_activos()
 RETURNS TABLE(id uuid, codigo text, nombre text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF auth.uid() IS NULL
     OR NOT COALESCE(public.tiene_rol('administrador'), false)
     OR NOT COALESCE(public.tiene_permiso('emprendedores', 'crear'), false)
  THEN
    RAISE EXCEPTION 'No autorizado'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT c.id, c.codigo, c.nombre
  FROM public.sena_centros c
  JOIN public.sena_regionales r
    ON r.id = c.id_regional_fk
  WHERE c.estado = 'activo'
    AND c.deleted_at IS NULL
    AND r.estado = 'activo'
    AND r.deleted_at IS NULL
  ORDER BY c.nombre, c.codigo;
END;
$function$;
CREATE OR REPLACE FUNCTION public.sigre_listar_inscritos_asistencia(p_orientacion_id uuid)
 RETURNS TABLE(id_inscripcion uuid, id_emprendedor_fk uuid, nombre_completo text, estado_asistencia text, observacion text, confirmado_at timestamp with time zone, registrado_por_usuario_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_orientador uuid;
BEGIN
  IF v_actor IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.usuarios u
    WHERE u.id = v_actor AND u.estado = 'activo' AND u.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Usuario no autenticado o inactivo' USING ERRCODE = '42501';
  END IF;

  IF p_orientacion_id IS NULL THEN
    RAISE EXCEPTION 'Identificador de jornada obligatorio' USING ERRCODE = '22023';
  END IF;

  SELECT o.id_orientador_fk INTO v_orientador
  FROM public.orientaciones o
  WHERE o.id = p_orientacion_id AND o.deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Jornada no encontrada o archivada' USING ERRCODE = '22023';
  END IF;

  IF NOT COALESCE(
    public.tiene_rol('administrador')
    OR (
      public.tiene_rol('orientador')
      AND public.tiene_permiso('orientaciones', 'ver')
      AND v_orientador = v_actor
    ),
    FALSE
  ) THEN
    RAISE EXCEPTION 'Consulta de inscritos no autorizada' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT i.id,
         i.id_emprendedor_fk,
         e.nombre_completo,
         a.estado_asistencia,
         a.observacion,
         a.confirmado_at,
         a.registrado_por_usuario_id
  FROM public.orientacion_inscripciones i
  JOIN public.emprendedores e ON e.id = i.id_emprendedor_fk
  LEFT JOIN public.asistencias a
    ON a.id_orientacion_fk = i.id_orientacion_fk
   AND a.id_emprendedor_fk = i.id_emprendedor_fk
   AND a.deleted_at IS NULL
  WHERE i.id_orientacion_fk = p_orientacion_id
    AND i.estado = 'inscrito'
    AND i.deleted_at IS NULL
    AND e.deleted_at IS NULL
  ORDER BY e.nombre_completo NULLS LAST, i.id;
END;
$function$;
CREATE OR REPLACE FUNCTION public.sigre_listar_orientadores_elegibles()
 RETURNS TABLE(id uuid, nombre text, correo text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
    IF auth.uid() IS NULL
       OR NOT EXISTS (
           SELECT 1
           FROM public.usuarios u
           WHERE u.id = auth.uid()
             AND u.estado = 'activo'
             AND u.deleted_at IS NULL
       )
       OR NOT COALESCE(public.tiene_rol('administrador'), false)
       OR NOT COALESCE(
           public.tiene_permiso('emprendedores', 'editar'),
           false
       )
    THEN
        RAISE EXCEPTION 'No autorizado para consultar orientadores'
            USING ERRCODE = '42501';
    END IF;

    RETURN QUERY
    SELECT DISTINCT
        u.id,
        concat_ws(
            ' ',
            NULLIF(btrim(u.primer_nombre), ''),
            NULLIF(btrim(u.segundo_nombre), ''),
            NULLIF(btrim(u.primer_apellido), ''),
            NULLIF(btrim(u.segundo_apellido), '')
        )::text AS nombre,
        u.correo_electronico::text AS correo
    FROM public.usuarios u
    JOIN public.usuario_roles ur
      ON ur.id_usuario_fk = u.id
    JOIN public.roles r
      ON r.id = ur.id_rol_fk
    WHERE u.estado = 'activo'
      AND u.deleted_at IS NULL
      AND ur.estado = 'activo'
      AND ur.deleted_at IS NULL
      AND r.nombre_rol = 'orientador'
      AND r.estado = 'activo'
      AND r.deleted_at IS NULL
    ORDER BY nombre, correo, id;
END;
$function$;
CREATE OR REPLACE FUNCTION public.sigre_listar_usuarios_elegibles_emprendedor()
 RETURNS TABLE(usuario_id uuid, nombre_completo text, correo_electronico text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
    -- Solo usuarios autenticados con rol Administrador.
    IF auth.uid() IS NULL
       OR NOT COALESCE(
           public.tiene_rol('administrador'),
           FALSE
       )
    THEN
        RAISE EXCEPTION
            'No tiene autorización para consultar usuarios elegibles'
            USING ERRCODE = '42501';
    END IF;

    RETURN QUERY
    SELECT
        u.id,
        CONCAT_WS(
            ' ',
            NULLIF(BTRIM(u.primer_nombre), ''),
            NULLIF(BTRIM(u.segundo_nombre), ''),
            NULLIF(BTRIM(u.primer_apellido), ''),
            NULLIF(BTRIM(u.segundo_apellido), '')
        )::text AS nombre_completo,
        u.correo_electronico
    FROM public.usuarios u
    WHERE u.estado = 'activo'
      AND u.deleted_at IS NULL

      -- Debe tener rol Emprendedor activo.
      AND EXISTS (
          SELECT 1
          FROM public.usuario_roles ur
          JOIN public.roles r
            ON r.id = ur.id_rol_fk
          WHERE ur.id_usuario_fk = u.id
            AND ur.estado = 'activo'
            AND ur.deleted_at IS NULL
            AND r.nombre_rol = 'emprendedor'
            AND r.estado = 'activo'
            AND r.deleted_at IS NULL
      )

      -- No debe tener roles administrativos o incompatibles.
      AND NOT EXISTS (
          SELECT 1
          FROM public.usuario_roles ur
          JOIN public.roles r
            ON r.id = ur.id_rol_fk
          WHERE ur.id_usuario_fk = u.id
            AND ur.estado = 'activo'
            AND ur.deleted_at IS NULL
            AND r.estado = 'activo'
            AND r.deleted_at IS NULL
            AND r.nombre_rol IN (
                'administrador',
                'coordinador',
                'orientador',
                'evaluador'
            )
      )

      -- No debe tener ningún registro previo de emprendedor.
      AND NOT EXISTS (
          SELECT 1
          FROM public.emprendedores e
          WHERE e.usuario_id = u.id
      )
    ORDER BY nombre_completo, u.correo_electronico;
END;
$function$;
CREATE OR REPLACE FUNCTION public.sigre_orientador_editar_emprendedor(p_id_emprendedor uuid, p_updated_at_esperado timestamp with time zone, p_numero_telefono text, p_programa_formacion text, p_nivel_formacion text, p_tipo_emprendedor text, p_segmentacion text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    v_actor uuid := auth.uid();
    v_e public.emprendedores%ROWTYPE;
    v_telefono_anterior text;
    v_telefono_nuevo text;
BEGIN
    -- Autenticacion y autorizacion
    IF v_actor IS NULL
       OR NOT COALESCE(public.tiene_rol('orientador'), false)
       OR NOT COALESCE(
           public.tiene_permiso('emprendedores', 'editar'),
           false
       )
    THEN
        RAISE EXCEPTION 'No autorizado'
            USING ERRCODE = '42501';
    END IF;

    IF p_id_emprendedor IS NULL
       OR p_updated_at_esperado IS NULL
    THEN
        RAISE EXCEPTION 'Identificador y version obligatorios'
            USING ERRCODE = '22023';
    END IF;

    v_telefono_nuevo :=
        NULLIF(btrim(p_numero_telefono), '');

    IF v_telefono_nuevo IS NOT NULL
       AND (
           length(v_telefono_nuevo) NOT BETWEEN 7 AND 20
           OR v_telefono_nuevo !~ '^[0-9+() -]+$'
       )
    THEN
        RAISE EXCEPTION 'Telefono no valido'
            USING ERRCODE = '22023';
    END IF;

    -- Bloqueo y verificacion de alcance
    SELECT *
    INTO v_e
    FROM public.emprendedores
    WHERE id = p_id_emprendedor
    FOR UPDATE;

    IF NOT FOUND OR v_e.deleted_at IS NOT NULL THEN
        RAISE EXCEPTION 'Emprendedor no encontrado'
            USING ERRCODE = 'P0002';
    END IF;

    IF v_e.id_orientador_fk IS DISTINCT FROM v_actor THEN
        RAISE EXCEPTION 'Emprendedor no asignado'
            USING ERRCODE = '42501';
    END IF;

    IF v_e.estado IS DISTINCT FROM 'activo' THEN
        RAISE EXCEPTION 'Emprendedor inactivo'
            USING ERRCODE = '23514';
    END IF;

    IF v_e.updated_at IS DISTINCT FROM p_updated_at_esperado THEN
        RAISE EXCEPTION 'Registro modificado por otro usuario'
            USING ERRCODE = 'PT409';
    END IF;

    -- Bloquear usuario vinculado y validar estado
    SELECT numero_telefono
    INTO v_telefono_anterior
    FROM public.usuarios
    WHERE id = v_e.usuario_id
      AND estado = 'activo'
      AND deleted_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Usuario vinculado no disponible'
            USING ERRCODE = '23514';
    END IF;

    -- Actualizar exclusivamente campos autorizados
    UPDATE public.emprendedores
    SET
        programa_formacion =
            NULLIF(btrim(p_programa_formacion), ''),
        nivel_formacion =
            NULLIF(btrim(p_nivel_formacion), ''),
        tipo_emprendedor =
            NULLIF(btrim(p_tipo_emprendedor), ''),
        segmentacion =
            NULLIF(btrim(p_segmentacion), '')
    WHERE id = p_id_emprendedor;

    UPDATE public.usuarios
    SET numero_telefono = v_telefono_nuevo
    WHERE id = v_e.usuario_id;

    -- Auditoria
    INSERT INTO public.auditorias (
        id_usuario_fk,
        tabla_afectada,
        accion,
        valor_anterior,
        valor_nuevo,
        razon_cambio
    )
    VALUES (
        v_actor,
        'emprendedores',
        'EDICION_ORIENTADOR',
        jsonb_build_object(
            'id_emprendedor', v_e.id,
            'telefono', v_telefono_anterior,
            'programa_formacion', v_e.programa_formacion,
            'nivel_formacion', v_e.nivel_formacion,
            'tipo_emprendedor', v_e.tipo_emprendedor,
            'segmentacion', v_e.segmentacion
        ),
        jsonb_build_object(
            'id_emprendedor', v_e.id,
            'telefono', v_telefono_nuevo,
            'programa_formacion', p_programa_formacion,
            'nivel_formacion', p_nivel_formacion,
            'tipo_emprendedor', p_tipo_emprendedor,
            'segmentacion', p_segmentacion
        ),
        'Actualizacion por orientador asignado'
    );

    RETURN v_e.id;
END;
$function$;
CREATE OR REPLACE FUNCTION public.sigre_proteger_asignaciones_emprendedor()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
    IF (
        OLD.usuario_id IS DISTINCT FROM NEW.usuario_id
        OR OLD.id_orientador_fk IS DISTINCT FROM NEW.id_orientador_fk
        OR OLD.id_centro_sena_fk IS DISTINCT FROM NEW.id_centro_sena_fk
    )
    AND NOT public.tiene_rol('administrador')
    THEN
        RAISE EXCEPTION
            'No tiene autorización para modificar las asignaciones del emprendedor'
            USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.sigre_proteger_orientador_orientacion()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
    IF OLD.id_orientador_fk
       IS DISTINCT FROM NEW.id_orientador_fk
       AND NOT public.tiene_rol('administrador')
    THEN
        RAISE EXCEPTION
            'No tiene autorización para cambiar el orientador de la orientación'
            USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.sigre_proteger_propiedad_proyecto()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
    IF OLD.id_emprendedor_fk
       IS DISTINCT FROM NEW.id_emprendedor_fk
       AND NOT public.tiene_rol('administrador')
    THEN
        RAISE EXCEPTION
            'No tiene autorización para cambiar el emprendedor propietario del proyecto'
            USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.sigre_proteger_relaciones_asistencia()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
    IF (
        OLD.id_orientacion_fk
            IS DISTINCT FROM NEW.id_orientacion_fk
        OR
        OLD.id_emprendedor_fk
            IS DISTINCT FROM NEW.id_emprendedor_fk
    )
    AND NOT public.tiene_rol('administrador')
    THEN
        RAISE EXCEPTION
            'No tiene autorización para modificar las relaciones de asistencia'
            USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.sigre_puede_ver_asistencia_fila(p_orientacion uuid, p_emprendedor uuid, p_deleted_at timestamp with time zone)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
    SELECT p_deleted_at IS NULL
       AND EXISTS (
           SELECT 1
           FROM public.orientaciones o
           JOIN public.emprendedores e
             ON e.id = p_emprendedor
           WHERE o.id = p_orientacion
             AND o.deleted_at IS NULL
             AND e.deleted_at IS NULL
             AND (
                 public.tiene_rol('administrador')

                 OR (
                     public.tiene_rol('orientador')
                     AND o.id_orientador_fk = auth.uid()
                 )

                 OR (
                     public.tiene_rol('emprendedor')
                     AND e.usuario_id = auth.uid()
                 )

                 OR (
                     public.tiene_rol('coordinador')
                     AND public.coordinador_puede_ver_centro(
                         e.id_centro_sena_fk
                     )
                 )
             )
       );
$function$;
CREATE OR REPLACE FUNCTION public.sigre_puede_ver_orientacion_fila(p_id uuid, p_orientador uuid, p_deleted_at timestamp with time zone)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
    SELECT p_deleted_at IS NULL
       AND (
           public.tiene_rol('administrador')

           OR (
               public.tiene_rol('orientador')
               AND p_orientador = auth.uid()
           )

           OR (
               public.tiene_rol('emprendedor')
               AND (
                   EXISTS (
                       SELECT 1
                       FROM public.asistencias a
                       JOIN public.emprendedores e
                         ON e.id = a.id_emprendedor_fk
                       WHERE a.id_orientacion_fk = p_id
                         AND a.deleted_at IS NULL
                         AND e.deleted_at IS NULL
                         AND e.usuario_id = auth.uid()
                   )
                   OR EXISTS (
                       SELECT 1
                       FROM public.orientacion_inscripciones i
                       JOIN public.emprendedores e
                         ON e.id = i.id_emprendedor_fk
                       WHERE i.id_orientacion_fk = p_id
                         AND i.deleted_at IS NULL
                         AND e.deleted_at IS NULL
                         AND e.usuario_id = auth.uid()
                   )
                   OR EXISTS (
                       SELECT 1
                       FROM public.orientaciones o
                       JOIN public.emprendedores e
                         ON e.id_centro_sena_fk = o.id_centro_sena_fk
                       WHERE o.id = p_id
                         AND o.deleted_at IS NULL
                         AND o.estado = 'programada'
                         AND (o.fecha + o.hora_inicio) > (now() AT TIME ZONE 'America/Bogota')
                         AND e.usuario_id = auth.uid()
                         AND e.estado = 'activo'
                         AND e.deleted_at IS NULL
                   )
               )
           )

           OR (
               public.tiene_rol('coordinador')
               AND EXISTS (
                   SELECT 1
                   FROM public.asistencias a
                   JOIN public.emprendedores e
                     ON e.id = a.id_emprendedor_fk
                   WHERE a.id_orientacion_fk = p_id
                     AND a.deleted_at IS NULL
                     AND e.deleted_at IS NULL
                     AND public.coordinador_puede_ver_centro(
                         e.id_centro_sena_fk
                     )
               )
           )
       );
$function$;
CREATE OR REPLACE FUNCTION public.sigre_registrar_asistencia(p_orientacion_id uuid, p_emprendedor_id uuid, p_estado text, p_observacion text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_orientacion public.orientaciones%ROWTYPE;
  v_anterior public.asistencias%ROWTYPE;
  v_id uuid;
  v_asistio boolean;
  v_accion text;
  v_confirmado_at timestamptz := clock_timestamp();
BEGIN
  IF v_actor IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.usuarios u WHERE u.id=v_actor AND u.estado='activo' AND u.deleted_at IS NULL
  ) THEN RAISE EXCEPTION 'Usuario no autenticado o inactivo' USING ERRCODE='42501'; END IF;
  IF p_estado IS NULL OR p_estado NOT IN ('asistio','no_asistio') THEN
    RAISE EXCEPTION 'Estado de asistencia inválido' USING ERRCODE='22023';
  END IF;
  IF p_orientacion_id IS NULL OR p_emprendedor_id IS NULL THEN
    RAISE EXCEPTION 'Identificadores obligatorios' USING ERRCODE='22023';
  END IF;
  -- Bloquea la jornada y serializa las escrituras RPC concurrentes.
  SELECT * INTO v_orientacion FROM public.orientaciones
    WHERE id=p_orientacion_id AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND OR v_orientacion.estado NOT IN ('programada','ejecutada') THEN
    RAISE EXCEPTION 'Jornada no habilitada para asistencia' USING ERRCODE='22023';
  END IF;
  IF NOT COALESCE(
      (public.tiene_rol('administrador') OR
       (public.tiene_rol('orientador')
        AND public.tiene_permiso('orientaciones','editar')
        AND v_orientacion.id_orientador_fk=v_actor)),
      FALSE
    ) THEN
    RAISE EXCEPTION 'Registro de asistencia no autorizado' USING ERRCODE='42501';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.orientacion_inscripciones i
    JOIN public.emprendedores e ON e.id=i.id_emprendedor_fk
    WHERE i.id_orientacion_fk=p_orientacion_id AND i.id_emprendedor_fk=p_emprendedor_id
      AND i.estado='inscrito' AND i.deleted_at IS NULL AND e.deleted_at IS NULL
  ) THEN RAISE EXCEPTION 'Emprendedor sin inscripción activa' USING ERRCODE='22023'; END IF;

  SELECT * INTO v_anterior FROM public.asistencias
    WHERE id_orientacion_fk=p_orientacion_id AND id_emprendedor_fk=p_emprendedor_id
    FOR UPDATE;
  IF FOUND AND v_anterior.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Asistencia archivada: requiere revisión administrativa' USING ERRCODE='22023';
  END IF;
  v_asistio := p_estado='asistio';
  IF v_anterior.id IS NULL THEN
    INSERT INTO public.asistencias(id_orientacion_fk,id_emprendedor_fk,asistio,
      estado_asistencia,observacion,registrado_por_usuario_id,confirmado_at,fecha_registro)
    VALUES(p_orientacion_id,p_emprendedor_id,v_asistio,p_estado,p_observacion,v_actor,
      v_confirmado_at,v_confirmado_at)
    RETURNING id INTO v_id;
    v_accion := 'ASISTENCIA_CREADA';
  ELSE
    UPDATE public.asistencias SET asistio=v_asistio, estado_asistencia=p_estado,
      observacion=p_observacion, registrado_por_usuario_id=v_actor,
      confirmado_at=v_confirmado_at, fecha_registro=v_confirmado_at, updated_at=v_confirmado_at
    WHERE id=v_anterior.id RETURNING id INTO v_id;
    v_accion := 'ASISTENCIA_ACTUALIZADA';
  END IF;
  INSERT INTO public.auditorias(id_usuario_fk,tabla_afectada,accion,valor_anterior,valor_nuevo,razon_cambio)
  VALUES(v_actor,'asistencias',v_accion,
    CASE WHEN v_anterior.id IS NULL THEN NULL ELSE
      jsonb_build_object('id',v_anterior.id,'estado_asistencia',v_anterior.estado_asistencia,
        'asistio',v_anterior.asistio,'observacion',v_anterior.observacion,
        'registrado_por_usuario_id',v_anterior.registrado_por_usuario_id,
        'confirmado_at',v_anterior.confirmado_at) END,
    jsonb_build_object('id',v_id,'id_orientacion_fk',p_orientacion_id,
      'id_emprendedor_fk',p_emprendedor_id,'estado_asistencia',p_estado,
      'asistio',v_asistio,'observacion',p_observacion,'registrado_por_usuario_id',v_actor,
      'confirmado_at',v_confirmado_at),'Confirmación de asistencia en jornada');
  RETURN v_id;
END $function$;
CREATE OR REPLACE FUNCTION public.sigre_validar_columnas_edicion()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
    v_permitidas text[];
    v_cambios text[];
BEGIN
    IF public.tiene_rol('administrador') THEN
        RETURN NEW;
    END IF;

    CASE TG_TABLE_NAME

    WHEN 'emprendedores' THEN

        IF OLD.deleted_at IS NOT NULL
           OR OLD.estado IS DISTINCT FROM 'activo'
        THEN
            RAISE EXCEPTION
                'Emprendedor inactivo o eliminado'
                USING ERRCODE = '23514';
        END IF;

        IF public.tiene_rol('orientador')
           AND public.tiene_permiso(
               'emprendedores', 'editar'
           )
           AND OLD.id_orientador_fk = auth.uid()
        THEN
            v_permitidas := ARRAY[
                'programa_formacion',
                'nivel_formacion',
                'tipo_emprendedor',
                'segmentacion',
                'updated_at'
            ];

        ELSIF public.tiene_rol('emprendedor')
           AND public.tiene_permiso(
               'emprendedores', 'editar'
           )
           AND OLD.usuario_id = auth.uid()
        THEN
            v_permitidas := ARRAY[
                'nombre_completo',
                'programa_formacion',
                'nivel_formacion',
                'updated_at'
            ];

        ELSE
            RAISE EXCEPTION
                'Edicion de emprendedor no autorizada'
                USING ERRCODE = '42501';
        END IF;

    WHEN 'proyectos' THEN

        IF NOT public.tiene_permiso(
            'proyectos', 'editar'
        ) THEN
            RAISE EXCEPTION
                'Edicion de proyecto no autorizada'
                USING ERRCODE = '42501';
        END IF;

        IF public.tiene_rol('orientador')
           AND EXISTS (
               SELECT 1
               FROM public.emprendedores e
               WHERE e.id = OLD.id_emprendedor_fk
                 AND e.id_orientador_fk = auth.uid()
                 AND e.deleted_at IS NULL
           )
        THEN
            v_permitidas := ARRAY[
                'titulo', 'descripcion',
                'sector_economico',
                'problema_oportunidad',
                'propuesta_valor',
                'estado_proyecto',
                'etapa_actual',
                'observaciones',
                'updated_at'
            ];

        ELSIF public.tiene_rol('emprendedor')
           AND EXISTS (
               SELECT 1
               FROM public.emprendedores e
               WHERE e.id = OLD.id_emprendedor_fk
                 AND e.usuario_id = auth.uid()
                 AND e.deleted_at IS NULL
           )
        THEN
            v_permitidas := ARRAY[
                'titulo', 'descripcion',
                'sector_economico',
                'problema_oportunidad',
                'propuesta_valor',
                'updated_at'
            ];

        ELSE
            RAISE EXCEPTION
                'Edicion de proyecto no autorizada'
                USING ERRCODE = '42501';
        END IF;

    WHEN 'orientaciones' THEN

        IF NOT (
            public.tiene_rol('orientador')
            AND public.tiene_permiso(
                'orientaciones', 'editar'
            )
            AND OLD.id_orientador_fk = auth.uid()
        ) THEN
            RAISE EXCEPTION
                'Edicion de orientacion no autorizada'
                USING ERRCODE = '42501';
        END IF;

        v_permitidas := ARRAY[
            'tema', 'descripcion', 'fecha',
            'hora_inicio', 'hora_fin',
            'modalidad', 'lugar_link',
            'fuente', 'audiencia_esperada',
            'estado', 'updated_at'
        ];

    WHEN 'asistencias' THEN

        IF NOT (
            public.tiene_rol('orientador')
            AND public.tiene_permiso(
                'orientaciones', 'editar'
            )
            AND EXISTS (
                SELECT 1
                FROM public.orientaciones o
                JOIN public.emprendedores e
                  ON e.id = OLD.id_emprendedor_fk
                WHERE o.id = OLD.id_orientacion_fk
                  AND o.id_orientador_fk = auth.uid()
                  AND e.id_orientador_fk = auth.uid()
                  AND o.deleted_at IS NULL
                  AND e.deleted_at IS NULL
            )
        ) THEN
            RAISE EXCEPTION
                'Edicion de asistencia no autorizada'
                USING ERRCODE = '42501';
        END IF;

        v_permitidas := ARRAY[
            'asistio',
            'observacion',
            'updated_at'
        ];

    ELSE
        RAISE EXCEPTION
            'Tabla no autorizada'
            USING ERRCODE = '42501';
    END CASE;

    SELECT array_agg(n.key)
    INTO v_cambios
    FROM jsonb_each(to_jsonb(NEW)) n
    JOIN jsonb_each(to_jsonb(OLD)) o
      ON o.key = n.key
    WHERE n.value IS DISTINCT FROM o.value
      AND NOT (n.key = ANY(v_permitidas));

    IF v_cambios IS NOT NULL THEN
        RAISE EXCEPTION
            'Columnas protegidas modificadas: %',
            array_to_string(v_cambios, ', ')
            USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.sigre_validar_creacion_proyecto()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
    -- Validar que el emprendedor exista y esté activo.
    IF NEW.id_emprendedor_fk IS NULL
       OR NOT EXISTS (
           SELECT 1
           FROM public.emprendedores e
           WHERE e.id = NEW.id_emprendedor_fk
             AND e.estado = 'activo'
             AND e.deleted_at IS NULL
       )
    THEN
        RAISE EXCEPTION
            'Debe seleccionar un emprendedor activo'
            USING ERRCODE = '23514';
    END IF;

    -- Validar título.
    IF NEW.titulo IS NULL
       OR btrim(NEW.titulo) = ''
    THEN
        RAISE EXCEPTION
            'El título del proyecto es obligatorio'
            USING ERRCODE = '23514';
    END IF;

    NEW.titulo := btrim(NEW.titulo);

    -- Validar estado inicial.
    IF NEW.estado_proyecto IS DISTINCT FROM 'borrador' THEN
        RAISE EXCEPTION
            'El proyecto debe crearse en estado borrador'
            USING ERRCODE = '23514';
    END IF;

    -- La etapa inicial debe estar vacía.
    IF NEW.etapa_actual IS NOT NULL THEN
        RAISE EXCEPTION
            'La etapa inicial debe estar vacía'
            USING ERRCODE = '23514';
    END IF;

    -- Solo Administrador y Orientador pueden
    -- establecer observaciones durante la creación.
    IF NEW.observaciones IS NOT NULL
       AND NOT (
           public.tiene_rol('administrador')
           OR public.tiene_rol('orientador')
       )
    THEN
        RAISE EXCEPTION
            'No tiene autorización para registrar observaciones'
            USING ERRCODE = '42501';
    END IF;

    -- No permitir proyectos eliminados desde su creación.
    IF NEW.deleted_at IS NOT NULL THEN
        RAISE EXCEPTION
            'No se permite crear proyectos eliminados'
            USING ERRCODE = '23514';
    END IF;

    -- Fechas controladas por PostgreSQL.
    NEW.created_at := now();
    NEW.updated_at := now();

    RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.sigre_validar_cupo_jornada()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE v_inscritos bigint;
BEGIN
  IF NEW.cupo IS NOT DISTINCT FROM OLD.cupo THEN RETURN NEW; END IF;
  SELECT count(*) INTO v_inscritos FROM public.orientacion_inscripciones i
  WHERE i.id_orientacion_fk=OLD.id AND i.estado='inscrito' AND i.deleted_at IS NULL;
  IF v_inscritos > 0 AND (NEW.cupo IS NULL OR NEW.cupo < v_inscritos) THEN
    RAISE EXCEPTION 'El cupo no puede ser inferior a las inscripciones activas (%)',v_inscritos USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.sigre_validar_edicion_asistencia_4c()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE v_cambios text[];
BEGIN
  IF auth.uid() IS NULL OR NEW.registrado_por_usuario_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Responsable de asistencia incorrecto' USING ERRCODE='42501';
  END IF;
  IF OLD.deleted_at IS NOT NULL OR NEW.deleted_at IS DISTINCT FROM OLD.deleted_at THEN
    RAISE EXCEPTION 'Asistencia histórica o archivada protegida' USING ERRCODE='42501';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.orientaciones o
    JOIN public.orientacion_inscripciones i ON i.id_orientacion_fk=o.id
    WHERE o.id=OLD.id_orientacion_fk AND o.deleted_at IS NULL
      AND o.estado IN ('programada','ejecutada')
      AND i.id_emprendedor_fk=OLD.id_emprendedor_fk
      AND i.estado='inscrito' AND i.deleted_at IS NULL
      AND (public.tiene_rol('administrador') OR
           (public.tiene_rol('orientador') AND public.tiene_permiso('orientaciones','editar')
            AND o.id_orientador_fk=auth.uid()))
  ) THEN
    RAISE EXCEPTION 'Edición de asistencia no autorizada o sin inscripción activa' USING ERRCODE='42501';
  END IF;
  SELECT array_agg(n.key) INTO v_cambios
  FROM jsonb_each(to_jsonb(NEW)) n JOIN jsonb_each(to_jsonb(OLD)) o ON o.key=n.key
  WHERE n.value IS DISTINCT FROM o.value
    AND n.key <> ALL(ARRAY['asistio','estado_asistencia','observacion',
      'registrado_por_usuario_id','confirmado_at','fecha_registro','updated_at']);
  IF v_cambios IS NOT NULL THEN
    RAISE EXCEPTION 'Columnas protegidas modificadas: %',array_to_string(v_cambios,', ')
      USING ERRCODE='42501';
  END IF;
  IF NEW.estado_asistencia NOT IN ('asistio','no_asistio') OR
     NEW.asistio IS DISTINCT FROM (NEW.estado_asistencia='asistio') OR
     NEW.confirmado_at IS NULL THEN
    RAISE EXCEPTION 'Estado de asistencia inconsistente' USING ERRCODE='22023';
  END IF;
  RETURN NEW;
END $function$;
CREATE OR REPLACE FUNCTION public.tiene_permiso(p_modulo text, p_accion text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
    SELECT EXISTS (
        SELECT 1
        FROM public.usuario_roles ur
        JOIN public.usuarios u
            ON u.id = ur.id_usuario_fk
        JOIN public.roles r
            ON r.id = ur.id_rol_fk
        JOIN public.rol_pantalla_permisos rp
            ON rp.id_rol_fk = r.id
        JOIN public.pantalla_acciones pa
            ON pa.id = rp.id_pantalla_accion_fk
        JOIN public.app_pantallas p
            ON p.id = pa.id_pantalla_fk
        JOIN public.app_modulos m
            ON m.id = p.modulo_id
        JOIN public.app_acciones a
            ON a.id = pa.id_accion_fk
        WHERE ur.id_usuario_fk = (SELECT auth.uid())

          AND u.estado = 'activo'
          AND u.deleted_at IS NULL

          AND ur.estado = 'activo'
          AND ur.deleted_at IS NULL

          AND r.estado = 'activo'
          AND r.deleted_at IS NULL

          AND rp.estado = 'activo'
          AND rp.habilitado IS TRUE

          AND pa.estado = 'activo'

          AND p.estado = 'activo'
          AND p.deleted_at IS NULL

          AND m.deleted_at IS NULL

          AND a.estado = 'activo'
          AND a.deleted_at IS NULL

          AND m.codigo = p_modulo
          AND a.codigo = p_accion

          AND (
              (
                  p_accion IN ('ver', 'exportar')
                  AND rp.nivel_acceso
                      IN ('SL', 'LE', 'AT')
              )
              OR
              (
                  p_accion IN ('crear', 'editar')
                  AND rp.nivel_acceso
                      IN ('LE', 'AT')
              )
              OR
              (
                  p_accion = 'eliminar'
                  AND rp.nivel_acceso = 'AT'
              )
          )
    );
$function$;
CREATE OR REPLACE FUNCTION public.tiene_rol(nombre_rol text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.usuario_roles AS ur
        INNER JOIN public.roles AS r
            ON r.id = ur.id_rol_fk
        INNER JOIN public.usuarios AS u
            ON u.id = ur.id_usuario_fk
        WHERE ur.id_usuario_fk = auth.uid()
          AND LOWER(r.nombre_rol) = LOWER(tiene_rol.nombre_rol)
          AND ur.estado = 'activo'
          AND r.estado = 'activo'
          AND u.estado = 'activo'
          AND ur.deleted_at IS NULL
          AND r.deleted_at IS NULL
          AND u.deleted_at IS NULL
    );
END;
$function$;
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

-- 60 · Row Level Security ----------------------------------------------------------------------------------
ALTER TABLE public.app_acciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_modulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_pantallas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asignacion_evaluadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asistencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calificaciones_pitch ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cargas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coordinador_alcances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cumplimiento_retos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emprendedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.miniperfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.municipios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orientacion_inscripciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orientaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pantalla_acciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permiso_cambios_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pitch ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preparaciones_pitch ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_carga_masiva ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rol_pantalla_permisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rutas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sena_centros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sena_regionales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sigre_invitaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sigre_invitaciones FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sustentacion_retos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuario_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- 70 · Políticas -------------------------------------------------------------------------------------------
CREATE POLICY "Admin acceso total a app_acciones" ON public.app_acciones AS PERMISSIVE FOR ALL TO authenticated
  USING (tiene_rol('administrador'::text));
CREATE POLICY "Admin acceso total a app_modulos" ON public.app_modulos AS PERMISSIVE FOR ALL TO authenticated
  USING (tiene_rol('administrador'::text));
CREATE POLICY "Admin acceso total a app_pantallas" ON public.app_pantallas AS PERMISSIVE FOR ALL TO authenticated
  USING (tiene_rol('administrador'::text));
CREATE POLICY "Admin acceso total a asignacion_evaluadores" ON public.asignacion_evaluadores AS PERMISSIVE FOR ALL TO authenticated
  USING (tiene_rol('administrador'::text));
CREATE POLICY sigre_asistencias_admin_select_4c ON public.asistencias AS PERMISSIVE FOR SELECT TO authenticated
  USING (tiene_rol('administrador'::text));
CREATE POLICY sigre_asistencias_select_autorizado ON public.asistencias AS PERMISSIVE FOR SELECT TO authenticated
  USING ((tiene_permiso('orientaciones'::text, 'ver'::text) AND sigre_puede_ver_asistencia_fila(id_orientacion_fk, id_emprendedor_fk, deleted_at)));
CREATE POLICY sigre_auditorias_admin_select ON public.auditorias AS PERMISSIVE FOR SELECT TO authenticated
  USING (tiene_rol('administrador'::text));
CREATE POLICY "Admin acceso total a calificaciones_pitch" ON public.calificaciones_pitch AS PERMISSIVE FOR ALL TO authenticated
  USING (tiene_rol('administrador'::text));
CREATE POLICY "Admin acceso total a cargas" ON public.cargas AS PERMISSIVE FOR ALL TO authenticated
  USING (tiene_rol('administrador'::text));
CREATE POLICY "Admin acceso total a cumplimiento_retos" ON public.cumplimiento_retos AS PERMISSIVE FOR ALL TO authenticated
  USING (tiene_rol('administrador'::text));
CREATE POLICY "Admin acceso total a emprendedores" ON public.emprendedores AS PERMISSIVE FOR ALL TO authenticated
  USING (tiene_rol('administrador'::text));
CREATE POLICY sigre_emprendedores_select_autorizado ON public.emprendedores AS PERMISSIVE FOR SELECT TO authenticated
  USING ((tiene_permiso('emprendedores'::text, 'ver'::text) AND puede_ver_emprendedor(id)));
CREATE POLICY sigre_emprendedores_update ON public.emprendedores AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((tiene_permiso('emprendedores'::text, 'editar'::text) AND ((tiene_rol('orientador'::text) AND (id_orientador_fk = auth.uid())) OR (tiene_rol('emprendedor'::text) AND (usuario_id = auth.uid()))) AND (deleted_at IS NULL)))
  WITH CHECK ((tiene_permiso('emprendedores'::text, 'editar'::text) AND ((tiene_rol('orientador'::text) AND (id_orientador_fk = auth.uid())) OR (tiene_rol('emprendedor'::text) AND (usuario_id = auth.uid()))) AND (deleted_at IS NULL)));
CREATE POLICY "Admin acceso total a evaluadores" ON public.evaluadores AS PERMISSIVE FOR ALL TO authenticated
  USING (tiene_rol('administrador'::text));
CREATE POLICY "Admin acceso total a miniperfiles" ON public.miniperfiles AS PERMISSIVE FOR ALL TO authenticated
  USING (tiene_rol('administrador'::text));
CREATE POLICY "Admin acceso total a municipios" ON public.municipios AS PERMISSIVE FOR ALL TO authenticated
  USING (tiene_rol('administrador'::text));
CREATE POLICY "Admin acceso total a orientaciones" ON public.orientaciones AS PERMISSIVE FOR ALL TO authenticated
  USING (tiene_rol('administrador'::text));
CREATE POLICY sigre_orientaciones_select_autorizado ON public.orientaciones AS PERMISSIVE FOR SELECT TO authenticated
  USING ((tiene_permiso('orientaciones'::text, 'ver'::text) AND sigre_puede_ver_orientacion_fila(id, id_orientador_fk, deleted_at)));
CREATE POLICY "Admin acceso total a pantalla_acciones" ON public.pantalla_acciones AS PERMISSIVE FOR ALL TO authenticated
  USING (tiene_rol('administrador'::text));
CREATE POLICY "Admin acceso total a permiso_cambios_logs" ON public.permiso_cambios_logs AS PERMISSIVE FOR ALL TO authenticated
  USING (tiene_rol('administrador'::text));
CREATE POLICY "Admin acceso total a pitch" ON public.pitch AS PERMISSIVE FOR ALL TO authenticated
  USING (tiene_rol('administrador'::text));
CREATE POLICY "Admin acceso total a preparaciones_pitch" ON public.preparaciones_pitch AS PERMISSIVE FOR ALL TO authenticated
  USING (tiene_rol('administrador'::text));
CREATE POLICY "Admin acceso total a proyectos" ON public.proyectos AS PERMISSIVE FOR ALL TO authenticated
  USING (tiene_rol('administrador'::text));
CREATE POLICY sigre_proyectos_insert ON public.proyectos AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((tiene_permiso('proyectos'::text, 'crear'::text) AND (id_emprendedor_fk IS NOT NULL) AND ((EXISTS ( SELECT 1
   FROM emprendedores e
  WHERE ((e.id = proyectos.id_emprendedor_fk) AND (e.deleted_at IS NULL) AND (e.usuario_id = auth.uid()) AND tiene_rol('emprendedor'::text)))) OR (EXISTS ( SELECT 1
   FROM emprendedores e
  WHERE ((e.id = proyectos.id_emprendedor_fk) AND (e.deleted_at IS NULL) AND (e.id_orientador_fk = auth.uid()) AND tiene_rol('orientador'::text))))) AND (deleted_at IS NULL)));
CREATE POLICY sigre_proyectos_select_autorizado ON public.proyectos AS PERMISSIVE FOR SELECT TO authenticated
  USING ((tiene_permiso('proyectos'::text, 'ver'::text) AND (deleted_at IS NULL) AND (id_emprendedor_fk IS NOT NULL) AND puede_ver_emprendedor(id_emprendedor_fk)));
CREATE POLICY sigre_proyectos_update ON public.proyectos AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((tiene_permiso('proyectos'::text, 'editar'::text) AND puede_ver_proyecto(id) AND (deleted_at IS NULL)))
  WITH CHECK ((tiene_permiso('proyectos'::text, 'editar'::text) AND puede_ver_proyecto(id) AND (deleted_at IS NULL)));
CREATE POLICY "Admin acceso total a registros_carga_masiva" ON public.registros_carga_masiva AS PERMISSIVE FOR ALL TO authenticated
  USING (tiene_rol('administrador'::text));
CREATE POLICY "Admin acceso total a retos" ON public.retos AS PERMISSIVE FOR ALL TO authenticated
  USING (tiene_rol('administrador'::text));
CREATE POLICY "Admin acceso total a rol_pantalla_permisos" ON public.rol_pantalla_permisos AS PERMISSIVE FOR ALL TO authenticated
  USING (tiene_rol('administrador'::text));
CREATE POLICY "Admin acceso total a roles" ON public.roles AS PERMISSIVE FOR ALL TO authenticated
  USING (tiene_rol('administrador'::text));
CREATE POLICY "Admin acceso total a rutas" ON public.rutas AS PERMISSIVE FOR ALL TO authenticated
  USING (tiene_rol('administrador'::text));
CREATE POLICY sigre_a1_centros_activos_select ON public.sena_centros AS PERMISSIVE FOR SELECT TO authenticated
  USING (((deleted_at IS NULL) AND (( SELECT tiene_rol('administrador'::text) AS tiene_rol) OR ((estado = 'activo'::text) AND (EXISTS ( SELECT 1
   FROM sena_regionales r
  WHERE ((r.id = sena_centros.id_regional_fk) AND (r.estado = 'activo'::text) AND (r.deleted_at IS NULL))))))));
CREATE POLICY sigre_a1_regionales_activas_select ON public.sena_regionales AS PERMISSIVE FOR SELECT TO authenticated
  USING (((deleted_at IS NULL) AND ((estado = 'activo'::text) OR ( SELECT tiene_rol('administrador'::text) AS tiene_rol))));
CREATE POLICY "Admin acceso total a sustentacion_retos" ON public.sustentacion_retos AS PERMISSIVE FOR ALL TO authenticated
  USING (tiene_rol('administrador'::text));
CREATE POLICY "Admin acceso total a usuario_roles" ON public.usuario_roles AS PERMISSIVE FOR ALL TO authenticated
  USING (tiene_rol('administrador'::text));
CREATE POLICY "Admin acceso total a usuarios" ON public.usuarios AS PERMISSIVE FOR ALL TO authenticated
  USING (tiene_rol('administrador'::text));
CREATE POLICY sigre_usuarios_select_propio ON public.usuarios AS PERMISSIVE FOR SELECT TO authenticated
  USING (((id = ( SELECT auth.uid() AS uid)) AND (estado = 'activo'::text) AND (deleted_at IS NULL)));

-- 80 · Triggers --------------------------------------------------------------------------------------------
CREATE TRIGGER set_updated_at_app_acciones BEFORE UPDATE ON public.app_acciones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_app_modulos BEFORE UPDATE ON public.app_modulos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_app_pantallas BEFORE UPDATE ON public.app_pantallas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_asignacion_evaluadores BEFORE UPDATE ON public.asignacion_evaluadores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_asistencias BEFORE UPDATE ON public.asistencias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_sigre_proteger_relaciones_asistencia BEFORE UPDATE ON public.asistencias FOR EACH ROW EXECUTE FUNCTION sigre_proteger_relaciones_asistencia();
CREATE TRIGGER trg_sigre_validar_columnas_asistencias BEFORE UPDATE ON public.asistencias FOR EACH ROW EXECUTE FUNCTION sigre_validar_edicion_asistencia_4c();
CREATE TRIGGER set_updated_at_calificaciones_pitch BEFORE UPDATE ON public.calificaciones_pitch FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_cumplimiento_retos BEFORE UPDATE ON public.cumplimiento_retos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_emprendedores BEFORE UPDATE ON public.emprendedores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_sigre_proteger_asignaciones_emprendedor BEFORE UPDATE ON public.emprendedores FOR EACH ROW EXECUTE FUNCTION sigre_proteger_asignaciones_emprendedor();
CREATE TRIGGER trg_sigre_validar_columnas_emprendedores BEFORE UPDATE ON public.emprendedores FOR EACH ROW EXECUTE FUNCTION sigre_validar_columnas_edicion();
CREATE TRIGGER set_updated_at_evaluadores BEFORE UPDATE ON public.evaluadores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_miniperfiles BEFORE UPDATE ON public.miniperfiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_sigre_e513_inscripcion_activa BEFORE INSERT ON public.orientacion_inscripciones FOR EACH ROW EXECUTE FUNCTION sigre_e513_validar_inscripcion_activa();
CREATE TRIGGER set_updated_at_orientaciones BEFORE UPDATE ON public.orientaciones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_sigre_proteger_orientador_orientacion BEFORE UPDATE ON public.orientaciones FOR EACH ROW EXECUTE FUNCTION sigre_proteger_orientador_orientacion();
CREATE TRIGGER trg_sigre_validar_columnas_orientaciones BEFORE UPDATE ON public.orientaciones FOR EACH ROW EXECUTE FUNCTION sigre_validar_columnas_edicion();
CREATE TRIGGER trg_sigre_validar_cupo_jornada BEFORE UPDATE OF cupo ON public.orientaciones FOR EACH ROW EXECUTE FUNCTION sigre_validar_cupo_jornada();
CREATE TRIGGER set_updated_at_pitch BEFORE UPDATE ON public.pitch FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_preparaciones_pitch BEFORE UPDATE ON public.preparaciones_pitch FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_proyectos BEFORE UPDATE ON public.proyectos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_sigre_e513_proyecto_activo BEFORE INSERT ON public.proyectos FOR EACH ROW EXECUTE FUNCTION sigre_e513_validar_proyecto_activo();
CREATE TRIGGER trg_sigre_proteger_propiedad_proyecto BEFORE UPDATE ON public.proyectos FOR EACH ROW EXECUTE FUNCTION sigre_proteger_propiedad_proyecto();
CREATE TRIGGER trg_sigre_validar_columnas_proyectos BEFORE UPDATE ON public.proyectos FOR EACH ROW EXECUTE FUNCTION sigre_validar_columnas_edicion();
CREATE TRIGGER trg_sigre_validar_creacion_proyecto BEFORE INSERT ON public.proyectos FOR EACH ROW EXECUTE FUNCTION sigre_validar_creacion_proyecto();
CREATE TRIGGER set_updated_at_retos BEFORE UPDATE ON public.retos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_rol_pantalla_permisos BEFORE UPDATE ON public.rol_pantalla_permisos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_roles BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_rutas BEFORE UPDATE ON public.rutas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_sustentacion_retos BEFORE UPDATE ON public.sustentacion_retos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_usuario_roles BEFORE UPDATE ON public.usuario_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_usuarios BEFORE UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 90 · Permisos de tablas ----------------------------------------------------------------------------------
REVOKE ALL ON TABLE public.app_acciones FROM anon, authenticated, service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.app_acciones TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.app_acciones TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.app_acciones TO service_role;
REVOKE ALL ON TABLE public.app_modulos FROM anon, authenticated, service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.app_modulos TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.app_modulos TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.app_modulos TO service_role;
REVOKE ALL ON TABLE public.app_pantallas FROM anon, authenticated, service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.app_pantallas TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.app_pantallas TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.app_pantallas TO service_role;
REVOKE ALL ON TABLE public.asignacion_evaluadores FROM anon, authenticated, service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.asignacion_evaluadores TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.asignacion_evaluadores TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.asignacion_evaluadores TO service_role;
REVOKE ALL ON TABLE public.asistencias FROM anon, authenticated, service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.asistencias TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.asistencias TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.asistencias TO service_role;
REVOKE ALL ON TABLE public.auditorias FROM anon, authenticated, service_role;
GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE public.auditorias TO anon;
GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE public.auditorias TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.auditorias TO service_role;
REVOKE ALL ON TABLE public.calificaciones_pitch FROM anon, authenticated, service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.calificaciones_pitch TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.calificaciones_pitch TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.calificaciones_pitch TO service_role;
REVOKE ALL ON TABLE public.cargas FROM anon, authenticated, service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.cargas TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.cargas TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.cargas TO service_role;
REVOKE ALL ON TABLE public.coordinador_alcances FROM anon, authenticated, service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.coordinador_alcances TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.coordinador_alcances TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.coordinador_alcances TO service_role;
REVOKE ALL ON TABLE public.cumplimiento_retos FROM anon, authenticated, service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.cumplimiento_retos TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.cumplimiento_retos TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.cumplimiento_retos TO service_role;
REVOKE ALL ON TABLE public.emprendedores FROM anon, authenticated, service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE public.emprendedores TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE public.emprendedores TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.emprendedores TO service_role;
REVOKE ALL ON TABLE public.evaluadores FROM anon, authenticated, service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.evaluadores TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.evaluadores TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.evaluadores TO service_role;
REVOKE ALL ON TABLE public.miniperfiles FROM anon, authenticated, service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.miniperfiles TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.miniperfiles TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.miniperfiles TO service_role;
REVOKE ALL ON TABLE public.municipios FROM anon, authenticated, service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.municipios TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.municipios TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.municipios TO service_role;
REVOKE ALL ON TABLE public.orientacion_inscripciones FROM anon, authenticated, service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.orientacion_inscripciones TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.orientacion_inscripciones TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.orientacion_inscripciones TO service_role;
REVOKE ALL ON TABLE public.orientaciones FROM anon, authenticated, service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.orientaciones TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.orientaciones TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.orientaciones TO service_role;
REVOKE ALL ON TABLE public.pantalla_acciones FROM anon, authenticated, service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.pantalla_acciones TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.pantalla_acciones TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.pantalla_acciones TO service_role;
REVOKE ALL ON TABLE public.permiso_cambios_logs FROM anon, authenticated, service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.permiso_cambios_logs TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.permiso_cambios_logs TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.permiso_cambios_logs TO service_role;
REVOKE ALL ON TABLE public.pitch FROM anon, authenticated, service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.pitch TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.pitch TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.pitch TO service_role;
REVOKE ALL ON TABLE public.preparaciones_pitch FROM anon, authenticated, service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.preparaciones_pitch TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.preparaciones_pitch TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.preparaciones_pitch TO service_role;
REVOKE ALL ON TABLE public.proyectos FROM anon, authenticated, service_role;
GRANT DELETE, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.proyectos TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.proyectos TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.proyectos TO service_role;
REVOKE ALL ON TABLE public.registros_carga_masiva FROM anon, authenticated, service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.registros_carga_masiva TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.registros_carga_masiva TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.registros_carga_masiva TO service_role;
REVOKE ALL ON TABLE public.retos FROM anon, authenticated, service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.retos TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.retos TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.retos TO service_role;
REVOKE ALL ON TABLE public.rol_pantalla_permisos FROM anon, authenticated, service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.rol_pantalla_permisos TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.rol_pantalla_permisos TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.rol_pantalla_permisos TO service_role;
REVOKE ALL ON TABLE public.roles FROM anon, authenticated, service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.roles TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.roles TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.roles TO service_role;
REVOKE ALL ON TABLE public.rutas FROM anon, authenticated, service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.rutas TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.rutas TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.rutas TO service_role;
REVOKE ALL ON TABLE public.sena_centros FROM anon, authenticated, service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.sena_centros TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.sena_centros TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.sena_centros TO service_role;
REVOKE ALL ON TABLE public.sena_regionales FROM anon, authenticated, service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.sena_regionales TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.sena_regionales TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.sena_regionales TO service_role;
REVOKE ALL ON TABLE public.sigre_invitaciones FROM anon, authenticated, service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.sigre_invitaciones TO service_role;
REVOKE ALL ON TABLE public.sustentacion_retos FROM anon, authenticated, service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.sustentacion_retos TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.sustentacion_retos TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.sustentacion_retos TO service_role;
REVOKE ALL ON TABLE public.usuario_roles FROM anon, authenticated, service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.usuario_roles TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.usuario_roles TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.usuario_roles TO service_role;
REVOKE ALL ON TABLE public.usuarios FROM anon, authenticated, service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE public.usuarios TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE public.usuarios TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.usuarios TO service_role;

-- 91 · Permisos por columna --------------------------------------------------------------------------------
GRANT UPDATE (descripcion) ON TABLE public.proyectos TO authenticated;
GRANT UPDATE (estado_proyecto) ON TABLE public.proyectos TO authenticated;
GRANT UPDATE (etapa_actual) ON TABLE public.proyectos TO authenticated;
GRANT UPDATE (observaciones) ON TABLE public.proyectos TO authenticated;
GRANT UPDATE (problema_oportunidad) ON TABLE public.proyectos TO authenticated;
GRANT UPDATE (propuesta_valor) ON TABLE public.proyectos TO authenticated;
GRANT UPDATE (sector_economico) ON TABLE public.proyectos TO authenticated;
GRANT UPDATE (titulo) ON TABLE public.proyectos TO authenticated;
GRANT UPDATE (updated_at) ON TABLE public.proyectos TO authenticated;

-- 92 · Permisos de funciones -------------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.coordinador_puede_ver_centro(p_centro_id uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.coordinador_puede_ver_centro(p_centro_id uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.coordinador_puede_ver_centro(p_centro_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.coordinador_puede_ver_centro(p_centro_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.handle_nuevo_usuario() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_nuevo_usuario() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_nuevo_usuario() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_nuevo_usuario() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_nuevo_usuario() TO service_role;
REVOKE ALL ON FUNCTION public.obtener_mis_centros_coordinacion() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.obtener_mis_centros_coordinacion() TO anon;
GRANT EXECUTE ON FUNCTION public.obtener_mis_centros_coordinacion() TO authenticated;
GRANT EXECUTE ON FUNCTION public.obtener_mis_centros_coordinacion() TO service_role;
REVOKE ALL ON FUNCTION public.obtener_mis_permisos() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.obtener_mis_permisos() TO anon;
GRANT EXECUTE ON FUNCTION public.obtener_mis_permisos() TO authenticated;
GRANT EXECUTE ON FUNCTION public.obtener_mis_permisos() TO service_role;
REVOKE ALL ON FUNCTION public.puede_ver_asistencia(p_asistencia_id uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.puede_ver_asistencia(p_asistencia_id uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.puede_ver_asistencia(p_asistencia_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.puede_ver_asistencia(p_asistencia_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.puede_ver_emprendedor(p_emprendedor_id uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.puede_ver_emprendedor(p_emprendedor_id uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.puede_ver_emprendedor(p_emprendedor_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.puede_ver_emprendedor(p_emprendedor_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.puede_ver_orientacion(p_orientacion_id uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.puede_ver_orientacion(p_orientacion_id uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.puede_ver_orientacion(p_orientacion_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.puede_ver_orientacion(p_orientacion_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.puede_ver_proyecto(p_proyecto_id uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.puede_ver_proyecto(p_proyecto_id uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.puede_ver_proyecto(p_proyecto_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.puede_ver_proyecto(p_proyecto_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO anon;
GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO service_role;
REVOKE ALL ON FUNCTION public.sigre_admin_asignar_orientador(p_id_emprendedor uuid, p_updated_at_esperado timestamp with time zone, p_id_orientador uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sigre_admin_asignar_orientador(p_id_emprendedor uuid, p_updated_at_esperado timestamp with time zone, p_id_orientador uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sigre_admin_asignar_orientador(p_id_emprendedor uuid, p_updated_at_esperado timestamp with time zone, p_id_orientador uuid) TO service_role;
REVOKE ALL ON FUNCTION public.sigre_admin_cambiar_estado_emprendedor(p_id_emprendedor uuid, p_updated_at_esperado timestamp with time zone, p_estado_nuevo text, p_justificacion text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sigre_admin_cambiar_estado_emprendedor(p_id_emprendedor uuid, p_updated_at_esperado timestamp with time zone, p_estado_nuevo text, p_justificacion text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sigre_admin_cambiar_estado_emprendedor(p_id_emprendedor uuid, p_updated_at_esperado timestamp with time zone, p_estado_nuevo text, p_justificacion text) TO service_role;
REVOKE ALL ON FUNCTION public.sigre_admin_crear_emprendedor(p_usuario_id uuid, p_nombre_completo text, p_id_centro_sena uuid, p_programa_formacion text, p_nivel_formacion text, p_tipo_emprendedor text, p_segmentacion text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sigre_admin_crear_emprendedor(p_usuario_id uuid, p_nombre_completo text, p_id_centro_sena uuid, p_programa_formacion text, p_nivel_formacion text, p_tipo_emprendedor text, p_segmentacion text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sigre_admin_crear_emprendedor(p_usuario_id uuid, p_nombre_completo text, p_id_centro_sena uuid, p_programa_formacion text, p_nivel_formacion text, p_tipo_emprendedor text, p_segmentacion text) TO service_role;
REVOKE ALL ON FUNCTION public.sigre_admin_crear_proyecto(p_id_emprendedor uuid, p_titulo text, p_descripcion text, p_sector_economico text, p_problema_oportunidad text, p_propuesta_valor text, p_observaciones text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sigre_admin_crear_proyecto(p_id_emprendedor uuid, p_titulo text, p_descripcion text, p_sector_economico text, p_problema_oportunidad text, p_propuesta_valor text, p_observaciones text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sigre_admin_crear_proyecto(p_id_emprendedor uuid, p_titulo text, p_descripcion text, p_sector_economico text, p_problema_oportunidad text, p_propuesta_valor text, p_observaciones text) TO service_role;
REVOKE ALL ON FUNCTION public.sigre_admin_editar_emprendedor(p_id_emprendedor uuid, p_updated_at_esperado timestamp with time zone, p_nombre_completo text, p_id_centro_sena uuid, p_programa_formacion text, p_nivel_formacion text, p_tipo_emprendedor text, p_segmentacion text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sigre_admin_editar_emprendedor(p_id_emprendedor uuid, p_updated_at_esperado timestamp with time zone, p_nombre_completo text, p_id_centro_sena uuid, p_programa_formacion text, p_nivel_formacion text, p_tipo_emprendedor text, p_segmentacion text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sigre_admin_editar_emprendedor(p_id_emprendedor uuid, p_updated_at_esperado timestamp with time zone, p_nombre_completo text, p_id_centro_sena uuid, p_programa_formacion text, p_nivel_formacion text, p_tipo_emprendedor text, p_segmentacion text) TO service_role;
REVOKE ALL ON FUNCTION public.sigre_admin_editar_proyecto(p_id_proyecto uuid, p_updated_at_esperado timestamp with time zone, p_titulo text, p_descripcion text, p_sector_economico text, p_problema_oportunidad text, p_propuesta_valor text, p_observaciones text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sigre_admin_editar_proyecto(p_id_proyecto uuid, p_updated_at_esperado timestamp with time zone, p_titulo text, p_descripcion text, p_sector_economico text, p_problema_oportunidad text, p_propuesta_valor text, p_observaciones text) TO anon;
GRANT EXECUTE ON FUNCTION public.sigre_admin_editar_proyecto(p_id_proyecto uuid, p_updated_at_esperado timestamp with time zone, p_titulo text, p_descripcion text, p_sector_economico text, p_problema_oportunidad text, p_propuesta_valor text, p_observaciones text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sigre_admin_editar_proyecto(p_id_proyecto uuid, p_updated_at_esperado timestamp with time zone, p_titulo text, p_descripcion text, p_sector_economico text, p_problema_oportunidad text, p_propuesta_valor text, p_observaciones text) TO service_role;
REVOKE ALL ON FUNCTION public.sigre_admin_eliminar_proyecto(p_id_proyecto uuid, p_updated_at_esperado timestamp with time zone) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sigre_admin_eliminar_proyecto(p_id_proyecto uuid, p_updated_at_esperado timestamp with time zone) TO anon;
GRANT EXECUTE ON FUNCTION public.sigre_admin_eliminar_proyecto(p_id_proyecto uuid, p_updated_at_esperado timestamp with time zone) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sigre_admin_eliminar_proyecto(p_id_proyecto uuid, p_updated_at_esperado timestamp with time zone) TO service_role;
REVOKE ALL ON FUNCTION public.sigre_e513_validar_inscripcion_activa() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sigre_e513_validar_inscripcion_activa() TO service_role;
REVOKE ALL ON FUNCTION public.sigre_e513_validar_proyecto_activo() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sigre_e513_validar_proyecto_activo() TO service_role;
REVOKE ALL ON FUNCTION public.sigre_emprendedor_editar_mi_ficha(p_id_emprendedor uuid, p_updated_at_esperado timestamp with time zone, p_nombre_completo text, p_numero_telefono text, p_programa_formacion text, p_nivel_formacion text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sigre_emprendedor_editar_mi_ficha(p_id_emprendedor uuid, p_updated_at_esperado timestamp with time zone, p_nombre_completo text, p_numero_telefono text, p_programa_formacion text, p_nivel_formacion text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sigre_emprendedor_editar_mi_ficha(p_id_emprendedor uuid, p_updated_at_esperado timestamp with time zone, p_nombre_completo text, p_numero_telefono text, p_programa_formacion text, p_nivel_formacion text) TO service_role;
REVOKE ALL ON FUNCTION public.sigre_listar_centros_sena_activos() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sigre_listar_centros_sena_activos() TO anon;
GRANT EXECUTE ON FUNCTION public.sigre_listar_centros_sena_activos() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sigre_listar_centros_sena_activos() TO service_role;
REVOKE ALL ON FUNCTION public.sigre_listar_inscritos_asistencia(p_orientacion_id uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sigre_listar_inscritos_asistencia(p_orientacion_id uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.sigre_listar_inscritos_asistencia(p_orientacion_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sigre_listar_inscritos_asistencia(p_orientacion_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.sigre_listar_orientadores_elegibles() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sigre_listar_orientadores_elegibles() TO anon;
GRANT EXECUTE ON FUNCTION public.sigre_listar_orientadores_elegibles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sigre_listar_orientadores_elegibles() TO service_role;
REVOKE ALL ON FUNCTION public.sigre_listar_usuarios_elegibles_emprendedor() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sigre_listar_usuarios_elegibles_emprendedor() TO anon;
GRANT EXECUTE ON FUNCTION public.sigre_listar_usuarios_elegibles_emprendedor() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sigre_listar_usuarios_elegibles_emprendedor() TO service_role;
REVOKE ALL ON FUNCTION public.sigre_orientador_editar_emprendedor(p_id_emprendedor uuid, p_updated_at_esperado timestamp with time zone, p_numero_telefono text, p_programa_formacion text, p_nivel_formacion text, p_tipo_emprendedor text, p_segmentacion text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sigre_orientador_editar_emprendedor(p_id_emprendedor uuid, p_updated_at_esperado timestamp with time zone, p_numero_telefono text, p_programa_formacion text, p_nivel_formacion text, p_tipo_emprendedor text, p_segmentacion text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sigre_orientador_editar_emprendedor(p_id_emprendedor uuid, p_updated_at_esperado timestamp with time zone, p_numero_telefono text, p_programa_formacion text, p_nivel_formacion text, p_tipo_emprendedor text, p_segmentacion text) TO service_role;
REVOKE ALL ON FUNCTION public.sigre_proteger_asignaciones_emprendedor() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sigre_proteger_asignaciones_emprendedor() TO anon;
GRANT EXECUTE ON FUNCTION public.sigre_proteger_asignaciones_emprendedor() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sigre_proteger_asignaciones_emprendedor() TO service_role;
REVOKE ALL ON FUNCTION public.sigre_proteger_orientador_orientacion() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sigre_proteger_orientador_orientacion() TO anon;
GRANT EXECUTE ON FUNCTION public.sigre_proteger_orientador_orientacion() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sigre_proteger_orientador_orientacion() TO service_role;
REVOKE ALL ON FUNCTION public.sigre_proteger_propiedad_proyecto() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sigre_proteger_propiedad_proyecto() TO anon;
GRANT EXECUTE ON FUNCTION public.sigre_proteger_propiedad_proyecto() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sigre_proteger_propiedad_proyecto() TO service_role;
REVOKE ALL ON FUNCTION public.sigre_proteger_relaciones_asistencia() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sigre_proteger_relaciones_asistencia() TO anon;
GRANT EXECUTE ON FUNCTION public.sigre_proteger_relaciones_asistencia() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sigre_proteger_relaciones_asistencia() TO service_role;
REVOKE ALL ON FUNCTION public.sigre_puede_ver_asistencia_fila(p_orientacion uuid, p_emprendedor uuid, p_deleted_at timestamp with time zone) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sigre_puede_ver_asistencia_fila(p_orientacion uuid, p_emprendedor uuid, p_deleted_at timestamp with time zone) TO anon;
GRANT EXECUTE ON FUNCTION public.sigre_puede_ver_asistencia_fila(p_orientacion uuid, p_emprendedor uuid, p_deleted_at timestamp with time zone) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sigre_puede_ver_asistencia_fila(p_orientacion uuid, p_emprendedor uuid, p_deleted_at timestamp with time zone) TO service_role;
REVOKE ALL ON FUNCTION public.sigre_puede_ver_orientacion_fila(p_id uuid, p_orientador uuid, p_deleted_at timestamp with time zone) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sigre_puede_ver_orientacion_fila(p_id uuid, p_orientador uuid, p_deleted_at timestamp with time zone) TO anon;
GRANT EXECUTE ON FUNCTION public.sigre_puede_ver_orientacion_fila(p_id uuid, p_orientador uuid, p_deleted_at timestamp with time zone) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sigre_puede_ver_orientacion_fila(p_id uuid, p_orientador uuid, p_deleted_at timestamp with time zone) TO service_role;
REVOKE ALL ON FUNCTION public.sigre_registrar_asistencia(p_orientacion_id uuid, p_emprendedor_id uuid, p_estado text, p_observacion text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sigre_registrar_asistencia(p_orientacion_id uuid, p_emprendedor_id uuid, p_estado text, p_observacion text) TO anon;
GRANT EXECUTE ON FUNCTION public.sigre_registrar_asistencia(p_orientacion_id uuid, p_emprendedor_id uuid, p_estado text, p_observacion text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sigre_registrar_asistencia(p_orientacion_id uuid, p_emprendedor_id uuid, p_estado text, p_observacion text) TO service_role;
REVOKE ALL ON FUNCTION public.sigre_validar_columnas_edicion() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sigre_validar_columnas_edicion() TO anon;
GRANT EXECUTE ON FUNCTION public.sigre_validar_columnas_edicion() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sigre_validar_columnas_edicion() TO service_role;
REVOKE ALL ON FUNCTION public.sigre_validar_creacion_proyecto() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sigre_validar_creacion_proyecto() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.sigre_validar_creacion_proyecto() TO anon;
GRANT EXECUTE ON FUNCTION public.sigre_validar_creacion_proyecto() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sigre_validar_creacion_proyecto() TO service_role;
REVOKE ALL ON FUNCTION public.sigre_validar_cupo_jornada() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sigre_validar_cupo_jornada() TO anon;
GRANT EXECUTE ON FUNCTION public.sigre_validar_cupo_jornada() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sigre_validar_cupo_jornada() TO service_role;
REVOKE ALL ON FUNCTION public.sigre_validar_edicion_asistencia_4c() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sigre_validar_edicion_asistencia_4c() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.sigre_validar_edicion_asistencia_4c() TO anon;
GRANT EXECUTE ON FUNCTION public.sigre_validar_edicion_asistencia_4c() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sigre_validar_edicion_asistencia_4c() TO service_role;
REVOKE ALL ON FUNCTION public.tiene_permiso(p_modulo text, p_accion text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.tiene_permiso(p_modulo text, p_accion text) TO anon;
GRANT EXECUTE ON FUNCTION public.tiene_permiso(p_modulo text, p_accion text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.tiene_permiso(p_modulo text, p_accion text) TO service_role;
REVOKE ALL ON FUNCTION public.tiene_rol(nombre_rol text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.tiene_rol(nombre_rol text) TO anon;
GRANT EXECUTE ON FUNCTION public.tiene_rol(nombre_rol text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.tiene_rol(nombre_rol text) TO service_role;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO anon;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO service_role;

RESET check_function_bodies;
