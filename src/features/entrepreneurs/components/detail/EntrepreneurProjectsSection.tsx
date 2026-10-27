import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DetailCard } from "@/components/ui/detail-section";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { NullableText } from "@/components/ui/nullable-text";
import { PendingIntegrationNotice } from "@/components/ui/pending-integration";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/query-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { ProjectDetailModal } from "@/features/projects/components/ProjectDetailModal";
import { EtapaBadge } from "@/features/projects/components/ProjectEtapaBadge";
import { ProjectFormModal } from "@/features/projects/components/ProjectFormModal";
import { useEntrepreneurProjects } from "@/features/projects/hooks/useEntrepreneurProjects";
import { useProjectAccess } from "@/features/projects/hooks/useProjectAccess";
import { useProjectCreate } from "@/features/projects/hooks/useProjectCreate";
import type { ProjectFormValues } from "@/features/projects/schemas/proyectSchema";
import { EMPTY_PROJECT_FORM, NEW_PROJECT_CONTEXT } from "@/features/projects/utils/proyectUtils";
import { formatTimestamp } from "@/lib/format";

import { isActiveEntrepreneur } from "../../utils/entrepreneurUtils";

import type { Project } from "@/features/projects/types/proyect";
import type { EntrepreneurDetail } from "../../types/entrepreneur";

function ProjectItem({ project, onDetail }: { project: Project; onDetail: (id: string) => void }) {
  return (
    <li className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 md:flex-row md:items-center md:gap-4">
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="break-words font-semibold text-slate-800">{project.titulo}</p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <StatusBadge value={project.estado} />
          <EtapaBadge etapa={project.etapa} />
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm md:w-80 md:shrink-0">
        <div className="min-w-0">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sector</dt>
          <dd className="break-words text-slate-800"><NullableText value={project.sector} /></dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Creado</dt>
          <dd className="text-slate-800">{formatTimestamp(project.createdAt)}</dd>
        </div>
      </dl>
      <Button
        type="button"
        variant="outline"
        className="w-full md:w-auto"
        onClick={() => onDetail(project.id)}
        aria-label={`Ver detalle del proyecto ${project.titulo}`}
      >
        Ver detalle
      </Button>
    </li>
  );
}

type SectionEntrepreneur = Pick<EntrepreneurDetail, "id" | "nombre" | "estado">;

export function EntrepreneurProjectsSection({ entrepreneur }: { entrepreneur: SectionEntrepreneur }) {
  const { data, error, isLoading, reload } = useEntrepreneurProjects(entrepreneur.id);
  const [detailId, setDetailId] = useState<string | null>(null);
  const access = useProjectAccess();
  const creator = useProjectCreate(access);
  const { crear, reset: resetCreator, isSubmitting: isCreating } = creator;
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const isActive = isActiveEntrepreneur(entrepreneur);
  const canCreateProjects = access.view === "administrador" && access.canCreate;

  const openCreate = () => {
    if (!canCreateProjects || !isActive) return;
    resetCreator();
    setNotice(null);
    setIsCreateOpen(true);
  };

  const closeCreate = () => {
    if (isCreating) return;
    resetCreator();
    setIsCreateOpen(false);
  };

  const submitCreate = async (values: ProjectFormValues) => {
    const result = await crear({ ...values, id_emprendedor_fk: entrepreneur.id });
    if (!result.success) return;
    setIsCreateOpen(false);
    resetCreator();
    reload();
    setNotice(`El proyecto "${values.titulo.trim()}" se creó correctamente.`);
  };

  return (
    <DetailCard title={data && !isLoading ? `Proyectos (${data.length})` : "Proyectos"}>
      <div className="space-y-4" aria-busy={isLoading}>
        {canCreateProjects &&
          (isActive ? (
            <div className="flex justify-end">
              <Button
                type="button"
                className="gap-2 bg-lime-500 hover:bg-lime-600"
                onClick={openCreate}
                disabled={isCreating}
                aria-busy={isCreating}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Nuevo proyecto
              </Button>
            </div>
          ) : (
            <PendingIntegrationNotice title="No se pueden crear proyectos">
              El emprendedor no está activo. Primero debe reactivarse para asociarle nuevos proyectos.
            </PendingIntegrationNotice>
          ))}

        {notice && <FeedbackMessage type="success" message={notice} />}

        {isLoading ? (
          <LoadingState message="Cargando proyectos..." />
        ) : error ? (
          <ErrorState message="No fue posible cargar los proyectos." detail={error} onRetry={reload} />
        ) : !data || data.length === 0 ? (
          <EmptyState message="Este emprendedor no tiene proyectos registrados o no tienes permisos para verlos." />
        ) : (
          <ul className="divide-y divide-slate-200">
            {data.map((project) => (
              <ProjectItem key={project.id} project={project} onDetail={setDetailId} />
            ))}
          </ul>
        )}
      </div>

      <ProjectDetailModal projectId={detailId} onClose={() => setDetailId(null)} />

      {canCreateProjects && isActive && (
        <ProjectFormModal
          open={isCreateOpen}
          mode="create"
          recordKey={isCreateOpen ? `new:${entrepreneur.id}` : null}
          initialValues={{ ...EMPTY_PROJECT_FORM, id_emprendedor_fk: entrepreneur.id }}
          context={NEW_PROJECT_CONTEXT}
          loading={false}
          loadError={null}
          showObservaciones={access.canManageObservations}
          entrepreneurScope={access.entrepreneurScope}
          fixedEntrepreneur={{ id: entrepreneur.id, nombre: entrepreneur.nombre }}
          submission={{
            canSubmit: creator.canSubmit,
            blocked: creator.blocked,
            isSubmitting: isCreating,
            error: creator.error,
            onSubmit: submitCreate,
          }}
          onClose={closeCreate}
        />
      )}
    </DetailCard>
  );
}
