import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import path from "path"
import tailwindcss from "@tailwindcss/vite"

const STAGING_HOST = "febelffifcqzvnttpued.supabase.co"

function assertStagingTarget(mode: string) {
  if (mode !== "staging") return
  const url = loadEnv(mode, process.cwd(), "VITE_").VITE_SUPABASE_URL ?? ""
  const host = URL.canParse(url) ? new URL(url).hostname : ""
  if (host !== STAGING_HOST) {
    throw new Error(`Modo staging: VITE_SUPABASE_URL debe apuntar a ${STAGING_HOST} (definir en .env.staging.local).`)
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  assertStagingTarget(mode)
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }
})
