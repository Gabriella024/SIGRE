# Guía del Proyecto

## Tech Stack
- Frontend: React + TypeScript + Tailwind CSS + shadcn/ui
- Backend: Node.js + Express + TypeScript
- Database & Auth: Supabase (PostgreSQL)

## Arquitectura & Estructura
- Arquitectura por capas en Backend: `Controller` -> `Service` -> `Repository` / `Supabase Client`.
- Mantener lógica de negocio separada en servicios; los controladores solo gestionan req/res.

## Reglas de Código
- Tipado estricto en TypeScript (evitar `any`).
- Respuestas de API estándar: `{ success: boolean, data: any, error: string | null }`.
- Manejo de clientes Supabase: usar cliente `anon` para operaciones públicas/Auth y `service_role` solo en backend seguro cuando se requiera bypass de RLS.
- Código limpio e idiomático. No agregar comentarios redundantes ni explicaciones largas salvo solicitud explícita.
- Responde siempre directo al punto con cambios concretos de código.

<!-- rtk-instructions v2 -->
# Command output

Command output here is condensed to save tokens, keeping every signal and
dropping costly noise. Treat it as the complete result: run commands
normally, and batch related commands into one call to avoid extra turns.
Truncated results state their recovery path in their own output. Re-run a
command as `rtk proxy <cmd>` only when its result is unusable: empty when
output was clearly expected, contradicting its exit code, or garbled.


<!-- /rtk-instructions -->

## Rules for Token Optimization
- Give direct code solutions without repeating unchanged code or long conversational filler.
- Focus strictly on the files mentioned.
- Do not explain standard library functions or basic React patterns unless asked.