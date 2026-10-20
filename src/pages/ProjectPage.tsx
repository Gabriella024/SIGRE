import { useCallback, useMemo, useState } from "react";
import ProjectsTable from "@/features/projects/components/ProjectsTable";
import { ProjectDetailModal } from "@/features/projects/components/ProjectDetailModal";
import { ProjectFormModal } from "@/features/projects/components/ProjectFormModal";
import { useProjectEditor } from "@/features/projects/hooks/useProjectEditor";
import { useProjectAccess } from "@/features/projects/hooks/useProjectAccess";
import { useProjectCreate } from "@/features/projects/hooks/useProjectCreate";
import { useProjectUpdate } from "@/features/projects/hooks/useProjectUpdate";
import { useProjectDelete } from "@/features/projects/hooks/useProjectDelete";
import { useProjectExport } from "@/features/projects/hooks/useProjectExport";
import type { ProjectExportOutcome } from "@/features/projects/utils/projectExport";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { ProjectsFilters } from "@/features/projects/components/ProjectsFilters";
import { useProjects } from "@/features/projects/hooks/useProyects";
import { INITIAL_PROJECT_FILTERS, filterProjects } from "@/features/projects/utils/proyectUtils";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/query-state";
import { distinctOptions } from "@/lib/format";
import type {
  Project,
  ProjectDeleteTarget,
  ProjectDeletion,
  ProjectFilters,
} from "@/features/projects/types/proyect";
import type { ProjectFormValues } from "@/features/projects/schemas/proyectSchema";

function ExportFeedback({ outcome }: { outcome: ProjectExportOutcome }) {
  switch (outcome.status) {
    case "success":
      return (
        <FeedbackMessage
          type="success"
          message={`Se exportaron ${outcome.count} ${outcome.count === 1 ? "proyecto" : "proyectos"} a Excel.`}
        />
      );
    case "empty":
      return (
        <FeedbackMessage
          type="info"
          message="No hay proyectos que coincidan con los filtros actuales. No se generó ningún archivo."
        />
      );
    case "denied":
      return (
        <FeedbackMessage
          type="error"
          message="No tienes autorización para exportar proyectos. No se generó ningún archivo."
        />
      );
    case "error":
      return <FeedbackMessage type="error" message={`${outcome.message} No se generó ningún archivo.`} />;
  }
}

export function ProjectsPage() {
  const { data, error, isLoading, reload } = useProjects();
  const [filters, setFilters] = useState(INITIAL_PROJECT_FILTERS);
  const [detailId, setDetailId] = useState<string | null>(null);
  const access = useProjectAccess();
  const isAdmin = access.view === "administrador";
  const canCreateProjects = isAdmin && access.canCreate;
  const canEditProjects = isAdmin && access.canEdit;
  const editor = useProjectEditor({ canCreate: canCreateProjects, canEdit: canEditProjects });
  const creator = useProjectCreate(access);
  const updater = useProjectUpdate(access);
  const deleter = useProjectDelete(access);
  const exporter = useProjectExport();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const { openEdit, openCreate, close: closeEditor } = editor;
  const { crear, reset: resetCreator, isSubmitting: isCreating } = creator;
  const { guardar, reset: resetUpdater, isSubmitting: isUpdating } = updater;
  const { eliminar, reset: resetDeleter, isSubmitting: isDeleting } = deleter;

  const startCreate = useCallback(() => {
    resetCreator();
    setNotice(null);
    openCreate();
  }, [openCreate, resetCreator]);

  const startEdit = useCallback(
    (project: Pick<Project, "id">) => {
      resetUpdater();
      setNotice(null);
      openEdit(project);
    },
    [openEdit, resetUpdater]
  );

  const closeForm = useCallback(() => {
    if (isCreating || isUpdating) return;
    resetCreator();
    resetUpdater();
    closeEditor();
  }, [isCreating, isUpdating, resetCreator, resetUpdater, closeEditor]);

  const submitCreate = useCallback(
    async (values: ProjectFormValues) => {
      const result = await crear(values);
      if (!result.success) return;
      closeEditor();
      reload();
      setNotice(`El proyecto "${values.titulo.trim()}" se creó correctamente.`);
    },
    [crear, closeEditor, reload]
  );

  const editTarget = useMemo(
    () =>
      editor.mode === "edit" && editor.id && editor.original
        ? { id: editor.id, updatedAt: editor.context?.updatedAt ?? null, original: editor.original }
        : null,
    [editor.mode, editor.id, editor.context, editor.original]
  );

  const submitEdit = useCallback(
    async (values: ProjectFormValues) => {
      if (!editTarget) return;
      const result = await guardar(editTarget, values);
      if (!result.success) return;
      closeEditor();
      reload();
      setNotice(`Los cambios del proyecto "${values.titulo.trim()}" se guardaron correctamente.`);
    },
    [editTarget, guardar, closeEditor, reload]
  );

  const submission = !isAdmin
    ? undefined
    : editor.mode === "create"
      ? {
          canSubmit: creator.canSubmit,
          blocked: creator.blocked,
          isSubmitting: creator.isSubmitting,
          error: creator.error,
          onSubmit: submitCreate,
        }
      : {
          canSubmit: updater.canSubmit && Boolean(editTarget?.updatedAt),
          blocked: updater.blocked,
          isSubmitting: updater.isSubmitting,
          error: updater.error,
          conflict: updater.conflict,
          onSubmit: submitEdit,
        };

  const rows = useMemo(() => data ?? [], [data]);
  const filtered = useMemo(() => filterProjects(rows, filters), [rows, filters]);
  const estadoOptions = useMemo(() => distinctOptions(rows.map((row) => row.estado)), [rows]);
  const sectorOptions = useMemo(() => distinctOptions(rows.map((row) => row.sector)), [rows]);
  const etapaOptions = useMemo(() => distinctOptions(rows.map((row) => row.etapa)), [rows]);
  const openDetail = useCallback((project: Project) => setDetailId(project.id), []);
  const editFromDetail = useCallback(
    (project: Pick<Project, "id">) => {
      setDetailId(null);
      setConfirmingDelete(false);
      startEdit(project);
    },
    [startEdit]
  );

  const canDeleteProjects = isAdmin && deleter.canSubmit;

  const { exportar, reset: resetExport, isExporting } = exporter;
  const changeFilters = useCallback(
    (next: ProjectFilters) => {
      setFilters(next);
      if (!isExporting) resetExport();
    },
    [isExporting, resetExport]
  );
  const startExport = useCallback(() => {
    setNotice(null);
    void exportar(filters);
  }, [exportar, filters]);

  const closeDetail = useCallback(() => {
    if (isDeleting) return;
    resetDeleter();
    setConfirmingDelete(false);
    setDetailId(null);
  }, [isDeleting, resetDeleter]);

  const requestDelete = useCallback(() => {
    resetDeleter();
    setNotice(null);
    setConfirmingDelete(true);
  }, [resetDeleter]);

  const deleteFromTable = useCallback(
    (project: Project) => {
      setDetailId(project.id);
      requestDelete();
    },
    [requestDelete]
  );

  const cancelDelete = useCallback(() => {
    if (isDeleting) return;
    resetDeleter();
    setConfirmingDelete(false);
  }, [isDeleting, resetDeleter]);

  const confirmDelete = useCallback(
    async (target: ProjectDeleteTarget) => {
      const result = await eliminar(target);
      if (!result.success) return;
      setConfirmingDelete(false);
      setDetailId(null);
      reload();
      setNotice(`El proyecto "${target.titulo}" se eliminó correctamente.`);
    },
    [eliminar, reload]
  );

  const deletion: ProjectDeletion | undefined = canDeleteProjects
    ? {
        confirming: confirmingDelete,
        blocked: deleter.blocked,
        isSubmitting: deleter.isSubmitting,
        error: deleter.error,
        conflict: deleter.conflict,
        onRequest: requestDelete,
        onCancel: cancelDelete,
        onConfirm: confirmDelete,
        onRefresh: resetDeleter,
      }
    : undefined;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-slate-800">Gestión de Proyectos</h1>

      <ProjectsFilters
        value={filters}
        onChange={changeFilters}
        estadoOptions={estadoOptions}
        sectorOptions={sectorOptions}
        etapaOptions={etapaOptions}
        canCreate={canCreateProjects}
        canExport={exporter.canExport}
        isExporting={exporter.isExporting}
        onExport={exporter.canExport ? startExport : undefined}
        onCreate={canCreateProjects ? startCreate : undefined}
      />

      {notice && <FeedbackMessage type="success" message={notice} />}
      {exporter.outcome && <ExportFeedback outcome={exporter.outcome} />}

      {isLoading && !data ? (
        <LoadingState message="Cargando proyectos..." />
      ) : error ? (
        <ErrorState message="No fue posible cargar los proyectos." detail={error} onRetry={reload} />
      ) : rows.length === 0 ? (
        <EmptyState message="No hay proyectos registrados o visibles para tu usuario." />
      ) : (
        <ProjectsTable
          data={filtered}
          onDetail={openDetail}
          onEdit={canEditProjects ? startEdit : undefined}
          onDelete={canDeleteProjects ? deleteFromTable : undefined}
        />
      )}

      <ProjectDetailModal
        projectId={detailId}
        deletion={deletion}
        onEdit={canEditProjects ? editFromDetail : undefined}
        onClose={closeDetail}
      />

      <ProjectFormModal
        open={editor.open}
        mode={editor.mode}
        recordKey={editor.id}
        initialValues={editor.initialValues}
        context={editor.context}
        loading={editor.loading}
        loadError={editor.loadError}
        showObservaciones={access.canManageObservations}
        entrepreneurScope={access.entrepreneurScope}
        submission={submission}
        onClose={closeForm}
      />
    </div>
  );
}
