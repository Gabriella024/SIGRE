import { AlertCircle } from 'lucide-react';

interface ValidationAlertProps {
  erroresCount: number;
}

export function ValidationAlert({ erroresCount }: ValidationAlertProps) {
  if (erroresCount === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
      <div className="text-xs text-amber-900 space-y-1">
        <strong className="font-semibold block text-sm">
          Se encontraron {erroresCount} filas con observaciones
        </strong>
        <p className="text-amber-800">
          Los registros marcados como <b>Con error</b> o <b>Duplicada</b> no se registrarán en el sistema. Puedes corregir el archivo y volver a cargarlo.
        </p>
      </div>
    </div>
  );
}