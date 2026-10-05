import { Check, AlertTriangle, Copy, Info, ChevronRight } from 'lucide-react';

export type EstadoValidacion = 'valida' | 'error' | 'duplicada' | 'existente';

export interface ResumenItem {
  estado: EstadoValidacion;
  valor: number;
  etiqueta: string;
}

interface ValidationSummaryCardsProps {
  resumen: ResumenItem[];
  filasTotales: number;
  filtroActivo?: EstadoValidacion | 'todas';
  onSeleccionarFiltro?: (estado: EstadoValidacion) => void;
}

const ESTILOS_ESTADO: Record<
  EstadoValidacion,
  { bg: string; border: string; text: string; iconBg: string; icon: React.ReactNode }
> = {
  valida: {
    bg: 'bg-emerald-50/60 hover:bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-900',
    iconBg: 'bg-emerald-100 text-emerald-700',
    icon: <Check className="w-4 h-4 stroke-[2.5]" />,
  },
  error: {
    bg: 'bg-rose-50/60 hover:bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-900',
    iconBg: 'bg-rose-100 text-rose-700',
    icon: <AlertTriangle className="w-4 h-4 stroke-[2.5]" />,
  },
  duplicada: {
    bg: 'bg-amber-50/60 hover:bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-900',
    iconBg: 'bg-amber-100 text-amber-700',
    icon: <Copy className="w-4 h-4" />,
  },
  existente: {
    bg: 'bg-sky-50/60 hover:bg-sky-50',
    border: 'border-sky-200',
    text: 'text-sky-900',
    iconBg: 'bg-sky-100 text-sky-700',
    icon: <Info className="w-4 h-4" />,
  },
};

export function ValidationSummaryCards({
  resumen,
  filasTotales,
  filtroActivo,
  onSeleccionarFiltro,
}: ValidationSummaryCardsProps) {
  return (
    <div className="space-y-2 my-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {resumen.map((r) => {
          const estilo = ESTILOS_ESTADO[r.estado];
          const esActivo = filtroActivo === r.estado;

          return (
            <button
              type="button"
              key={r.estado}
              onClick={() => onSeleccionarFiltro?.(r.estado)}
              className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all cursor-pointer ${estilo.bg
                } ${estilo.border} ${esActivo ? 'ring-2 ring-slate-800 shadow-xs' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${estilo.iconBg}`}>{estilo.icon}</div>
                <div>
                  <b className={`text-xl font-bold block leading-none ${estilo.text}`}>
                    {r.valor}
                  </b>
                  <span className="text-xs font-medium text-slate-600">{r.etiqueta}</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          );
        })}
      </div>

      <p className="text-xs text-slate-500 font-medium pt-1">
        <strong className="text-slate-800 font-semibold">{filasTotales}</strong> filas procesadas en total
      </p>
    </div>
  );
}