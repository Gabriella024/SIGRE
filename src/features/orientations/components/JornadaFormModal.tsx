import { Modal } from "@/components/ui/modal";
import { ErrorState, LoadingState } from "@/components/ui/query-state";

import { JornadaForm } from "./JornadaForm";

import type { JornadaFormValues } from "../schemas/orientationSchema";
import type { OrientationEditorMode } from "../types/orientations";

interface JornadaFormModalProps {
  open: boolean;
  mode: OrientationEditorMode;
  recordKey: string | null;
  initialValues: JornadaFormValues | null;
  loading: boolean;
  loadError: string | null;
  isSubmitting: boolean;
  submitError: string | null;
  onSubmit: (values: JornadaFormValues) => void;
  onClose: () => void;
}

export function JornadaFormModal({
  open,
  mode,
  recordKey,
  initialValues,
  loading,
  loadError,
  isSubmitting,
  submitError,
  onSubmit,
  onClose,
}: JornadaFormModalProps) {
  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={mode === "create" ? "Nueva jornada" : "Editar jornada"}
      description="Los campos marcados con * son obligatorios."
    >
      {loading ? (
        <LoadingState message="Cargando jornada..." />
      ) : loadError ? (
        <ErrorState message="No fue posible cargar la jornada." detail={loadError} />
      ) : initialValues ? (
        <JornadaForm
          key={recordKey ?? "new"}
          mode={mode}
          defaultValues={initialValues}
          isSubmitting={isSubmitting}
          submitError={submitError}
          onSubmit={onSubmit}
          onCancel={onClose}
        />
      ) : null}
    </Modal>
  );
}
