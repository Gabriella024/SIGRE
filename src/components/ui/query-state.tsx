import { AlertCircle, Inbox, Loader2 } from "lucide-react";

export function LoadingState({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-12 text-sm text-slate-500"
    >
      <Loader2 className="h-4 w-4 animate-spin" />
      {message}
    </div>
  );
}

export function ErrorState({
  message,
  detail,
  onRetry,
}: {
  message: string;
  detail?: string | null;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-10 text-center text-sm text-rose-800"
    >
      <AlertCircle className="h-5 w-5" />
      <p className="font-semibold">{message}</p>
      {detail && <p className="text-xs text-rose-700/80">{detail}</p>}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500">
      <Inbox className="h-5 w-5 text-slate-400" />
      {message}
    </div>
  );
}
