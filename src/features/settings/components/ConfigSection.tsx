import type { ReactNode } from "react";

import { ReadOnlyBadge } from "@/components/ui/pending-integration";

interface ConfigSectionProps {
  id: string;
  title: string;
  description: string;
  action?: ReactNode;
  readOnly?: boolean;
  children: ReactNode;
}

export default function ConfigSection({
  id,
  title,
  description,
  action,
  readOnly = false,
  children,
}: ConfigSectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-6"
    >
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id={`${id}-title`}
            className="text-xl font-semibold text-[#0f2f4a]"
          >
            {title}
            {readOnly && <ReadOnlyBadge />}
          </h2>

          <p className="mt-0.5 text-sm text-slate-500">
            {description}
          </p>
        </div>

        {action}
      </header>

      {children}
    </section>
  );
}