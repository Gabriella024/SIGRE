import { useCallback, useRef, useState } from "react";

import { getProjectById } from "../services/proyectsService";
import { toErrorMessage } from "../utils/mutationResult";
import {
  EMPTY_PROJECT_FORM,
  NEW_PROJECT_CONTEXT,
  toProjectEditableFields,
  toProjectFormContext,
  toProjectFormValues,
} from "../utils/proyectUtils";

import type { ProjectFormValues } from "../schemas/proyectSchema";
import type {
  Project,
  ProjectEditableFields,
  ProjectEditorMode,
  ProjectFormContext,
} from "../types/proyect";

type EditorState = {
  open: boolean;
  mode: ProjectEditorMode;
  id: string | null;
  initialValues: ProjectFormValues | null;
  context: ProjectFormContext | null;
  original: ProjectEditableFields | null;
  loading: boolean;
  loadError: string | null;
};

type EditorOptions = {
  canCreate: boolean;
  canEdit: boolean;
};

const CLOSED: EditorState = {
  open: false,
  mode: "create",
  id: null,
  initialValues: null,
  context: null,
  original: null,
  loading: false,
  loadError: null,
};

export function useProjectEditor({ canCreate, canEdit }: EditorOptions) {
  const [state, setState] = useState<EditorState>(CLOSED);
  const requestRef = useRef(0);

  const openCreate = useCallback(() => {
    if (!canCreate) return;
    requestRef.current += 1;
    setState({
      ...CLOSED,
      open: true,
      initialValues: EMPTY_PROJECT_FORM,
      context: NEW_PROJECT_CONTEXT,
    });
  }, [canCreate]);

  const openEdit = useCallback(
    (project: Pick<Project, "id">) => {
      if (!canEdit) return;
      const requestId = ++requestRef.current;
      setState({ ...CLOSED, open: true, mode: "edit", id: project.id, loading: true });

      getProjectById(project.id)
        .then((detail) => {
          if (requestId !== requestRef.current) return;
          setState((current) =>
            detail
              ? {
                  ...current,
                  initialValues: toProjectFormValues(detail),
                  context: toProjectFormContext(detail),
                  original: toProjectEditableFields(detail),
                  loading: false,
                }
              : {
                  ...current,
                  loading: false,
                  loadError: "El proyecto no existe, fue eliminado o no tienes permisos para verlo.",
                }
          );
        })
        .catch((error: unknown) => {
          if (requestId !== requestRef.current) return;
          setState((current) => ({ ...current, loading: false, loadError: toErrorMessage(error) }));
        });
    },
    [canEdit]
  );

  const close = useCallback(() => {
    requestRef.current += 1;
    setState(CLOSED);
  }, []);

  return { ...state, openCreate, openEdit, close };
}
