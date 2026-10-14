import { useCallback, useRef, useState } from "react";

import { createJornada, getOrientationById, updateJornada } from "../services/orientationsService";
import {
  EMPTY_JORNADA_FORM,
  buildJornadaChanges,
  buildJornadaInsert,
  toJornadaFormValues,
} from "../utils/orientationUtils";

import type { JornadaFormValues } from "../schemas/orientationSchema";
import type { Orientacion, OrientationEditorMode } from "../types/orientations";

type EditorState = {
  open: boolean;
  mode: OrientationEditorMode;
  id: string | null;
  initialValues: JornadaFormValues | null;
  loading: boolean;
  loadError: string | null;
};

type EditorOptions = {
  canCreate: boolean;
  canEdit: boolean;
  onSaved: (message: string) => void;
};

const CLOSED: EditorState = {
  open: false,
  mode: "create",
  id: null,
  initialValues: null,
  loading: false,
  loadError: null,
};

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
}

export function useOrientationEditor({ canCreate, canEdit, onSaved }: EditorOptions) {
  const [state, setState] = useState<EditorState>(CLOSED);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submittingRef = useRef(false);
  const requestRef = useRef(0);

  const openCreate = useCallback(() => {
    if (!canCreate) return;
    requestRef.current += 1;
    setSubmitError(null);
    setState({ ...CLOSED, open: true, initialValues: EMPTY_JORNADA_FORM });
  }, [canCreate]);

  const openEdit = useCallback(
    (orientacion: Orientacion) => {
      if (!canEdit) return;
      const requestId = ++requestRef.current;
      setSubmitError(null);
      setState({ ...CLOSED, open: true, mode: "edit", id: orientacion.id, loading: true });

      getOrientationById(orientacion.id)
        .then((detalle) => {
          if (requestId !== requestRef.current) return;
          setState((current) => ({
            ...current,
            initialValues: toJornadaFormValues(detalle),
            loading: false,
          }));
        })
        .catch((error: unknown) => {
          if (requestId !== requestRef.current) return;
          setState((current) => ({ ...current, loading: false, loadError: toMessage(error) }));
        });
    },
    [canEdit]
  );

  const close = useCallback(() => {
    if (submittingRef.current) return;
    requestRef.current += 1;
    setSubmitError(null);
    setState(CLOSED);
  }, []);

  const submit = useCallback(
    async (values: JornadaFormValues) => {
      if (submittingRef.current) return;

      const { mode, id, initialValues } = state;

      if (!(mode === "create" ? canCreate : canEdit)) {
        setSubmitError("No tienes permisos para realizar esta operación.");
        return;
      }

      submittingRef.current = true;
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        if (mode === "create") {
          await createJornada(buildJornadaInsert(values));
        } else {
          if (!id || !initialValues) throw new Error("No hay una jornada seleccionada.");
          const changes = buildJornadaChanges(initialValues, values);
          if (Object.keys(changes).length === 0) {
            setSubmitError("No hay cambios para guardar.");
            return;
          }
          await updateJornada(id, changes);
        }

        requestRef.current += 1;
        setState(CLOSED);
        onSaved(mode === "create" ? "Jornada creada correctamente." : "Jornada actualizada correctamente.");
      } catch (error) {
        setSubmitError(toMessage(error));
      } finally {
        submittingRef.current = false;
        setIsSubmitting(false);
      }
    },
    [state, canCreate, canEdit, onSaved]
  );

  return {
    ...state,
    isSubmitting,
    submitError,
    openCreate,
    openEdit,
    close,
    submit,
  };
}
