# SIGRE

Sistema de gestión de la ruta emprendedora (React + TypeScript + Vite + Supabase).

## Desarrollo local

1. Instalar dependencias: `npm install`.
2. Definir las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en `.env.development.local` (no se versiona).
3. Iniciar: `npm run dev` y abrir **`http://localhost:5173`**.
   - Es la dirección verificada: Vite escucha en `localhost` y `127.0.0.1:5173` puede no responder.
   - Es además el único origen admitido por la Edge Function A5 (`SIGRE_ALLOWED_ORIGINS`) y por la URL de activación.

## Verificación

| Comando | Qué valida |
|---|---|
| `npx tsc -b` | Tipos |
| `npm run lint` | ESLint completo |
| `npm test` | Pruebas unitarias (`tests/**/*.test.ts`, `node --test`) |
| `npm run build` | Build de producción |

Migraciones, propuestas y diagnósticos SQL: ver `supabase/` y `docs/informe_entrega_mvp.md`.

---

## Plantilla base (React + TypeScript + Vite)

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```
