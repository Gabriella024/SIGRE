import { Modal } from "@/components/ui/modal";
import { ErrorState, LoadingState } from "@/components/ui/query-state";

import { ProjectForm } from "./ProjectForm";

import type { ProjectFormValues } from "../schemas/proyectSchema";
import type {
  ProjectEditorMode,
  ProjectEntrepreneurScope,
  ProjectFixedEntrepreneur,
  ProjectFormContext,
  ProjectFormSubmission,
} from "../types/proyect";

interface ProjectFormModalProps {
  open: boolean;
  mode: ProjectEditorMode;
  recordKey: string | null;
  initialValues: ProjectFormValues | null;
  context: ProjectFormContext | null;
  loading: boolean;
  loadError: string | null;
  showObservaciones: boolean;
  entrepreneurScope: ProjectEntrepreneurScope | null;
  fixedEntrepreneur?: ProjectFixedEntrepreneur | null;
  submission?: ProjectFormSubmission;
  onClose: () => void;
}

export function ProjectFormModal({
  open,
  mode,
  recordKey,
  initialValues,
  context,
  loading,
  loadError,
  showObservaciones,
  entrepreneurScope,
  fixedEntrepreneur,
  submission,
  onClose,
}: ProjectFormModalProps) {
  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next && !submission?.isSubmitting) onClose();
      }}
      title={mode === "create" ? "Nuevo proyecto" : "Editar proyecto"}
      description="Los campos marcados con * son obligatorios."
    >
      {loading ? (
        <LoadingState message="Cargando proyecto..." />
      ) : loadError ? (
        <ErrorState message="No fue posible cargar el proyecto." detail={loadError} />
      ) : initialValues && context ? (
        <ProjectForm
          key={recordKey ?? "new"}
          mode={mode}
          defaultValues={initialValues}
          context={context}
          showObservaciones={showObservaciones}
          entrepreneurScope={entrepreneurScope}
          fixedEntrepreneur={fixedEntrepreneur}
          submission={submission}
          onCancel={onClose}
        />
      ) : null}
    </Modal>
  );
}
