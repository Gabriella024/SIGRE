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

export function PendingValue({ label = PENDING_MIGRATION_LABEL }: { label?: string }) {
  return (
    <span title={label} className="text-xs italic text-slate-400">
      Pendiente
    </span>
  );
}
