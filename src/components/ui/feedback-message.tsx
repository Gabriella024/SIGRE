import { AlertCircle, CheckCircle2, Info } from "lucide-react";

export type FeedbackType = "success" | "error" | "info";

const STYLES: Record<FeedbackType, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-rose-200 bg-rose-50 text-rose-800",
  info: "border-sky-200 bg-sky-50 text-sky-800",
};

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info } as const;

export function FeedbackMessage({ type, message }: { type: FeedbackType; message: string }) {
  const Icon = ICONS[type];

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${STYLES[type]}`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {message}
    </div>
  );
}
