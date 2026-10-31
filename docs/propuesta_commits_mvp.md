# SIGRE · Propuesta de commits del MVP (NO EJECUTADA)

Rama: `mvp/demo`. Total pendiente: 98 archivos. Revisados sin claves, contraseñas, correos reales ni el
identificador de PRODUCCIÓN. `dist/` y `.env*` están en `.gitignore`.

Antes de confirmar: `npx tsc -p tsconfig.app.json --noEmit`, `npx vite build` y
`node --test tests/orientations/*.test.ts` (10/10). Verificación de esquema:
`npm i --no-save @electric-sql/pglite@0.2.17 && node supabase/scripts/verificar_reconstruccion.mjs . <csv>`.

## Commit 1 · Código del frontend (44 archivos)

```
feat(mvp): completar ruta emprendedora en frontend (orientaciones, carga masiva, retos, pitch, evaluaciones)

- Orientaciones: autoinscripción sin p_emprendedor_id, estado de inscripción, métricas del orientador,
  guardas de inicio de jornada y capacidades por rol.
- Orientación masiva: carga de asistentes y página pública de respuesta a la invitación.
- Retos, pitch y evaluadores conectados a las RPC del MVP (contrato solo_staging).
- Evaluaciones: la calificación 1:1 se lee como objeto (embeddedOne); miniperfil del proyecto.
- Pitch: etiqueta «En evaluación» con tilde; «Retirar» oculto en evaluación, cierre o cancelación.
```

```
git add \
  src/App.tsx \
  src/components/ui/status-badge.tsx \
  src/features/challenges/components/ChallengeDetailModal.tsx \
  src/features/challenges/components/ChallengeFormModal.tsx \
  src/features/challenges/hooks/useChallenges.ts \
  src/features/challenges/services/challengesService.ts \
  src/features/challenges/types/Challenge.ts \
  src/features/evaluations/components/EvaluationCard.tsx \
  src/features/evaluations/schemas/evaluationsSchema.ts \
  src/features/evaluations/utils/evaluationUtils.ts \
  src/features/evaluators/components/EvaluatorFormModal.tsx \
  src/features/orientation-mass/components/HeaderConfirmado.tsx \
  src/features/orientation-mass/components/TemplateDownloadCard.tsx \
  src/features/orientation-mass/hooks/useOrientationUpload.ts \
  src/features/orientation-mass/schemas/orientacionMasivaSchema.ts \
  src/features/orientation-mass/services/invitacionRutaService.ts \
  src/features/orientation-mass/services/massOrientationService.ts \
  src/features/orientation-mass/types/cargaMasiva.ts \
  src/features/orientation-mass/utils/orientacionMasivaUtils.ts \
  src/features/orientations/components/EnrollmentModal.tsx \
  src/features/orientations/components/JornadaDetailModal.tsx \
  src/features/orientations/hooks/useJornadaMetricas.ts \
  src/features/orientations/hooks/useOrientationAccess.ts \
  src/features/orientations/jornadaColumns.tsx \
  src/features/orientations/schemas/orientationSchema.ts \
  src/features/orientations/services/enrollmentService.ts \
  src/features/orientations/services/orientationsService.ts \
  src/features/orientations/types/orientations.ts \
  src/features/orientations/utils/enrollmentParams.ts \
  src/features/orientations/utils/enrollmentStatus.ts \
  src/features/orientations/utils/orientationCapabilities.ts \
  src/features/orientations/utils/orientationUtils.ts \
  src/features/orientations/views/EmprendedorOrientationsView.tsx \
  src/features/orientations/views/OrientadorOrientationsView.tsx \
  src/features/pitch/columns.tsx \
  src/features/pitch/components/PitchDetailModal.tsx \
  src/features/pitch/utils/pitchUtils.ts \
  src/lib/adminOperation.ts \
  src/lib/backendContract.ts \
  src/pages/CargarAsistentesPage.tsx \
  src/pages/ChallengesPage.tsx \
  src/pages/InvitacionRutaPage.tsx \
  tests/orientations/enrollmentParams.test.ts \
  tests/orientations/enrollmentStatus.test.ts
```

## Commit 2 · Migraciones y pruebas SQL (23 archivos)

Todas aplicadas en STAGING salvo 20261026120000 (A5-11, pendiente); **no reejecutarlas allí**. Reconstruyen el
esquema en una base vacía: 14/14 migraciones, 921/923 objetos equivalentes a STAGING (ver docs/informe_entrega_mvp.md §5).

```
feat(db): línea base, catálogos y migraciones del MVP reconstruibles desde cero

- 20261001000000 / 20261001000100: línea base del esquema y catálogos, extraídos en solo lectura de STAGING.
- 20261025000000: 10 RPC administrativas (verificadas por md5 contra STAGING).
- 20261028120000 sin guarda de STAGING; 20261029203000 con permisos explícitos (base nueva = STAGING).
- supabase/scripts: generador de la línea base y verificador de reconstrucción (PGlite, base desechable).
- 20261028200000-20261029203000: orientaciones (RLS, inicio de jornada, visibilidad, mismo centro).
- 20261030090000: orientación masiva. 20261030120000: retos, pitch, evaluadores y evaluaciones.
- 20261030150000: miniperfil del proyecto para el Evaluador. 20261030150100: permisos del Evaluador.
- supabase/tests: pruebas en transacciones revertidas.
```

```
git add \
  supabase/diagnostics/esquema_base_extraer.sql \
  supabase/migrations/20261001000000_esquema_base.sql \
  supabase/migrations/20261001000100_catalogos_base.sql \
  supabase/migrations/20261025000000_rpc_admin_usuarios_configuracion_accesos.sql \
  supabase/migrations/20261026120000_a5_11_invitaciones_numero_documento.sql \
  supabase/migrations/20261028120000_proyectos_conflicto_pt409.sql \
  supabase/migrations/20261028200000_orientaciones_inscripciones_select_rls.sql \
  supabase/migrations/20261028200100_orientaciones_asistencia_inicio_jornada.sql \
  supabase/migrations/20261029170000_orientaciones_inscripciones_orientador_tiene_rol.sql \
  supabase/migrations/20261029190000_orientaciones_visibilidad_emprendedor.sql \
  supabase/migrations/20261029203000_orientaciones_inscripcion_mismo_centro.sql \
  supabase/migrations/20261030090000_orientacion_masiva_carga_prospectos.sql \
  supabase/migrations/20261030120000_ruta_retos_pitch_evaluaciones.sql \
  supabase/migrations/20261030150000_pitch_evaluador_miniperfil_proyecto.sql \
  supabase/migrations/20261030150100_evaluador_permisos_evaluaciones.sql \
  supabase/scripts/esquema_base_generar.py \
  supabase/scripts/verificar_reconstruccion.mjs \
  supabase/tests/orientacion_masiva_carga_pruebas.sql \
  supabase/tests/orientaciones_asistencia_inicio_pruebas.sql \
  supabase/tests/orientaciones_inscripcion_mismo_centro_pruebas.sql \
  supabase/tests/orientaciones_rls_inscripciones_pruebas.sql \
  supabase/tests/orientaciones_visibilidad_emprendedor_pruebas.sql \
  supabase/tests/ruta_retos_pitch_evaluaciones_pruebas.sql
```

## Commit 3 · Scripts DEMO, diagnósticos y documentación (31 archivos)

Material auxiliar: scripts DEMO de STAGING, reversiones, propuestas, diagnósticos de solo lectura e informe. Se
puede omitir si el equipo prefiere no versionar el material operativo.

```
docs(mvp): runbooks, scripts DEMO de STAGING, diagnósticos e informe de entrega
```

```
git add \
  docs/informe_entrega_mvp.md \
  docs/propuesta_commits_mvp.md \
  supabase/.temp/cli-latest \
  supabase/diagnostics/orientaciones_demo_verificacion.sql \
  supabase/diagnostics/orientaciones_mismo_centro_flight.sql \
  supabase/diagnostics/orientaciones_postflight_staging.sql \
  supabase/diagnostics/orientaciones_preflight_staging.sql \
  supabase/diagnostics/orientaciones_rls_inscripciones.sql \
  supabase/diagnostics/orientaciones_rls_orientador_flight.sql \
  supabase/diagnostics/orientaciones_visibilidad_flight.sql \
  supabase/diagnostics/rpc_admin_sin_migracion_extraer.sql \
  supabase/proposals/a5_11_aplicacion_staging_pendiente.md \
  supabase/proposals/a5_activacion_usuarios_propuesta.md \
  supabase/proposals/orientacion_masiva_carga_prospectos_reversion.sql \
  supabase/proposals/orientaciones_asistencia_inicio_jornada.sql \
  supabase/proposals/orientaciones_asistencia_inicio_jornada_reversion.sql \
  supabase/proposals/orientaciones_cierre_migraciones.md \
  supabase/proposals/orientaciones_cierre_visibilidad_asignacion.md \
  supabase/proposals/orientaciones_demo_jornada_orientador.sql \
  supabase/proposals/orientaciones_demo_usuarios.sql \
  supabase/proposals/orientaciones_inscripcion_mismo_centro.sql \
  supabase/proposals/orientaciones_inscripcion_mismo_centro_reversion.sql \
  supabase/proposals/orientaciones_inscripciones_select_orientador_tiene_rol.sql \
  supabase/proposals/orientaciones_inscripciones_select_orientador_tiene_rol_reversion.sql \
  supabase/proposals/orientaciones_inscripciones_select_rls.sql \
  supabase/proposals/orientaciones_inscripciones_select_rls_reversion.sql \
  supabase/proposals/orientaciones_lote_cierre_modulo3.md \
  supabase/proposals/orientaciones_visibilidad_emprendedor.sql \
  supabase/proposals/orientaciones_visibilidad_emprendedor_reversion.sql \
  supabase/proposals/pitch_demo_evaluadores_usuarios.sql \
  supabase/proposals/pitch_evaluador_miniperfil_proyecto.sql
```
