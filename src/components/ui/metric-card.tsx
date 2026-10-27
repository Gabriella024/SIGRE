import type { LucideIcon } from "lucide-react";

type MetricTone = "blue" | "green" | "red" | "amber";

const TONES: Record<MetricTone, { border: string; icon: string }> = {
  blue: { border: "border-l-blue-500", icon: "bg-blue-100/80 text-blue-600" },
  green: { border: "border-l-emerald-500", icon: "bg-emerald-100/80 text-emerald-600" },
  red: { border: "border-l-rose-500", icon: "bg-rose-100/80 text-rose-600" },
  amber: { border: "border-l-amber-500", icon: "bg-amber-100/80 text-amber-600" },
};

const numberFormat = new Intl.NumberFormat("es-CO");

interface MetricCardProps {
  title: string;
  value: number | null;
  icon: LucideIcon;
  tone: MetricTone;
  hint?: string;
}

export function MetricCard({ title, value, icon: Icon, tone, hint }: MetricCardProps) {
  const styles = TONES[tone];

  return (
    <div
      className={`flex min-w-0 flex-col justify-between rounded-2xl border border-l-[5px] border-slate-100 bg-white p-5 shadow-sm ${styles.border}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-semibold text-slate-700">{title}</span>
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${styles.icon}`}>
          <Icon className="h-4 w-4 stroke-[2.2]" aria-hidden="true" />
        </div>
      </div>
      <div className="mt-4 space-y-1">
        <p className="text-3xl font-bold tracking-tight text-slate-900">
          {value === null ? "—" : numberFormat.format(value)}
        </p>
        <p className="min-h-4 text-xs text-slate-500">{hint}</p>
      </div>
    </div>
  );
}
