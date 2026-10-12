import { useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';

const ACCEPTED_EXTENSION = '.xlsx';
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

interface DropzoneProps {
  onSelectFile: (file: File) => void;
}

function validateFile(file: File): string | null {
  if (!file.name.toLowerCase().endsWith(ACCEPTED_EXTENSION)) {
    return 'Solo se admiten archivos .xlsx.';
  }
  if (file.size > MAX_SIZE_BYTES) {
    return 'El archivo supera el tamaño máximo de 5 MB.';
  }
  return null;
}

export function Dropzone({ onSelectFile }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const validationError = validateFile(file);
    setError(validationError);
    if (!validationError) onSelectFile(file);
  };

  const openPicker = () => inputRef.current?.click();

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFile(event.target.files?.[0]);
    event.target.value = '';
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files[0]);
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed ${isDragging ? 'border-emerald-500 bg-emerald-50/40' : 'border-slate-300 bg-white'} hover:border-emerald-500 rounded-xl p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={`${ACCEPTED_EXTENSION},application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`}
          onChange={handleChange}
          className="hidden"
        />

        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-700 grid place-items-center shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <strong className="block text-sm text-slate-800 font-medium">
              Arrastra tu archivo aquí o{' '}
              <button
                type="button"
                onClick={openPicker}
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
          onClick={openPicker}
          className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors shadow-xs cursor-pointer whitespace-nowrap"
        >
          <Upload className="w-4 h-4" />
          Seleccionar archivo
        </button>
      </div>

      {error && (
        <p role="alert" className="text-xs font-medium text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
