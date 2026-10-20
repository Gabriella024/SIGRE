import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

import { PROJECT_DELETE_BLOCKED_MESSAGE } from "../hooks/useProjectDelete";

import type { ProjectDeleteTarget, ProjectDeletion } from "../types/proyect";

interface ProjectDeleteDialogProps {
  project: ProjectDeleteTarget;
  deletion: ProjectDeletion;
}

export function ProjectDeleteDialog({ project, deletion }: ProjectDeleteDialogProps) {
  const [blockedNotice, setBlockedNotice] = useState(false);
  const { isSubmitting, error, conflict } = deletion;

  const cancel = () => {
    if (isSubmitting) return;
    setBlockedNotice(false);
    deletion.onCancel();
  };

  const confirm = () => {
    if (isSubmitting) return;
    if (deletion.blocked) {
      setBlockedNotice(true);
      return;
    }
    void deletion.onConfirm(project);
  };

  const message = blockedNotice ? PROJECT_DELETE_BLOCKED_MESSAGE : error;

  return (
    <Modal
      open
      onOpenChange={(next) => {
        if (!next) cancel();
      }}
      title="Eliminar proyecto"
      description="Confirma la eliminación antes de continuar."
      className="max-w-lg"
    >
      <div className="space-y-4 text-sm text-slate-700">
        <p>
          ¿Deseas eliminar el proyecto <span className="font-semibold text-slate-900">"{project.titulo}"</span>?
        </p>
        <p>El proyecto dejará de aparecer en los listados y consultas operativas del sistema.</p>
        <p>La información no se borra físicamente: se conservará en la base de datos como registro eliminado.</p>

        {message && (
          <p
            role="alert"
            className={
              blockedNotice || conflict
                ? "rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-amber-900"
                : "rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-rose-800"
            }
          >
            {conflict && !blockedNotice && <span className="font-semibold">Conflicto de versión. </span>}
            {message}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={cancel} disabled={isSubmitting}>
            Cancelar
          </Button>
          {conflict && !blockedNotice ? (
            <Button type="button" variant="outline" onClick={deletion.onRefresh} disabled={isSubmitting}>
              Actualizar información
            </Button>
          ) : (
            <Button type="button" variant="destructive" onClick={confirm} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? "Eliminando..." : "Confirmar eliminación"}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
