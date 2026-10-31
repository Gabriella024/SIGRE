import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { formatDateOnly } from '@/lib/format';

import {
  consultarInvitacionRuta,
  responderInvitacionRuta,
  type InvitacionRuta,
} from '@/features/orientation-mass/services/invitacionRutaService';

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function InvitacionRutaPage() {
  const { token = '' } = useParams();
  const valido = GUID.test(token);
  const [invitacion, setInvitacion] = useState<InvitacionRuta | null>(null);
  const [cargando, setCargando] = useState(valido);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(valido ? null : 'El enlace de la invitación no es válido.');

  useEffect(() => {
    if (!valido) return;
    let activo = true;
    consultarInvitacionRuta(token)
      .then((data) => {
        if (!activo) return;
        if (data) setInvitacion(data);
        else setError('La invitación no existe o el enlace no es válido.');
      })
      .catch((e: unknown) => activo && setError(e instanceof Error ? e.message : 'No fue posible consultar la invitación.'))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, [token, valido]);

  const responder = async (acepta: boolean) => {
    if (!invitacion || enviando) return;
    setEnviando(true);
    setError(null);
    try {
      await responderInvitacionRuta(token, acepta);
      setInvitacion({ ...invitacion, estado: acepta ? 'aceptada' : 'rechazada' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No fue posible registrar tu respuesta.');
    } finally {
      setEnviando(false);
    }
  };

  const pendiente = invitacion?.estado === 'pendiente' || invitacion?.estado === 'enviada';

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Ruta Emprendedora SENA</h1>
        {cargando && <p className="text-sm text-slate-500">Consultando tu invitación…</p>}
        {invitacion && (
          <>
            <p className="text-sm text-slate-700">
              Hola, <strong>{invitacion.nombres}</strong>. Participaste en la orientación
              {invitacion.jornada ? ` «${invitacion.jornada}»` : ''}
              {invitacion.fecha ? ` del ${formatDateOnly(invitacion.fecha)}` : ''}.
            </p>
            {pendiente ? (
              <>
                <p className="text-sm text-slate-600">
                  ¿Deseas continuar con el registro formal en la Ruta Emprendedora de Fondo Emprender? Tu decisión es
                  voluntaria.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={enviando}
                    onClick={() => void responder(true)}
                    className="flex-1 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Sí, deseo continuar
                  </button>
                  <button
                    type="button"
                    disabled={enviando}
                    onClick={() => void responder(false)}
                    className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
                  >
                    No, gracias
                  </button>
                </div>
              </>
            ) : (
              <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
                {invitacion.estado === 'aceptada'
                  ? 'Registramos tu interés. Un orientador te contactará para continuar con el registro formal.'
                  : invitacion.estado === 'rechazada'
                    ? 'Registramos tu decisión de no continuar. Gracias por participar.'
                    : 'Esta invitación no está disponible.'}
              </p>
            )}
          </>
        )}
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
