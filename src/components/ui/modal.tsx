import type { ReactNode } from "react";
import { Dialog } from "radix-ui";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/40" />
        <Dialog.Content
          {...(description ? {} : { "aria-describedby": undefined })}
          className={cn(
            "fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl focus:outline-none",
            className
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
            <div className="space-y-1">
              <Dialog.Title className="text-lg font-semibold text-slate-900">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="text-sm text-slate-500">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close
              aria-label="Cerrar"
              className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <div className="overflow-y-auto px-5 py-4">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
