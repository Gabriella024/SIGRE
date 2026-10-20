import { CheckSquare, UserPlus } from "lucide-react";

import { NullableText } from "@/components/ui/nullable-text";

import { PENDING_MIGRATION_LABEL } from "../constants/jornada";
import { isUrl } from "../utils/orientationUtils";

export function LugarLink({ value }: { value: string | null }) {
  if (value && isUrl(value)) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sky-700 underline hover:text-sky-900"
      >
        Abrir enlace
      </a>
    );
  }

  return <NullableText value={value} />;
}

export function AttendanceButton({ className, onClick }: { className: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      className={className}
      disabled={!onClick}
      onClick={onClick}
      aria-label="Marcar asistencia"
      title={onClick ? "Marcar asistencia" : "Marcar asistencia: requiere permiso de edición"}
    >
      <CheckSquare className="h-4 w-4" />
    </button>
  );
}

export function EnrollButton({ className, onClick }: { className: string; onClick: () => void }) {
  return (
    <button type="button" className={className} onClick={onClick} aria-label="Inscribir emprendedor" title="Inscribir emprendedor">
      <UserPlus className="h-4 w-4" />
    </button>
  );
}

export function PendingValue({ label = PENDING_MIGRATION_LABEL }: { label?: string }) {
  return (
    <span title={label} className="text-xs italic text-slate-400">
      Pendiente
    </span>
  );
}

export { FeedbackMessage } from "@/components/ui/feedback-message";
