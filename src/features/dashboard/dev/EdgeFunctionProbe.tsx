// TEMPORAL (A5): prueba controlada de Edge Function. Retirar este archivo y su uso en DashboardPage.
import { useState } from 'react'
import { FunctionsFetchError, FunctionsHttpError, FunctionsRelayError } from '@supabase/supabase-js'

import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { useAccessControl } from '@/features/access-control/hooks/useAccessControl'

const FUNCTION_NAME = 'sigre-admin-invitar-usuario'
const STAGING_REF = 'febelffifcqzvnttpued'
const PROBE_ROLES = ['administrador', 'emprendedor']

interface ProbeResult {
  status: number | null
  message: string
}

const HINTS: Record<number, string> = {
  400: 'Autenticación y permisos superados; el cuerpo {} fue rechazado por datos obligatorios incompletos.',
  401: 'Revisar la sesión o la verificación JWT.',
  403: 'Revisar el rol o el permiso usuarios.crear.',
}

async function readBody(response: Response | undefined): Promise<string> {
  if (!response) return ''
  const text = await response.clone().text().catch(() => '')
  try {
    const json: unknown = JSON.parse(text)
    if (json && typeof json === 'object') {
      const record = json as Record<string, unknown>
      const message = record.error ?? record.message ?? record.msg
      if (typeof message === 'string') return message
    }
    return JSON.stringify(json)
  } catch {
    return text
  }
}

async function invokeProbe(): Promise<ProbeResult> {
  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData.session) return { status: null, message: 'No hay sesión activa.' }

  const { data, error, response } = await supabase.functions.invoke(FUNCTION_NAME, {
    method: 'POST',
    body: {},
  })

  if (!error) {
    return {
      status: response?.status ?? 200,
      message: typeof data === 'string' ? data : JSON.stringify(data),
    }
  }

  if (error instanceof FunctionsHttpError) {
    const errorResponse = error.context instanceof Response ? error.context : response
    return {
      status: errorResponse?.status ?? null,
      message: (await readBody(errorResponse)) || error.message,
    }
  }

  if (error instanceof FunctionsRelayError || error instanceof FunctionsFetchError) {
    return { status: response?.status ?? null, message: `${error.name}: ${error.message}` }
  }

  return { status: null, message: error instanceof Error ? error.message : String(error) }
}

export function EdgeFunctionProbe() {
  const { hasRole } = useAccessControl()
  const [result, setResult] = useState<ProbeResult | null>(null)
  const [running, setRunning] = useState(false)

  const isStaging = String(import.meta.env.VITE_SUPABASE_URL ?? '').includes(STAGING_REF)
  if (!import.meta.env.DEV || !isStaging || !PROBE_ROLES.some(hasRole)) return null

  const run = async () => {
    setRunning(true)
    setResult(null)
    try {
      const probe = await invokeProbe()
      console.info(`[A5] ${FUNCTION_NAME} → ${probe.status ?? 'sin código'}: ${probe.message}`)
      setResult(probe)
    } catch (err) {
      setResult({ status: null, message: err instanceof Error ? err.message : String(err) })
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="rounded-lg border border-dashed border-amber-400 bg-amber-50 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-amber-900">Prueba temporal A5 · Edge Function (STAGING)</p>
          <p className="text-xs text-amber-800">
            POST {FUNCTION_NAME} con cuerpo vacío {'{}'}. No envía invitaciones.
          </p>
        </div>
        <Button size="sm" variant="outline" disabled={running} onClick={() => void run()}>
          {running ? 'Probando...' : 'Probar Edge Function'}
        </Button>
      </div>

      {result && (
        <div className="rounded-md bg-white p-3 text-sm space-y-1">
          <p>
            <span className="font-medium">HTTP:</span> {result.status ?? 'sin código'}
          </p>
          <p className="break-words">
            <span className="font-medium">Mensaje:</span> {result.message || '(vacío)'}
          </p>
          {result.status !== null && HINTS[result.status] && (
            <p className="text-slate-600">{HINTS[result.status]}</p>
          )}
        </div>
      )}
    </div>
  )
}
