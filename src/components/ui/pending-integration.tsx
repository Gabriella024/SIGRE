import type { ReactNode } from "react";
import { Info } from "lucide-react";

import { cn } from "@/lib/utils";

interface PendingIntegrationNoticeProps {
  title?: string;
  children?: ReactNode;
  className?: string;
}

export function PendingIntegrationNotice({
  title = "Pendiente de integración",
  children,
  className,
}: PendingIntegrationNoticeProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900",
        className
      )}
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      <div className="space-y-0.5">
        <p className="font-semibold">{title}</p>
        {children && <div className="text-amber-800">{children}</div>}
      </div>
    </div>
  );
}

export function ReadOnlyBadge() {
  return (
    <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 align-middle text-[11px] font-semibold text-amber-800">
      Solo lectura
    </span>
  );
}
