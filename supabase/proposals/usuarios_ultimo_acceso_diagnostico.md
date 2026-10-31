# SIGRE · «Último acceso» siempre aparece como «Nunca» · Diagnóstico (NO IMPLEMENTADO)

## Síntoma

En Usuarios, la columna «Último acceso» dice «Nunca» para todas las personas, incluidas las que ya iniciaron
sesión (administrador, orientador, emprendedor y evaluadores DEMO).

## Causa (verificada el 2026-10-30)

- El frontend muestra `public.usuarios.ultimo_acceso` (`src/features/users/schemas/userSchema.ts`,
  `userUtils.ts`, `columns.tsx`) y escribe «Nunca» cuando el valor es NULL.
- **Nadie escribe esa columna.** En el repositorio y en la extracción completa de STAGING, `ultimo_acceso` solo
  aparece en la definición de la tabla.
- Al iniciar sesión, Supabase Auth actualiza `auth.users.last_sign_in_at`, que es otra tabla y no se copia a
  `public.usuarios`.
- **Consulta de solo lectura en STAGING:**
  - 8 perfiles, 0 con `ultimo_acceso`;
  - 7 cuentas Auth con `last_sign_in_at`;
  - 7 perfiles que iniciaron sesión tienen `ultimo_acceso` en NULL;
  - 0 funciones escriben la columna y no hay triggers en `auth.users`.

No es una regresión del MVP: la funcionalidad nunca estuvo conectada.

## Opciones de corrección (requieren autorización; ninguna aplicada)

| Opción | Cómo | Ventajas | Riesgos |
|---|---|---|---|
| **A · Trigger en Auth** (recomendada) | Función `SECURITY DEFINER` + trigger `AFTER UPDATE OF last_sign_in_at ON auth.users` que copia el valor a `public.usuarios.ultimo_acceso` | Automático, en el servidor, sin cambios en el frontend | Es un trigger sobre el esquema `auth`, gestionado por Supabase. Debe ser mínimo y tolerar errores, para no bloquear jamás un inicio de sesión. |
| B · RPC al iniciar sesión | `sigre_registrar_acceso()` que actualiza solo la fila de `auth.uid()`; el frontend la llama después de `signInWithPassword` | No toca el esquema `auth` | Depende del cliente: si la llamada falla, no se registra |
| C · Leer de Auth | RPC solo para administradores que devuelve `last_sign_in_at` por usuario | No duplica datos | Requiere cambiar el servicio y el esquema del frontend |

## Propuesta para la opción A (borrador, sin probar en STAGING)

```sql
CREATE OR REPLACE FUNCTION public.sigre_sincronizar_ultimo_acceso()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
BEGIN
  UPDATE public.usuarios SET ultimo_acceso = NEW.last_sign_in_at
  WHERE id = NEW.id AND ultimo_acceso IS DISTINCT FROM NEW.last_sign_in_at;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW; -- nunca bloquear el inicio de sesión
END;
$$;
REVOKE ALL ON FUNCTION public.sigre_sincronizar_ultimo_acceso() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER sigre_ultimo_acceso
AFTER UPDATE OF last_sign_in_at ON auth.users
FOR EACH ROW WHEN (NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at)
EXECUTE FUNCTION public.sigre_sincronizar_ultimo_acceso();
```

**Pendientes de revisión antes de aplicarla:**
- Si se rellenan los valores actuales a partir de `auth.users`. Es un cambio de datos y requiere autorización.
- **Interacción con el control de versiones.** STAGING tiene el trigger `set_updated_at_usuarios`, así que cada
  inicio de sesión cambiaría `usuarios.updated_at`. Como `sigre_admin_editar_usuario` y
  `sigre_admin_cambiar_estado_usuario` comparan `p_updated_at_esperado`, un administrador que esté editando a
  alguien que acaba de entrar recibiría un conflicto (PT409). Antes de aplicar la opción A hay que decidir si:
  - el trigger `set_updated_at` ignora los cambios que afectan solo a `ultimo_acceso`, o
  - se usa la opción C.
- Pruebas en una transacción revertida y una migración portable.
