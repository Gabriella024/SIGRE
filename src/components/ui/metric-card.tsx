import type { LucideIcon } from "lucide-react";

type MetricTone = "blue" | "green" | "red" | "amber";

const TONES: Record<MetricTone, { icon: string; dot: string }> = {
  blue: { icon: "bg-sky-50 text-sky-700 ring-sky-100", dot: "bg-sky-500" },
  green: { icon: "bg-brand-50 text-brand-700 ring-brand-100", dot: "bg-brand-500" },
  red: { icon: "bg-rose-50 text-rose-700 ring-rose-100", dot: "bg-rose-500" },
  amber: { icon: "bg-amber-50 text-amber-700 ring-amber-100", dot: "bg-amber-500" },
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
    <div className="group flex min-w-0 flex-col justify-between rounded-2xl border border-slate-200/70 bg-surface p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-shadow hover:shadow-[0_4px_16px_-4px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm font-medium leading-snug text-slate-600">{title}</span>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${styles.icon}`}>
          <Icon className="h-[18px] w-[18px] stroke-[1.75]" aria-hidden="true" />
        </div>
      </div>
      <div className="mt-5 space-y-1.5">
        <p className="text-[2rem] font-semibold leading-none tracking-tight text-slate-900 tabular-nums">
          {value === null ? "—" : numberFormat.format(value)}
        </p>
        <p className="flex min-h-5 items-center gap-1.5 text-[0.8125rem] text-slate-600">
          {hint && <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${styles.dot}`} aria-hidden="true" />}
          {hint}
        </p>
      </div>
    </div>
  );
}
