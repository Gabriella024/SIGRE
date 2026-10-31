# SIGRE · Módulo 3 · Visibilidad del Emprendedor, asignación de DEMO-Carlos y mejoras visuales

Solo STAGING `febelffifcqzvnttpued`. Nada de este documento está aplicado.

## A. Visibilidad de jornadas (SQL)

| Paso | Tipo | Archivo | Esperado |
|---|---|---|---|
| A1 | Lectura | `diagnostics/orientaciones_visibilidad_flight.sql` | `version: original`, `listo_para_migrar: true`, `dependientes: 1` |
| A2 | Migración | `proposals/orientaciones_visibilidad_emprendedor.sql` | `version: corregida` |
| A3 | Lectura | flight | `corregida`; `huella_politica`, `huella_politicas`, `huella_otras_funciones`, `acl_funcion`, `huella_datos`, `huella_auth` idénticas a A1 |
| A4 | Rollback | `tests/orientaciones_visibilidad_emprendedor_pruebas.sql` (3 UUID DEMO) | `0 fallos de 35` |
| A5 | Rollback | `tests/orientaciones_rls_inscripciones_pruebas.sql` / `tests/orientaciones_asistencia_inicio_pruebas.sql` | `0 de 43` / `0 de 59` (regresión) |
| A6 | Lectura | flight + `diagnostics/orientaciones_demo_verificacion.sql` | huellas idénticas a A3; Laura intacta |

Reversión: `proposals/orientaciones_visibilidad_emprendedor_reversion.sql` (restaura el cuerpo exacto, md5 `ace1e8ee…`).

## B. Asignación de DEMO-Carlos al Orientador DEMO (interfaz)

Procedimiento existente: RPC `sigre_admin_asignar_orientador(p_id_emprendedor, p_updated_at_esperado, p_id_orientador)`
(solo Administrador con `emprendedores/editar`; bloqueo optimista por `updated_at`; valida orientador activo).

1. Lectura previa: flight de visibilidad → `carlos_orientador: null`.
2. Administrador › Emprendedores › DEMO-Carlos Pruebas › Asignar orientador › DEMO-Orientador Pruebas › Confirmar.
3. Lectura posterior: `carlos_orientador = 26443b44-…`; `auditorias` +1; resto de huellas sin cambios salvo `emprendedores`.
4. Reversión: mismo modal › "Quitar orientador" (RPC con `p_id_orientador = NULL`). Deja una segunda auditoría y
   `updated_at` actualizado (la reversión es funcional, no borra el rastro de auditoría).

Efectos de la asignación:
- `emprendedores.id_orientador_fk` y `updated_at` de la ficha de Carlos; 1 fila en `auditorias`.
- El Orientador ve la ficha de Carlos (`puede_ver_emprendedor`), su contador "Mis emprendedores" pasa a 1 y puede
  editar `programa_formacion`, `nivel_formacion`, `tipo_emprendedor`, `segmentacion` (`sigre_emprendedores_update`).
- Proyectos: el Orientador podría ver/editar proyectos de Carlos (no tiene ninguno).
- Orientaciones: el diálogo "Inscribir emprendedor" del Orientador lista a Carlos. No crea inscripciones ni asistencias.
- No cambia permisos de rol ni datos de Laura, E513 u otros emprendedores.

Alternativa sin asignación: el Administrador inscribe a Carlos desde "Inscribir emprendedor" (inscripción permanente,
sin reversión por interfaz ni RPC).

## C. Mejoras visuales (propuesta, sin aplicar)

1. Métricas "Pendiente" en "Mis jornadas" del Orientador: `jornadaColumns.tsx` usa `pendingColumn(...)` con un
   marcador fijo (`PendingValue`). Corrección mínima: leer los conteos embebidos como ya hace Informes
   (`orientacion_inscripciones(id, estado, deleted_at)`, `asistencias(estado_asistencia, deleted_at)`) en la consulta del
   Orientador y renderizarlos con la misma lógica de `countActive` (contar inscripciones con `estado = 'inscrito'`).
2. "Asignado" en el detalle: `JornadaDetailModal.tsx` muestra el literal cuando hay `idOrientador`. Corrección mínima:
   añadir `orientador:usuarios!id_orientador_fk(primer_nombre, primer_apellido)` a `ORIENTACION_DETAIL_COLUMNS` y mostrar
   el nombre, con "Asignado" como respaldo cuando RLS de `usuarios` no lo permita (solo Administrador o el propio usuario
   leen `usuarios`). Misma corrección para la columna ORIENTADOR del Coordinador.
