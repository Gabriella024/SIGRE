import { FileSpreadsheet, Trash2, Check } from 'lucide-react';

interface FilePreviewProps {
  fileName: string;
  fileSize: string;
  rows: string[][];
  onRemove?: () => void;
}

export function FilePreview({ fileName, fileSize, rows, onRemove }: FilePreviewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3.5 border border-emerald-500 bg-emerald-50/40 rounded-xl p-3 md:p-4">
        <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 grid place-items-center shrink-0">
          <FileSpreadsheet className="w-5 h-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-xs md:text-sm font-semibold text-slate-900 truncate">
            {fileName}
          </div>
          <small className="text-xs text-slate-500">{fileSize} · Archivo de Excel</small>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-semibold text-xs px-2.5 py-1 rounded-full">
            <Check className="w-3.5 h-3.5" />
            Listo
          </span>
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 font-semibold text-xs transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            Quitar
          </button>
        </div>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-200 text-xs text-slate-500 bg-slate-50">
          <div>
            <b className="text-slate-900 mr-1">Vista previa</b> Primeras {rows.length} filas
          </div>
          <span>Registros detectados</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
                <th className="px-3.5 py-2.5">TIPO</th>
                <th className="px-3.5 py-2.5">DOCUMENTO</th>
                <th className="px-3.5 py-2.5">NOMBRES</th>
                <th className="px-3.5 py-2.5">APELLIDOS</th>
                <th className="px-3.5 py-2.5">CORREO</th>
                <th className="px-3.5 py-2.5">TELÉFONO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {rows.map((row, idx) => (
                <tr key={`${row[1]}-${idx}`} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-3.5 py-2.5">{row[0]}</td>
                  <td className="px-3.5 py-2.5 font-medium text-slate-900">{row[1]}</td>
                  <td className="px-3.5 py-2.5">{row[2]}</td>
                  <td className="px-3.5 py-2.5">{row[3]}</td>
                  <td className="px-3.5 py-2.5 text-slate-500">{row[4]}</td>
                  <td className="px-3.5 py-2.5">{row[5]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}