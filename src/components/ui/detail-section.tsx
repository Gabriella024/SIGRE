import { useId, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export function DetailCard({ title, children }: { title: string; children: ReactNode }) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 id={headingId} className="text-base font-semibold text-slate-900">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <DetailCard title={title}>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">{children}</dl>
    </DetailCard>
  );
}

export function DetailField({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={cn("min-w-0 space-y-0.5", wide && "sm:col-span-2")}>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="break-words text-sm text-slate-800">{children}</dd>
    </div>
  );
}
