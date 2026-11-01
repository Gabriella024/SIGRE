import { ChevronRight } from "lucide-react";
import type { ReportDefinition, ReportId, ReportTone } from "../../../features/informes/types/types";

interface ReportCardProps {
  report: ReportDefinition;
  onOpen?: ((id: ReportId) => void) | undefined;
}

const TONE_STYLES: Record<ReportTone, { icon: string; link: string }> = {
  slate: { icon: "bg-slate-100 text-slate-500", link: "text-slate-900" },
  violet: { icon: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-100", link: "text-sky-800" },
  fuchsia: { icon: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200", link: "text-slate-900" },
  green: { icon: "bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100", link: "text-brand-800" },
  orange: { icon: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-100", link: "text-slate-900" },
  teal: { icon: "bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100", link: "text-brand-800" },
  red: { icon: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-100", link: "text-slate-900" },
};

export function ReportCard({ report, onOpen }: ReportCardProps) {
  const Icon = report.icon;
  const tone = TONE_STYLES[report.tone];

  const content = (
    <>
      <div className="flex items-start gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone.icon}`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-medium text-slate-900">{report.title}</h3>
          <p className="mt-1 text-sm leading-snug text-slate-500">{report.description}</p>
        </div>
      </div>

      {onOpen ? (
        <span className={`flex items-center justify-between text-sm font-medium ${tone.link}`}>
          Ver informe
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      ) : (
        <span className="text-xs font-medium text-slate-400">Disponible próximamente</span>
      )}
    </>
  );

  if (!onOpen) {
    return (
      <div className="flex h-full w-full flex-col justify-between gap-6 rounded-2xl border border-slate-200/70 bg-surface p-5 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onOpen(report.id)}
      className="group flex h-full w-full flex-col justify-between gap-6 rounded-2xl border border-slate-200/70 bg-surface p-5 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
    >
      {content}
    </button>
  );
}