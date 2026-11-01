import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface SectionCardProps {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function SectionCard({ title, description, actions, footer, className, children }: SectionCardProps) {
  return (
    <section className={cn("flex flex-col rounded-2xl border border-slate-200/70 bg-surface p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6", className)}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <h2 className="text-[0.95rem] font-semibold text-slate-900">{title}</h2>}
            {description && <p className="mt-1 text-[0.8125rem] text-slate-600">{description}</p>}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </header>
      )}
      <div className={cn("flex-1", (title || actions) && "mt-5")}>{children}</div>
      {footer && <footer className="mt-5 border-t border-slate-100 pt-4">{footer}</footer>}
    </section>
  );
}

export function EmptyPanel({ children }: { children: ReactNode }) {
  return (
    <p className="flex min-h-32 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-surface-muted px-4 py-8 text-center text-sm text-slate-600">
      {children}
    </p>
  );
}
