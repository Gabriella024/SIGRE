# SIGRE · Índice de `supabase/proposals/`

Los scripts de esta carpeta son **trazabilidad histórica** de lo preparado para STAGING. Algunas cabeceras dicen
«NO APLICADA» porque se escribieron antes de aplicarse. Prevalece el estado de esta tabla. Para reconstruir un
entorno se usan solo las migraciones de `supabase/migrations/`, nunca estos scripts.

## Estructura (reemplazadas por migraciones)

| Propuesta | Estado en STAGING | Migración reproducible |
|---|---|---|
| `orientaciones_inscripciones_select_rls.sql` | Aplicada 2026-10-28 | `20261028200000` |
| `orientaciones_asistencia_inicio_jornada.sql` | Aplicada 2026-10-28 | `20261028200100` |
| `orientaciones_inscripciones_select_orientador_tiene_rol.sql` | Aplicada 2026-10-29 | `20261029170000` |
| `orientaciones_visibilidad_emprendedor.sql` | Aplicada 2026-10-29 | `20261029190000` |
| `orientaciones_inscripcion_mismo_centro.sql` | Aplicada 2026-10-29 | `20261029203000` |
| `pitch_evaluador_miniperfil_proyecto.sql` | Aplicada 2026-10-30 | `20261030150000` |
| `pt409_funciones_restantes.sql` | La extracción de la línea base (2026-10-30) ya muestra PT409 en esas funciones | `20261001000000` / `20261025000000` |

## Datos DEMO (solo STAGING, no son migraciones)

| Script | Estado |
|---|---|
| `orientaciones_demo_usuarios.sql` | Aplicado 2026-10-29 (DEMO-Orientador, DEMO-Carlos) |
| `orientaciones_demo_jornada_orientador.sql` | Aplicado 2026-10-29 («DEMO-Jornada Orientador») |
| `pitch_demo_evaluadores_usuarios.sql` | Aplicado 2026-10-30 (3 evaluadores DEMO) |

## Reversiones (no ejecutadas)

`*_reversion.sql`: solo se usan con autorización expresa. `evaluador_permiso_panel_ver_reversion.sql` revierte
`20261031120000`.

## Documentos

| Documento | Estado |
|---|---|
| `a5_11_aplicacion_staging_pendiente.md` | A5-11 aplicada 2026-10-30 (`20261026120000`) |
| `a5_activacion_usuarios_propuesta.md`, `a5_activacion_despliegue_staging.md` | Sin ejecutar: falta desplegar la Edge Function A5 |
| `usuarios_ultimo_acceso_diagnostico.md` | Diagnóstico; no implementado |
| `orientaciones_cierre_migraciones.md`, `orientaciones_cierre_visibilidad_asignacion.md`, `orientaciones_lote_cierre_modulo3.md` | Históricos del módulo Orientaciones |
