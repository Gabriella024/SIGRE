# SIGRE · Resumen ejecutivo de entrega del MVP

**Fecha:** 2026-10-30 · **Entorno:** STAGING (demostración local en `http://localhost:5173`) · **Rama:** `mvp/demo`
(publicada) · **PRODUCCIÓN:** sin cambios.

## Qué es SIGRE

Sistema de gestión de la Ruta Emprendedora del SENA. Reúne en una sola plataforma la orientación, el registro de
emprendedores y proyectos, los retos, el pitch, la evaluación por un panel de expertos y los informes. Cada rol
(Administrador, Coordinador, Orientador, Evaluador y Emprendedor) ve y modifica solo lo que le corresponde.

## Módulos (13)

Los **13 módulos están implementados y operativos para la demostración**. Diez no tienen limitaciones funcionales y
tres conservan alguna, señalada abajo.

| Módulo | Estado |
|---|---|
| Panel | Implementado y operativo |
| Emprendedores | Implementado y operativo |
| Proyectos | Implementado y operativo |
| Orientaciones | Implementado y operativo |
| Orientación masiva | Implementado y operativo |
| Retos | Implementado y operativo |
| Pitch | Implementado y operativo |
| Evaluadores | Implementado y operativo |
| Informes | Implementado y operativo (6 informes con exportación a Excel) |
| Control de accesos | Implementado y operativo |
| Evaluaciones | Implementado y operativo · **Limitación:** la regla de aprobación final del pitch está pendiente de definición institucional; se muestran votos y promedio, sin resultado definitivo |
| Usuarios | Implementado y operativo · **Limitación:** la activación de cuentas por correo no está habilitada (falta SMTP y desplegar A5) y «Último acceso» aparece como «Nunca» |
| Configuración | Implementado y operativo · **Limitación:** municipios, regionales y centros SENA tienen solo datos DEMO |

## Pruebas aprobadas

- **Base de datos** (pruebas automáticas en transacciones revertidas, en STAGING):
  - Orientaciones: RLS 43/43, asistencia 59/59, visibilidad 35/35, mismo centro 18/18.
  - Orientación masiva: 30/30.
  - Retos, pitch, evaluadores y evaluaciones: 70/70.
  - A5-11: 7/7.
- **Flujo completo con sesiones reales:**
  - tres evaluadores calificaron (85, 78 y 60) y el pitch se cerró;
  - Dashboard e Informes muestran resultados coherentes (2 votos a favor, 1 en contra, promedio 74);
  - inscripción y asistencia en orientación;
  - respuesta voluntaria a la invitación de la ruta, sin alta automática como emprendedor.
- **Restricciones por rol:** cada evaluador ve solo lo suyo; los intentos no autorizados se rechazan (42501); los
  conflictos de edición se detectan (PT409).
- **Código:** comprobación de tipos y compilación sin errores; pruebas unitarias 15/15.
- **Reconstrucción:** las 14 migraciones crean el esquema en una base vacía, con 921 de 923 objetos equivalentes a
  STAGING.
- **Ensayo final:** los 13 módulos navegados como administrador, sin errores.

## Limitaciones actuales

1. **Sin dirección web pública:** SIGRE se ejecuta en el equipo de quien presenta, conectado a STAGING.
2. **Activación de cuentas por correo no habilitada.** El código está listo (página `/activar-cuenta` y A5 nueva),
   pero falta SMTP institucional y desplegar A5. Hoy las cuentas se crean manualmente.
3. **«Último acceso»** aparece como «Nunca»: la columna nunca se ha conectado. Hay diagnóstico y propuesta, sin
   aplicar.
4. Los catálogos de municipios, regionales y centros SENA contienen solo datos DEMO.

## Pendientes para la puesta en marcha (requieren decisión o autorización)

1. Definir la regla institucional de aprobación del pitch.
2. Datos del SMTP institucional. Después: desplegar A5 y probar invitar, activar e iniciar sesión.
3. Elegir el hosting y la dirección pública; luego, las URLs de Auth y los orígenes de A5.
4. Cargar los catálogos oficiales (municipios, regionales, centros SENA).
5. Corregir «Último acceso» (opción recomendada en `supabase/proposals/usuarios_ultimo_acceso_diagnostico.md`).
6. Revisión y merge de `mvp/demo` a `main`, y despliegue autorizado en el entorno institucional.

**Detalle técnico:** `docs/informe_entrega_mvp.md`.
