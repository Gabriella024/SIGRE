import { Check } from 'lucide-react';

interface HeaderConfirmadoProps {
  fechaConfirmacion: string;
}

export function HeaderConfirmado({ fechaConfirmacion }: HeaderConfirmadoProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Resultado de validación
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Revisa los registros encontrados antes de confirmar la carga.
        </p>
      </div>

      <div
        role="status"
        className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-xs self-start sm:self-auto"
      >
        <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
          <Check className="w-2.5 h-2.5 stroke-[3]" />
        </div>
        <span>Carga confirmada · {fechaConfirmacion}</span>
      </div>
    </div>
  );
}