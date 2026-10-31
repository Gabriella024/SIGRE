# SIGRE · Activación de usuarios reales con A5 · Procedimiento para STAGING (NO EJECUTADO)

Cada paso marcado con **[AUTORIZACIÓN]** cambia STAGING y requiere aprobación expresa. Ninguna credencial se escribe
en el repositorio ni en el chat: se ingresan directamente en el Dashboard o en la terminal de quien autoriza.

## Estado verificado (solo lectura, 2026-10-30)

| Elemento | Estado actual en STAGING |
|---|---|
| Edge Function `sigre-admin-invitar-usuario` | Versión original (`supabase/backups/.../index.original.ts`), con «Verify JWT» activado |
| Secretos de la función | Solo `SIGRE_ALLOWED_ORIGINS`, que admite `http://localhost:5173` (`127.0.0.1:5173` y `localhost:3000` → 403) |
| A5-11 (`sigre_invitaciones.numero_documento`) | Aplicada el 2026-10-30 |
| Auth · Site URL / Redirect URLs | `http://localhost:3000` (sin cambios) / `http://localhost:5173/activar-cuenta`, agregada el 2026-10-30 con autorización |
| Auth · SMTP | Personalizado desactivado: el remitente de Supabase solo entrega a miembros del equipo, con pocos envíos por hora |

## Código preparado en el repositorio (sin desplegar)

- **A5** (`supabase/functions/sigre-admin-invitar-usuario/index.ts`):
  - invita con `redirectTo` = `SIGRE_ACTIVATION_URL`;
  - si esa variable falta o no es una URL http(s), responde 503 `ACTIVACION_NO_CONFIGURADA` antes de leer o escribir
    datos y antes de invitar;
  - conserva la autorización (administrador + `usuarios.crear`), las validaciones de duplicados por correo y
    documento (usuarios e invitaciones abiertas, A5-11), el seguimiento en `sigre_invitaciones` y la auditoría de
    `sigre_registrar_usuario_invitado`.
- **Frontend:**
  - página pública `/activar-cuenta`. Recibe el enlace de invitación o recuperación, pide la nueva contraseña
    (mínimo 8 caracteres, con letra y número, y confirmación), la guarda con `supabase.auth.updateUser` y entra a
    SIGRE;
  - si no hay enlace, el enlace venció o el token no es válido, lo informa sin mostrar el formulario.
- **Pruebas locales, sin STAGING:**
  - `deno check` de A5;
  - ejecución local de A5 con valores ficticios: 403 para un origen no permitido, 503 sin URL de activación y 401
    sin sesión cuando está configurada;
  - pruebas unitarias `tests/auth` (5/5);
  - `tsc`, ESLint y build;
  - `/activar-cuenta` en el navegador: sin enlace, enlace vencido y token inválido.

## Pasos en STAGING

1. **URLs de Auth: HECHO el 2026-10-30.** Se agregó `http://localhost:5173/activar-cuenta` a Redirect URLs. La Site
   URL se mantuvo en `http://localhost:3000`: A5 envía `redirectTo` explícito, así que no hace falta cambiarla para
   la demostración local.
2. **[AUTORIZACIÓN] SMTP institucional** (Authentication → Emails → SMTP Settings):
   - host, puerto, usuario y contraseña del servidor de correo institucional;
   - remitente: por ejemplo `no-responder@<dominio institucional>`, con nombre «SIGRE»;
   - la persona responsable ingresa los datos directamente en el Dashboard;
   - después se revisa Authentication → Rate Limits (correos por hora).

   Para una primera prueba sin SMTP, el remitente de Supabase solo entrega a correos de miembros del equipo del
   proyecto.
3. **Plantilla «Invite user»** (opcional, recomendado): asunto «Activa tu cuenta en SIGRE», con un enlace a
   `{{ .ConfirmationURL }}`, en español.
4. **[AUTORIZACIÓN] Secreto de la función:**
   `npx supabase secrets set SIGRE_ACTIVATION_URL=http://localhost:5173/activar-cuenta --project-ref febelffifcqzvnttpued`.
   No es un dato sensible, pero cambia la configuración.
5. **[AUTORIZACIÓN] Despliegue de A5:**
   `npx supabase functions deploy sigre-admin-invitar-usuario --project-ref febelffifcqzvnttpued`.
   - Mantiene «Verify JWT» activado, igual que hoy.
   - Debe hacerse **después** del paso 4: sin el secreto, la función nueva rechaza todas las invitaciones con 503.
   - **Reversión:** volver a desplegar la versión original desde una copia temporal de
     `supabase/backups/sigre-admin-invitar-usuario/index.original.ts` con el mismo nombre de función.

## Prueba de extremo a extremo (después de los pasos 1, 4 y 5; el paso 2 para correos externos)

Se hace con una sesión de administrador en `http://localhost:5173` (el único origen permitido):

1. **Duplicado seguro:** invitar `demo.evaluador1@example.com`. Respuesta esperada: 409 `CORREO_REGISTRADO`, sin
   invitación, sin cuenta y sin fila en `sigre_invitaciones`.
2. **[AUTORIZACIÓN] Invitación real:** invitar un correo controlado por el equipo, con rol y documento DEMO
   acordados. Se esperan:
   - 201;
   - una fila `completada` en `sigre_invitaciones`;
   - el perfil y el rol en `usuarios` y `usuario_roles`;
   - la auditoría registrada;
   - un correo recibido.
3. Abrir el enlace del correo, que debe llevar a `/activar-cuenta`. Definir la contraseña y entrar a SIGRE con el rol
   asignado.
4. Cerrar la sesión y volver a entrar con el correo y la nueva contraseña.
5. Verificación de solo lectura: huellas de los usuarios existentes sin cambios y una sola cuenta nueva.
6. **Limpieza** (opcional, con autorización): desactivar el usuario de prueba desde Usuarios.

## Cuando SIGRE tenga una URL pública

El código no tiene direcciones fijas: el origen permitido y la URL de activación salen de la configuración, y el
frontend usa `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. Hará falta:

1. Desplegar el frontend con las variables `VITE_*` del entorno y una regla que sirva `index.html` en cualquier
   ruta (por ejemplo, para abrir `/activar-cuenta` directamente). Hoy el repositorio no tiene esa regla, porque
   depende del hosting que se elija.
2. Auth: agregar `<URL pública>/activar-cuenta` a Redirect URLs y fijar la Site URL en la URL pública.
3. A5: agregar el origen público a `SIGRE_ALLOWED_ORIGINS` y apuntar `SIGRE_ACTIVATION_URL` a
   `<URL pública>/activar-cuenta`.
4. Usar HTTPS. El enlace de invitación lleva tokens en el fragmento de la URL.

## Pendiente fuera de este procedimiento

- Datos institucionales de SMTP y, si existe, la URL pública del frontend de STAGING.
- Para PRODUCCIÓN, el mismo procedimiento con sus propias URLs y una autorización separada.
