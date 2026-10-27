import { useCallback, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { DetailCard } from "@/components/ui/detail-section";
import { NullableText } from "@/components/ui/nullable-text";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/query-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { JornadaDetailModal } from "@/features/orientations/components/JornadaDetailModal";
import { SIN_REGISTRAR_LABEL } from "@/features/orientations/constants/jornada";
import { useEntrepreneurOrientationHistory } from "@/features/orientations/hooks/useEntrepreneurOrientationHistory";
import { useOrientationAccess } from "@/features/orientations/hooks/useOrientationAccess";
import { asistenciaLabel, modalidadLabel } from "@/features/orientations/utils/orientationUtils";
import type { EntrepreneurOrientationHistoryItem } from "@/features/orientations/types/orientations";
import { formatDateOnly, formatStatusLabel, formatTime } from "@/lib/format";

function HistoryField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="break-words text-slate-800">{children}</dd>
    </div>
  );
}

export function OrientationHistoryItem({
  item,
  onDetail,
}: {
  item: EntrepreneurOrientationHistoryItem;
  onDetail?: (id: string) => void;
}) {
  const { jornada, inscripcion, asistencia } = item;

  return (
    <li className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 md:flex-row md:items-center md:gap-4">
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="break-words font-semibold text-slate-800">
          {jornada?.tema ?? <span className="text-slate-500">Jornada no disponible para tu usuario</span>}
        </p>
        {jornada && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>
              {formatDateOnly(jornada.fecha)} · {formatTime(jornada.horaInicio)}–{formatTime(jornada.horaFin)}
            </span>
            <StatusBadge value={jornada.estado} />
          </div>
        )}
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm md:w-[26rem] md:shrink-0 md:grid-cols-3">
        <HistoryField label="Modalidad">
          <NullableText value={modalidadLabel(jornada?.modalidad ?? null)} />
        </HistoryField>
        <HistoryField label="Inscripción">
          {inscripcion ? (
            <span className="space-y-0.5">
              <StatusBadge value={inscripcion.estado} />
              {inscripcion.origen?.trim() && (
                <span className="block text-xs text-slate-500">{formatStatusLabel(inscripcion.origen)}</span>
              )}
            </span>
          ) : (
            <span className="text-slate-500">Sin inscripción</span>
          )}
        </HistoryField>
        <HistoryField label="Asistencia">
          {asistenciaLabel(asistencia?.estado ?? null) ?? <span className="text-slate-500">{SIN_REGISTRAR_LABEL}</span>}
        </HistoryField>
      </dl>
      {onDetail && jornada && (
        <Button
          type="button"
          variant="outline"
          className="w-full md:w-auto"
          onClick={() => onDetail(item.orientacionId)}
          aria-label={`Ver detalle de la jornada ${jornada.tema}`}
        >
          Ver jornada
        </Button>
      )}
    </li>
  );
}

const READ_ONLY = () => false;
const IGNORE_CHANGE = () => undefined;

export function EntrepreneurOrientationsSection({ entrepreneurId }: { entrepreneurId: string }) {
  const { data, error, isLoading, reload } = useEntrepreneurOrientationHistory(entrepreneurId);
  const { view } = useOrientationAccess();
  const [detailId, setDetailId] = useState<string | null>(null);
  const closeDetail = useCallback(() => setDetailId(null), []);

  return (
    <DetailCard title={data && !isLoading ? `Orientaciones y asistencias (${data.length})` : "Orientaciones y asistencias"}>
      <div aria-busy={isLoading}>
        {isLoading ? (
          <LoadingState message="Cargando historial de orientaciones..." />
        ) : error ? (
          <ErrorState message="No fue posible cargar el historial de orientaciones." detail={error} onRetry={reload} />
        ) : !data || data.length === 0 ? (
          <EmptyState message="Este emprendedor no tiene inscripciones ni asistencias registradas, o no tienes permisos para verlas." />
        ) : (
          <ul className="divide-y divide-slate-200">
            {data.map((item) => (
              <OrientationHistoryItem key={item.orientacionId} item={item} onDetail={view ? setDetailId : undefined} />
            ))}
          </ul>
        )}
      </div>

      {view && (
        <JornadaDetailModal
          jornadaId={detailId}
          view={view}
          canManageAttendance={READ_ONLY}
          canAssignOrientador={false}
          canClose={READ_ONLY}
          refreshKey={0}
          onChanged={IGNORE_CHANGE}
          onClose={closeDetail}
        />
      )}
    </DetailCard>
  );
}
