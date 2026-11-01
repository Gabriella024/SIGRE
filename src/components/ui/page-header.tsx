import type { ReactNode } from "react";

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, description, eyebrow, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 space-y-1">
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-700">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.75rem]">{title}</h1>
        {description && <p className="text-[0.9375rem] text-slate-600">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
