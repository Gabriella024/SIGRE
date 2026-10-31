# SIGRE · Módulo 3 Orientaciones · Lote de cierre (STAGING)

Destino exclusivo: STAGING `febelffifcqzvnttpued`. Prohibido en PRODUCTION. No toca E513, A5 ni otros módulos.
Ejecutar cada script completo en el SQL Editor **sin texto seleccionado** (con selección solo corre lo seleccionado).

## Bloque A · Datos DEMO persistentes (quedan en STAGING)

| Paso | Acción | Resultado esperado |
|---|---|---|
| A0 | `diagnostics/orientaciones_demo_verificacion.sql` | `staging: true`, `politicas_inscripciones: 3`, `trigger_asistencia: true`, `auth: null`, `listo_para_pruebas: false` |
| A1 | Dashboard › Authentication › Add user (Auto Confirm) para `demo.orientador@example.com` y `demo.emprendedor2@example.com`. Anotar los dos UUID | Dos cuentas confirmadas |
| A2 | `proposals/orientaciones_demo_usuarios.sql` con `v_orientador` y `v_emprendedor` | `"resultado": "ACEPTADO"`, orientador (id 5) y emprendedor (id 4) activos |
| A3 | UI como Admin › Emprendedores › Nuevo emprendedor › DEMO-Carlos Pruebas, centro DEMO-CCS | Ficha creada; DEMO-Carlos ya no aparece como elegible |
| A4 | `proposals/orientaciones_demo_jornada_orientador.sql` con `v_orientador` | `"resultado": "ACEPTADO"`, `jornadas_del_orientador: 1`, `datos_laura_sin_cambios: true` |
| A5v | `diagnostics/orientaciones_demo_verificacion.sql` | `listo_para_pruebas: true`; `parametros_pruebas` trae los 3 UUID para el bloque B; `laura` igual que en A0; `permisos_orientador_en_orientaciones` no vacío (si es `null`, el Orientador no verá la pantalla: asignar permisos desde Control de acceso, no por SQL) |

Reversión del bloque A: comentada al final de A2 y A4 (orden inverso: A4 → ficha desde UI → A2 → Auth).

## Bloque B · Pruebas que se revierten solas (no dejan datos)

Ambos terminan **siempre** con `ERROR: RESULTADO (transaccion revertida): N fallos de M pruebas`. Ese error es el resultado normal; el éxito es `0 fallos`.

| Paso | Script | Parámetros | Cubre |
|---|---|---|---|
| B1 | `tests/orientaciones_rls_inscripciones_pruebas.sql` | `v_orientador`, `v_emp2_usuario`, `v_emp2_ficha` (de A5v) | RLS por rol, cupos (cupo 1 lleno → 22023), duplicado (23505), acceso no autorizado por tabla y RPC (42501), borrados lógicos |
| B2 | `tests/orientaciones_asistencia_inicio_pruebas.sql` | `v_orientador` | Asistencia antes del inicio (22023), después del inicio (OK), frontera Bogotá, reprogramación, RPC Admin y Orientador |
| B3 | `diagnostics/orientaciones_demo_verificacion.sql` | — | Idéntico a A5v: las pruebas no dejaron filas |

Si B1/B2 reportan fallos, el detalle trae SQLSTATE y mensaje reales; no se corrige nada sin revisarlo antes.

## Bloque C · Validación en UI (datos DEMO reales, persistentes)

1. Orientador DEMO: ve solo `DEMO-Jornada Orientador`; inscribe a DEMO-Carlos y a Laura (cupo 3).
2. Orientador DEMO: intenta registrar asistencia antes del inicio → rechazada.
3. DEMO-Carlos: ve solo su inscripción; no ve la de Laura.
4. Laura: conserva la jornada original y su asistencia; ve también su nueva inscripción.
5. Tras el inicio de la jornada (mañana 10:00 Bogotá): Orientador registra asistencia → aceptada.
6. Admin › Informes: `Inscritos` de ambas jornadas correcto.
