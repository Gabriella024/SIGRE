import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function FormActions({
  isSubmitting,
  disabled,
  submitLabel = "Guardar",
  onCancel,
}: {
  isSubmitting: boolean;
  disabled?: boolean;
  submitLabel?: string;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
      <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
        Cancelar
      </Button>
      <Button type="submit" className="gap-2 bg-[#39a900] hover:bg-[#2f8f00]" disabled={isSubmitting || disabled}>
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {isSubmitting ? "Guardando..." : submitLabel}
      </Button>
    </div>
  );
}
