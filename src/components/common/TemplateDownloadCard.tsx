import { Download } from 'lucide-react';

export function TemplateDownloadCard() {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 rounded-xl p-4 mt-6 border border-slate-200/60">
      <div className="space-y-1">
        <strong className="block text-xs md:text-sm text-slate-900">
          ¿Aún no tienes el archivo?
        </strong>
        <p className="text-xs text-slate-500">
          Usa nuestra plantilla para organizar correctamente la información.
        </p>
        <p className="text-[11px] text-slate-500">
          <b className="text-slate-900 font-semibold">Columnas requeridas:</b> tipo de documento,
          número de documento, nombres, apellidos, correo y teléfono.
        </p>
      </div>

      <button
        type="button"
        className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-semibold text-xs px-3.5 py-2.5 rounded-lg transition-colors shadow-xs cursor-pointer whitespace-nowrap shrink-0"
      >
        <Download className="w-4 h-4 text-slate-600" />
        Descargar plantilla de Excel
      </button>
    </div>
  );
}