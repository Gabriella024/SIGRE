import type { FilaRegistro } from '@/features/orientacionMasiva/types/cargaMasiva';

interface TablaResultadosReadOnlyProps {
  filas: FilaRegistro[];
  resumenCounts: {
    valida: number;
    error: number;
    duplicada: number;
    existente: number;
  };
}

export function TablaResultadosReadOnly({ filas, resumenCounts }: TablaResultadosReadOnlyProps) {
  const filasExitosas = filas.filter((f) => f.estado === 'valida');

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden space-y-4">
      <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50/50">
        <div>
          <h3 className="text-base font-semibold text-slate-800">
            Registros Procesados Exitosamente
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Se registraron <strong className="text-emerald-700">{resumenCounts.valida}</strong> de {filas.length} asistentes en la plataforma.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-medium rounded-full">
            {resumenCounts.valida} Guardados
          </span>
          {resumenCounts.error + resumenCounts.duplicada + resumenCounts.existente > 0 && (
            <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-medium rounded-full">
              {resumenCounts.error + resumenCounts.duplicada + resumenCounts.existente} Omitidos
            </span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-medium">
              <th className="py-3 px-4 w-12 text-center">#</th>
              <th className="py-3 px-4">Documento</th>
              <th className="py-3 px-4">Nombre Completo</th>
              <th className="py-3 px-4">Correo Electrónico</th>
              <th className="py-3 px-4 text-center">Estado Carga</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filasExitosas.length > 0 ? (
              filasExitosas.map((fila, index) => (
                <tr key={fila.fila} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 text-center text-slate-400 font-mono">
                    {index + 1}
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-mono font-medium">
                    {fila.doc}
                  </td>
                  <td className="py-3 px-4 text-slate-800 font-medium">
                    {fila.nombre}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {fila.correo}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                      </svg>
                      Registrado
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  No se registraron nuevos asistentes en esta sesión.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}