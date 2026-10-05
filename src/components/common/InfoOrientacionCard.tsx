import { Home, FileSpreadsheet, Calendar, User } from 'lucide-react';

interface InfoOrientacionProps {
  orientacion: string;
  detallesOrientacion: string;
  archivoNombre: string;
  fechaCarga: string;
  cargadoPor: string;
}

export function InfoOrientacionCard({
  orientacion,
  detallesOrientacion,
  archivoNombre,
  fechaCarga,
  cargadoPor,
}: InfoOrientacionProps) {
  return (
    <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-slate-100 rounded-lg text-slate-600 shrink-0 mt-0.5">
          <Home className="w-5 h-5" />
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            ORIENTACIÓN ASOCIADA
          </span>
          <strong className="text-sm font-semibold text-slate-900 block leading-snug">
            {orientacion}
          </strong>
          <span className="text-xs text-slate-500 block">{detallesOrientacion}</span>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="p-2 bg-slate-100 rounded-lg text-emerald-600 shrink-0 mt-0.5">
          <FileSpreadsheet className="w-5 h-5" />
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            ARCHIVO
          </span>
          <strong className="text-sm font-semibold text-emerald-800 block break-all">
            {archivoNombre}
          </strong>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="p-2 bg-slate-100 rounded-lg text-slate-600 shrink-0 mt-0.5">
          <Calendar className="w-5 h-5" />
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            FECHA DE CARGA
          </span>
          <strong className="text-sm font-semibold text-slate-800 block">
            {fechaCarga}
          </strong>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="p-2 bg-slate-100 rounded-lg text-slate-600 shrink-0 mt-0.5">
          <User className="w-5 h-5" />
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            CARGADO POR
          </span>
          <strong className="text-sm font-semibold text-slate-800 block">
            {cargadoPor}
          </strong>
        </div>
      </div>
    </section>
  );
}