# SIGRE · A5 · Propuesta mínima de activación de usuarios reales (NO APLICADA)

## Situación verificada (STAGING, 2026-10-30, solo lectura)

| Punto | Estado |
|---|---|
| A5 (`sigre-admin-invitar-usuario`) | Crea la cuenta con `inviteUserByEmail` (sin contraseña) y registra perfil + rol con `sigre_registrar_usuario_invitado`. |
| SMTP personalizado | Desactivado. El remitente por defecto de Supabase solo entrega a miembros del equipo del proyecto y con límite bajo de envíos por hora. |
| Site URL | `http://localhost:3000`; sin Redirect URLs. El enlace de invitación no regresa a SIGRE. |
| Frontend | No existe pantalla para aceptar la invitación ni para definir o recuperar contraseña (`/login` solo acepta correo y contraseña). |

Resultado: una invitación A5 a un correo real crea una cuenta a la que la persona no puede entrar.

## Solución mínima (4 pasos, sin cambiar el framework)

1. **SMTP institucional** (configuración de Auth): habilitar SMTP personalizado con un remitente del SENA o del proyecto.
2. **URLs de Auth** (configuración de Auth): Site URL = URL pública del frontend; Redirect URLs = `<frontend>/activar-cuenta`
   (y `http://localhost:5173/activar-cuenta` solo en STAGING).
3. **A5, cambio de una línea** (requiere autorización expresa para tocar A5):
   `admin.auth.admin.inviteUserByEmail(correo, { redirectTo: Deno.env.get("SIGRE_ACTIVATION_URL") })`.
4. **Frontend, página pública `/activar-cuenta`**:
   - supabase-js toma la sesión del enlace (`detectSessionInUrl`, ya activo por defecto);
   - formulario de nueva contraseña con confirmación → `supabase.auth.updateUser({ password })`;
   - al terminar, redirige a `/` (los permisos se cargan como hoy).
   - En `/login`, enlace «¿Olvidaste tu contraseña?» → `supabase.auth.resetPasswordForEmail(correo, { redirectTo: <frontend>/activar-cuenta })`.
     La misma página atiende invitación y recuperación.

Los pasos 1 y 2 son configuración, sin código. Los pasos 3 y 4 son cambios pequeños y se prueban en STAGING con un
correo real controlado por el equipo antes de producción.

## Alternativa operativa mientras tanto (sin código)

Igual que con las cuentas DEMO: el administrador crea la cuenta en *Authentication → Add user* (con contraseña
temporal y «Auto Confirm User»), completa el perfil y el rol con un script revisado, y entrega la contraseña por un
canal seguro. Sirve para un grupo piloto pequeño, pero no escala y no permite que la persona cambie su contraseña.
