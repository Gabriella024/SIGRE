import { Upload, FileSpreadsheet } from 'lucide-react';

interface DropzoneProps {
  onSelectFile?: () => void;
}

export function Dropzone({ onSelectFile }: DropzoneProps) {
  return (
    <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white transition-colors">
      <div className="flex items-center gap-4 text-center sm:text-left">
        <div className="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-700 grid place-items-center shrink-0">
          <FileSpreadsheet className="w-6 h-6" />
        </div>
        <div>
          <strong className="block text-sm text-slate-800 font-medium">
            Arrastra tu archivo aquí o{' '}
            <button
              type="button"
              onClick={onSelectFile}
              className="text-emerald-700 underline cursor-pointer hover:text-emerald-800 font-semibold inline"
            >
              haz clic para seleccionarlo
            </button>
          </strong>
          <small className="text-xs text-slate-500 block mt-0.5">
            Solo archivos .xlsx · Tamaño máximo 5 MB
          </small>
        </div>
      </div>

      <button
        type="button"
        onClick={onSelectFile}
        className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors shadow-xs cursor-pointer whitespace-nowrap"
      >
        <Upload className="w-4 h-4" />
        Seleccionar archivo
      </button>
    </div>
  );
}