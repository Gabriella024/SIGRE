import { ChevronRight } from "lucide-react";
import type { ReportDefinition, ReportId, ReportTone } from "../../../features/informes/types/types";

interface ReportCardProps {
  report: ReportDefinition;
  onOpen?: ((id: ReportId) => void) | undefined;
}

const TONE_STYLES: Record<ReportTone, { icon: string; link: string }> = {
  slate: { icon: "bg-slate-100 text-slate-500", link: "text-slate-900" },
  violet: { icon: "bg-violet-100 text-violet-600", link: "text-violet-700" },
  fuchsia: { icon: "bg-fuchsia-100 text-fuchsia-600", link: "text-fuchsia-800" },
  green: { icon: "bg-green-100 text-green-700", link: "text-green-900" },
  orange: { icon: "bg-orange-100 text-orange-500", link: "text-slate-900" },
  teal: { icon: "bg-teal-100 text-teal-700", link: "text-teal-900" },
  red: { icon: "bg-red-100 text-red-600", link: "text-red-800" },
};

export function ReportCard({ report, onOpen }: ReportCardProps) {
  const Icon = report.icon;
  const tone = TONE_STYLES[report.tone];

  return (
    <button
      type="button"
      onClick={() => onOpen?.(report.id)}
      className="group flex h-full w-full flex-col justify-between gap-6 rounded-xl bg-white p-5 text-left shadow-sm ring-1 ring-slate-100 transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
    >
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

      <span className={`flex items-center justify-between text-sm font-medium ${tone.link}`}>
        Ver informe
        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
  );
}