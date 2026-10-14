import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { NullableText } from "@/components/ui/nullable-text";
import { PendingIntegrationNotice } from "@/components/ui/pending-integration";
import { ErrorState, LoadingState } from "@/components/ui/query-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateOnly, formatTime } from "@/lib/format";

import { LugarLink, PendingValue } from "./JornadaCells";
import { useJornadaDetail } from "../hooks/useJornadaDetail";
import { modalidadLabel } from "../utils/orientationUtils";

import type { OrientacionDetalle, OrientationRoleView } from "../types/orientations";

interface JornadaDetailModalProps {
  jornadaId: string | null;
  view: OrientationRoleView;
  onClose: () => void;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-800">{children}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {children}
    </section>
  );
}

function DisabledActions({ labels }: { labels: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {labels.map((label) => (
        <Button key={label} type="button" variant="outline" size="sm" disabled title="Pendiente de servicio y RLS">
          {label}
        </Button>
      ))}
    </div>
  );
}

function JornadaDetail({ jornada, view }: { jornada: OrientacionDetalle; view: OrientationRoleView }) {
  const hasLegacy = Boolean(jornada.descripcion || jornada.fuente || jornada.audiencia);

  return (
    <div className="space-y-6">
      <Section title="Datos de la jornada">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Tema">{jornada.tema}</Field>
          <Field label="Estado"><StatusBadge value={jornada.estado} /></Field>
          <Field label="Fecha">{formatDateOnly(jornada.fecha)}</Field>
          <Field label="Horario">{`${formatTime(jornada.horaInicio)}–${formatTime(jornada.horaFin)}`}</Field>
          <Field label="Modalidad"><NullableText value={modalidadLabel(jornada.modalidad)} /></Field>
          <Field label="Lugar o enlace"><LugarLink value={jornada.lugarLink} /></Field>
          <Field label="Cupo"><PendingValue /></Field>
          <Field label="Centro SENA"><PendingValue /></Field>
          <Field label="Orientador responsable">
            {jornada.idOrientador ? "Asignado" : <span className="text-slate-500">Sin asignar</span>}
          </Field>
        </dl>
        {view === "administrador" && <DisabledActions labels={["Asignar orientador"]} />}
      </Section>

      {hasLegacy && (
        <Section title="Datos de versiones anteriores">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Descripción"><NullableText value={jornada.descripcion} /></Field>
            <Field label="Fuente"><NullableText value={jornada.fuente} /></Field>
            <Field label="Audiencia esperada"><NullableText value={jornada.audiencia} /></Field>
          </dl>
        </Section>
      )}

      {view === "orientador" && (
        <Section title="Inscritos y asistencia">
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Cupo"><PendingValue /></Field>
            <Field label="Inscritos"><PendingValue /></Field>
            <Field label="Asistentes"><PendingValue /></Field>
            <Field label="No asistentes"><PendingValue /></Field>
          </dl>
          <PendingIntegrationNotice title="Lista de inscritos pendiente">
            La lista con identificación y asistencia se mostrará cuando existan las tablas de inscripción y
            asistencia con sus políticas RLS aprobadas.
          </PendingIntegrationNotice>
          <DisabledActions
            labels={["Marcar asistencia", "Registrar asistente manual", "Registrar observaciones operativas"]}
          />
        </Section>
      )}

      {(view === "administrador" || view === "coordinador") && (
        <PendingIntegrationNotice title="Inscripciones, asistencia y métricas pendientes">
          {view === "administrador"
            ? "Las inscripciones, la asistencia, las métricas y la auditoría de la jornada se habilitarán tras la migración."
            : "Las métricas de participación se habilitarán tras la migración."}
        </PendingIntegrationNotice>
      )}
    </div>
  );
}

export function JornadaDetailModal({ jornadaId, view, onClose }: JornadaDetailModalProps) {
  const { data, error, isLoading } = useJornadaDetail(jornadaId);

  return (
    <Modal
      open={jornadaId !== null}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title="Detalle de la jornada"
    >
      {isLoading ? (
        <LoadingState message="Cargando jornada..." />
      ) : error ? (
        <ErrorState message="No fue posible cargar la jornada." detail={error} />
      ) : data ? (
        <JornadaDetail jornada={data} view={view} />
      ) : null}
    </Modal>
  );
}
