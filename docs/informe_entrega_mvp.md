# SIGRE · Informe de entrega del MVP (STAGING)

Fecha de corte: 2026-10-30. Entorno validado: **STAGING** (`febelffifcqzvnttpued`). PRODUCCIÓN no fue modificada.
Stack sin cambios: React + TypeScript + Tailwind/shadcn, Supabase (PostgreSQL, Auth, RLS, RPC).

## 1. Estado por módulo

Avance funcional en STAGING (flujo de la UI probado con sesiones reales por rol). Los porcentajes no incluyen el
despliegue en PRODUCCIÓN (ver §5).

| # | Módulo | Avance | Funcionalidad entregada | Pendiente |
|---|---|---|---|---|
| 1 | Panel (Dashboard) | 95 % | Indicadores por rol: emprendedores, proyectos, jornadas, retos, pitch, calificación completa; proyectos que requieren atención. | El indicador «Pitch programados» cuenta todos los pitch, incluidos los cerrados (solo el texto). |
| 2 | Emprendedores | 100 % | Alta desde usuarios elegibles, ficha, centro, orientador asignado. | — |
| 3 | Proyectos | 100 % | Crear, editar y eliminar con control de versión (PT409). | — |
| 4 | Orientaciones | 100 % | Jornadas, inscripción (propia y manual, mismo centro), asistencia desde el inicio de la jornada, métricas por orientador, privacidad por rol. | — |
| 5 | Orientación masiva | 100 % | Carga de asistentes (Excel), prospectos, invitación con enlace público y respuesta voluntaria sin alta automática. | — |
| 6 | Retos | 95 % | Catálogo, asignación secuencial a proyectos, avance con evidencia, revisión (aprobado / requiere ajustes / no aprobado). | — |
| 7 | Pitch | 100 % | Programar, asignar 2–3 evaluadores, confirmar, iniciar evaluación, cerrar. Preparación de pitch en consulta. | — |
| 8 | Evaluadores | 100 % | Registro desde usuarios con rol Evaluador, edición, activación/inactivación, conteo de asignaciones. | — |
| 9 | Evaluaciones | 95 % | El Evaluador ve y califica solo sus asignaciones (con miniperfil del proyecto); consolidado de votos y promedio. | Regla de aprobación final del pitch: **pendiente de definición institucional**. |
| 10 | Informes | 95 % | Seis informes con filtros y exportación a Excel (emprendedores, proyectos, orientaciones, retos, pitch, evaluaciones). | El resultado final del pitch se muestra como «Pendiente de confirmación de regla». |
| 11 | Usuarios (A5) | 85 % | Listado, edición, cambio de estado, invitación A5. | Activación de cuentas reales (§4). |
| 12 | Control de accesos | 95 % | Matriz de permisos por rol y pantalla, asignación de roles. | — |
| 13 | Configuración | 90 % | Municipios, centros SENA y pantallas. | Sin prueba de extremo a extremo en este cierre. |

## 2. Pruebas realizadas en STAGING

**Pruebas SQL** (en transacciones revertidas; resultados en STAGING):
- Orientaciones: RLS 43/43, asistencia 59/59, visibilidad 35/35, mismo centro 18/18.
- Orientación masiva: 30/30.
- Ruta (retos, pitch, evaluadores, evaluaciones): 70/70.

**Pruebas unitarias del frontend:** 10/10 (`node --test tests/orientations/*.test.ts`).

**Comprobaciones del código:** `tsc` sin errores y compilación correcta. ESLint pasa en los módulos modificados; el
repositorio conserva 4 errores previos ajenos (`ui/button`, `ui/form`, `ui/tabs`, `AuthContext`).

**Flujo completo en la UI con sesiones reales:**
1. Tres evaluadores DEMO registrados y asignados (3/3) al pitch DEMO de Carlos.
2. Pitch confirmado y puesto en evaluación.
3. Calificaciones registradas por cada evaluador desde su sesión: 85 (aprobado), 78 (aprobado) y 60 (no aprobado).
4. Pitch cerrado por el Administrador.
5. Dashboard e Informes muestran 3/3 calificaciones, 2 votos a favor y 1 en contra, promedio 74 y «Calificación completa».

**Cierre de Orientaciones:** asistencia de Carlos registrada en la DEMO-Jornada Orientador una vez iniciada la
jornada (1 inscrito, 1 asistió).

**Orientación masiva:** DEMO-Valentina aceptó la invitación desde el enlace público. La invitación quedó
«aceptada» y el prospecto en «acepto», con auditoría `INVITACION_RESPONDIDA`. **No** se creó emprendedor ni
usuario, y el enlace ya no admite una segunda respuesta.

## 3. Restricciones verificadas

- **Evaluador:**
  - ve solo su asignación, su registro de evaluador y el proyecto y emprendedor de su pitch;
  - calificar una asignación ajena o cerrar un pitch devuelve 42501;
  - las pantallas Pitch y Proyectos le muestran «Acceso restringido»;
  - no puede eliminar ni exportar evaluaciones.
- **Pitch:** de 2 a 3 evaluadores para confirmar o evaluar; no se puede retirar ni asignar evaluadores en evaluación o
  después del cierre; solo se cierra con todas las calificaciones registradas.
- **Orientador:** ve solo sus jornadas; no registra asistencia antes del inicio. **Emprendedor:** solo se inscribe en
  jornadas de su centro. Los conflictos de versión devuelven PT409.
- **Integridad:** Laura, E513, A5 y PRODUCCIÓN sin cambios. Los datos DEMO usan correos `@example.com`.

## 4. Pendientes indispensables

1. **Regla de aprobación final del pitch:** la define la institución. Hoy el sistema muestra los votos sin emitir un
   resultado.
2. **Activación de usuarios reales con A5:** propuesta mínima en `supabase/proposals/a5_activacion_usuarios_propuesta.md`.
   Sin aplicar.
3. **Migración A5-11: aplicada en STAGING el 2026-10-30,** con autorización independiente.
   - Postflight 10/10, pruebas de duplicados 7/7 revertidas, y usuarios, roles, invitaciones y Auth sin cambios.
   - Pendiente opcional: probar de extremo a extremo la Edge Function A5 con una sesión de administrador en
     `http://localhost:5173`, que es el único origen permitido.
   - Detalle en `supabase/proposals/a5_11_aplicacion_staging_pendiente.md`.

## 5. Reconstrucción desde el repositorio

### Línea base (resuelto)

**Extracción, de solo lectura y sin contraseñas:**
- se hizo con `supabase/diagnostics/esquema_base_extraer.sql` en el SQL Editor de STAGING, exportado a CSV;
- incluye solo estructura (tablas, restricciones, índices, funciones, RLS, políticas, triggers y permisos de tablas,
  columnas y funciones) y los catálogos de roles, módulos, acciones, pantallas y matriz de permisos;
- no incluye usuarios, emprendedores, auditorías ni contraseñas.

**Generación:** `supabase/scripts/esquema_base_generar.py` transforma ese CSV en:
- `20261001000000_esquema_base.sql`: 385 objetos. Excluye los 112 que crean las migraciones posteriores, para no
  duplicarlos.
- `20261001000100_catalogos_base.sql`: 426 filas, idempotente.

**Excepciones documentadas en la línea base:**
- `sigre_puede_ver_orientacion_fila` va en la línea base porque la necesita una política base. La migración
  `20261029190000` la vuelve a crear con la misma versión.
- `sigre_admin_editar_proyecto` y `sigre_admin_eliminar_proyecto` van en su versión previa (`40001`), y la migración
  `20261028120000` las corrige a PT409.

**Ajustes a migraciones existentes** (sin efecto en STAGING; deben aplicar sin errores en una base vacía):
- `20261028120000` (PT409): se quitó la guarda que exigía una cuenta DEMO de STAGING.
- `20261029203000` (mismo centro): se agregaron los permisos reales de `sigre_inscribir_en_jornada`. Sin ellos, en una
  base nueva la habrían podido ejecutar PUBLIC y `anon`.
- `20261025000000` (RPC administrativas): `sigre_registrar_usuario_invitado` revoca también a `authenticated`. Solo
  la llama A5 con `service_role`.
- `20261026120000` (A5-11): se actualizó el encabezado.

### Verificación local

Se usó una base PostgreSQL desechable en memoria (PGlite, PostgreSQL 16.4) que no toca STAGING. Para repetirla:
`supabase/scripts/verificar_reconstruccion.mjs`.

| Comprobación | Resultado |
|---|---|
| Migraciones aplicadas en orden sobre una base vacía | 14/14 sin errores |
| Objetos equivalentes a STAGING (desde el árbol del commit) | 921 de 923: 895 idénticos y 26 que solo cambian el fin de línea |
| Funciones recompiladas con validación de cuerpos | 75/75 |

Las diferencias tienen explicación:
- `sigre_invitaciones`: el repositorio incluía A5-11 y STAGING no; ya está aplicada (pendiente 3), así que
  esta diferencia desaparece.
- Fin de línea: STAGING guarda algunos cuerpos de función con CRLF y git los normaliza (`core.autocrlf`). La
  definición es la misma y solo cambian los saltos de línea; el verificador lo informa aparte.
- `municipios`: el único registro de STAGING es dato DEMO y está mal codificado, así que se excluyó de la semilla a
  propósito.

### Requisitos externos que PostgreSQL local no reproduce

1. **Lo que provee Supabase:**
   - los roles `anon`, `authenticated` y `service_role`;
   - el esquema `auth` (`auth.users`, `auth.uid()`);
   - los permisos por defecto en `public`;
   - las extensiones `pgcrypto`, `uuid-ossp` y `pg_stat_statements`, aunque el esquema solo usa `gen_random_uuid()`,
     que viene en PostgreSQL.

   En la prueba local se reemplazaron con un stub mínimo.
2. **PostgreSQL 17:** el privilegio `MAINTAIN` de los permisos de tablas solo existe en PG17. La prueba local lo
   omite; los archivos lo conservan.
3. **Event trigger `ensure_rls`:** lo crea la opción «Enable automatic RLS» de Supabase y no se migra; su función
   `rls_auto_enable` sí está en la línea base. Hay que activarla en el panel del proyecto destino.
4. **Configuración fuera de la base de datos:**
   - Auth: SMTP, Site URL y Redirect URLs;
   - la Edge Function A5 (`supabase functions deploy`) y su variable `SIGRE_ALLOWED_ORIGINS`;
   - las variables `.env` del frontend.
5. **Datos institucionales:** municipios, regionales y centros SENA se cargan desde la fuente oficial.
6. **Sin historial de migraciones en STAGING:** todo se aplicó desde el SQL Editor. Para adoptar la CLI sin
   reejecutar nada:
   `supabase migration repair --status applied 20261001000000 20261001000100 20261025000000 20261028120000 20261028200000 20261028200100 20261029170000 20261029190000 20261029203000 20261030090000 20261030120000 20261030150000 20261030150100`.
   Incluir también `20261026120000` (A5-11), aplicada el 2026-10-30.

### Orden de despliegue en un entorno nuevo (con autorización)

1. Proyecto Supabase en PostgreSQL 17, con «Enable automatic RLS» activado.
2. `supabase db push`, que aplica las 14 migraciones en orden.
3. Datos institucionales.
4. Edge Function A5 y sus variables.
5. Configuración de Auth.
6. En `src/lib/backendContract.ts`, cambiar a `existente` las 23 operaciones `solo_staging`.

## 6. Migraciones

| Versión | Contenido |
|---|---|
| 20261001000000 | Línea base del esquema public (estructura previa a las migraciones del MVP) |
| 20261001000100 | Catálogos: roles, módulos, acciones, pantallas y matriz de permisos |
| 20261025000000 | RPC administrativas: A5, usuarios, municipios, centros, pantallas, permisos y roles |
| 20261026120000 | A5: número de documento en invitaciones (aplicada en STAGING el 2026-10-30) |
| 20261028120000 | Proyectos: conflicto de versión PT409 |
| 20261028200000 – 20261029203000 | Orientaciones (5): RLS de inscripciones, inicio de jornada, orientador, visibilidad, mismo centro |
| 20261030090000 | Orientación masiva: carga, prospectos, invitaciones |
| 20261030120000 | Ruta: retos, pitch, evaluadores, evaluaciones (12 RPC + RLS) |
| 20261030150000 | Miniperfil del proyecto para el Evaluador asignado (solo SELECT) |
| 20261030150100 | Permisos del rol Evaluador en Evaluación |

Las versiones son únicas y están en orden. No contienen UUID, credenciales ni datos de entorno. Los scripts DEMO
(`proposals/*demo*.sql`) no son migraciones.

## 7. Propuesta de commits

Ver `docs/propuesta_commits_mvp.md`.
