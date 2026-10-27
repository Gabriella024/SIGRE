import type { ConsolidatedResult } from '@/features/evaluations/types/resultado'

const styles: Record<ConsolidatedResult, string> = {
  'Calificación completa': "bg-sky-100 text-sky-700",
  'En revisión': "bg-yellow-100 text-yellow-700"
};

export function ResultBadge({ estado }: { estado: ConsolidatedResult }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[estado]}`}>
      {estado}
    </span>
  );
}
