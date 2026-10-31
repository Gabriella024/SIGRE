# SIGRE · Módulo 3 · Migraciones de Orientaciones

| Versión | Archivo | Aplicada en STAGING desde |
|---|---|---|
| 20261028200000 | `migrations/20261028200000_orientaciones_inscripciones_select_rls.sql` | `proposals/orientaciones_inscripciones_select_rls.sql` (2026-10-28) |
| 20261028200100 | `migrations/20261028200100_orientaciones_asistencia_inicio_jornada.sql` | `proposals/orientaciones_asistencia_inicio_jornada.sql` (2026-10-28) |
| 20261029170000 | `migrations/20261029170000_orientaciones_inscripciones_orientador_tiene_rol.sql` | `proposals/orientaciones_inscripciones_select_orientador_tiene_rol.sql` (2026-10-29) |
| 20261029190000 | `migrations/20261029190000_orientaciones_visibilidad_emprendedor.sql` | `proposals/orientaciones_visibilidad_emprendedor.sql` (2026-10-29) |
| 20261029203000 | `migrations/20261029203000_orientaciones_inscripcion_mismo_centro.sql` | `proposals/orientaciones_inscripcion_mismo_centro.sql` (2026-10-29) |

Las migraciones son idempotentes y no contienen UUID, credenciales ni datos de entorno. Reproducen
exactamente el estado de STAGING (validado por md5 de políticas y funciones). Los scripts de `proposals/`
conservan las guardas de STAGING, las reversiones y la trazabilidad de lo aplicado. Los datos DEMO
(`orientaciones_demo_usuarios.sql`, `orientaciones_demo_jornada_orientador.sql`) no son migraciones.

## Historial remoto

STAGING no tiene `supabase_migrations.schema_migrations` (las migraciones se aplican desde el SQL Editor), por
lo que no hay historial que sincronizar ni versiones que marcar. **No volver a ejecutar estas cinco migraciones en
STAGING.** Si más adelante se adopta Supabase CLI, registrar las versiones ya aplicadas sin ejecutarlas:

```
supabase migration repair --status applied 20261026120000 20261028120000 20261028200000 20261028200100 20261029170000 20261029190000 20261029203000
```

## Antes de aplicarlas en otro entorno

Las migraciones 20261029190000 y 20261029203000 reemplazan funciones completas. Comprobar primero (solo
lectura) que el entorno parte de las mismas versiones que STAGING antes del módulo (cuerpos sin `\r`):

```sql
SELECT proname, md5(replace(prosrc, chr(13), '')) FROM pg_proc
WHERE oid IN ('public.sigre_puede_ver_orientacion_fila(uuid,uuid,timestamptz)'::regprocedure,
              'public.sigre_inscribir_en_jornada(uuid,uuid)'::regprocedure);
```

Valores esperados antes del módulo (STAGING): `sigre_puede_ver_orientacion_fila` = `2266b66a2ddc5891b09ea0d456bcc5d7`,
`sigre_inscribir_en_jornada` = `2a411f903feef8e630d7b1f64656b966`. Si difieren, revisar el cambio antes de aplicar:
la migración sobrescribiría esa versión.
