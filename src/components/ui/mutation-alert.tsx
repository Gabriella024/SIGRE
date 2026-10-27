import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PendingIntegrationNotice } from "@/components/ui/pending-integration";

import type { MutationFeedback } from "@/hooks/useAdminMutation";

export function MutationAlert({
  feedback,
  onReload,
}: {
  feedback: MutationFeedback;
  onReload?: () => void;
}) {
  const pending = feedback.missingBackend ? feedback.error : feedback.pendingBackend;

  if (pending) {
    return <PendingIntegrationNotice title="Pendiente de backend">{pending}</PendingIntegrationNotice>;
  }

  if (!feedback.error) return null;

  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between"
    >
      <p>{feedback.error}</p>
      {feedback.conflict && onReload && (
        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={onReload}>
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          Recargar
        </Button>
      )}
    </div>
  );
}
