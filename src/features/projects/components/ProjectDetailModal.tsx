import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { NullableText } from "@/components/ui/nullable-text";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/query-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import { formatTimestamp } from "@/lib/format";

import { EtapaBadge } from "./ProjectEtapaBadge";
import { ProjectDeleteDialog } from "./ProjectDeleteDialog";
import { useProjectDetail } from "../hooks/useProjectDetail";

import type { ProjectDeletion, ProjectDetail } from "../types/proyect";

interface ProjectDetailModalProps {
  projectId: string | null;
  deletion?: ProjectDeletion;
  onEdit?: (project: ProjectDetail) => void;
  onClose: () => void;
}

function Field({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={cn("space-y-0.5", wide && "sm:col-span-2")}>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-800">{children}</dd>
    </div>
  );
}

function LongText({ value }: { value: string | null }) {
  return value?.trim() ? (
    <p className="whitespace-pre-line break-words">{value}</p>
  ) : (
    <NullableText value={null} />
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function ProjectDetailContent({ project }: { project: ProjectDetail }) {
  return (
    <div className="space-y-6">
      <Section title="Datos del proyecto">
        <Field label="Título" wide>{project.titulo}</Field>
        <Field label="Emprendedor"><NullableText value={project.emprendedor} /></Field>
        <Field label="Sector económico"><NullableText value={project.sector} /></Field>
        <Field label="Descripción" wide><LongText value={project.descripcion} /></Field>
      </Section>

      <Section title="Propuesta">
        <Field label="Problema u oportunidad" wide><LongText value={project.problemaOportunidad} /></Field>
        <Field label="Propuesta de valor" wide><LongText value={project.propuestaValor} /></Field>
      </Section>

      <Section title="Seguimiento">
        <Field label="Estado del proyecto"><StatusBadge value={project.estado} /></Field>
        <Field label="Etapa actual"><EtapaBadge etapa={project.etapa} /></Field>
        <Field label="Observaciones" wide><LongText value={project.observaciones} /></Field>
        <Field label="Fecha de creación">{formatTimestamp(project.createdAt)}</Field>
        <Field label="Última actualización">
          {project.updatedAt ? formatTimestamp(project.updatedAt) : <NullableText value={null} />}
        </Field>
      </Section>
    </div>
  );
}

interface DetailFooterProps {
  onDelete?: () => void;
  onEdit?: () => void;
  onClose: () => void;
}

function DetailFooter({ onDelete, onEdit, onClose }: DetailFooterProps) {
  return (
    <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
      {onDelete && (
        <Button type="button" variant="destructive" onClick={onDelete}>
          Eliminar proyecto
        </Button>
      )}
      {onEdit && (
        <Button type="button" variant="outline" onClick={onEdit}>
          Editar
        </Button>
      )}
      <Button type="button" variant="outline" onClick={onClose}>
        Cerrar
      </Button>
    </div>
  );
}

export function ProjectDetailModal({ projectId, deletion, onEdit, onClose }: ProjectDetailModalProps) {
  const { data, error, isLoading, isUnavailable, reload } = useProjectDetail(projectId);

  return (
    <Modal
      open={projectId !== null}
      onOpenChange={(next) => {
        if (!next && !deletion?.isSubmitting) onClose();
      }}
      title={data?.titulo ?? "Detalle del proyecto"}
      description="Información registrada del proyecto."
    >
      <div className="space-y-6">
        {isLoading ? (
          <LoadingState message="Cargando proyecto..." />
        ) : error ? (
          <ErrorState message="No fue posible cargar el proyecto." detail={error} onRetry={reload} />
        ) : isUnavailable ? (
          <EmptyState message="El proyecto no existe, fue eliminado o no tienes permisos para verlo." />
        ) : data ? (
          <ProjectDetailContent project={data} />
        ) : null}

        <DetailFooter
          onDelete={data?.updatedAt && deletion ? deletion.onRequest : undefined}
          onEdit={data && onEdit ? () => onEdit(data) : undefined}
          onClose={onClose}
        />
      </div>

      {data?.updatedAt && deletion?.confirming && (
        <ProjectDeleteDialog
          project={{ id: data.id, titulo: data.titulo, updatedAt: data.updatedAt }}
          deletion={{
            ...deletion,
            onRefresh: () => {
              deletion.onRefresh();
              reload();
            },
          }}
        />
      )}
    </Modal>
  );
}
