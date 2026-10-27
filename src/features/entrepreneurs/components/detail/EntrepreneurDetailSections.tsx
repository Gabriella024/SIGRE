import { DetailField, DetailSection } from "@/components/ui/detail-section";
import { NullableText } from "@/components/ui/nullable-text";
import { StatusBadge } from "@/components/ui/status-badge";

import { LinkedUserSummary } from "../LinkedUserSummary";
import { formatEntrepreneurDate } from "../../utils/entrepreneurUtils";

import type { EntrepreneurDetail } from "../../types/entrepreneur";

export function EntrepreneurGeneralSection({ entrepreneur }: { entrepreneur: EntrepreneurDetail }) {
  return (
    <DetailSection title="Información general">
      <DetailField label="Nombre completo" wide>{entrepreneur.nombre}</DetailField>
      <DetailField label="Estado"><StatusBadge value={entrepreneur.estado} /></DetailField>
      <DetailField label="Tipo de emprendedor"><NullableText value={entrepreneur.tipo} /></DetailField>
      <DetailField label="Segmentación"><NullableText value={entrepreneur.segmentacion} /></DetailField>
      <DetailField label="Usuario vinculado" wide>
        <LinkedUserSummary
          linkedId={entrepreneur.usuarioId}
          usuario={entrepreneur.usuario}
          emptyLabel="Sin cuenta vinculada"
        />
      </DetailField>
      <DetailField label="Fecha de registro">
        <NullableText value={formatEntrepreneurDate(entrepreneur.createdAt)} />
      </DetailField>
      <DetailField label="Última actualización">
        <NullableText value={formatEntrepreneurDate(entrepreneur.updatedAt)} />
      </DetailField>
    </DetailSection>
  );
}

export function EntrepreneurTrainingSection({ entrepreneur }: { entrepreneur: EntrepreneurDetail }) {
  return (
    <DetailSection title="Formación e información SENA">
      <DetailField label="Centro SENA"><NullableText value={entrepreneur.centro} /></DetailField>
      <DetailField label="Programa de formación"><NullableText value={entrepreneur.programa} /></DetailField>
      <DetailField label="Nivel de formación"><NullableText value={entrepreneur.nivelFormacion} /></DetailField>
      <DetailField label="Orientador">
        <LinkedUserSummary
          linkedId={entrepreneur.orientadorId}
          usuario={entrepreneur.orientador}
          emptyLabel="Sin orientador asignado"
        />
      </DetailField>
    </DetailSection>
  );
}
