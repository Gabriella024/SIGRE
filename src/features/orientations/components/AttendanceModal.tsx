import { UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { PendingIntegrationNotice } from "@/components/ui/pending-integration";
import { formatDateOnly, formatTime } from "@/lib/format";

import { AttendancePanel } from "./AttendancePanel";

import type { Orientacion } from "../types/orientations";

interface AttendanceModalProps {
  jornada: Orientacion | null;
  canManage: boolean;
  refreshKey: number;
  onEnroll?: (jornada: Orientacion) => void;
  onClose: () => void;
}

export function AttendanceModal({ jornada, canManage, refreshKey, onEnroll, onClose }: AttendanceModalProps) {
  return (
    <Modal
      open={jornada !== null}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title="Registro de asistencia"
      description={
        jornada
          ? `${jornada.tema} · ${formatDateOnly(jornada.fecha)} · ${formatTime(jornada.horaInicio)}–${formatTime(jornada.horaFin)}`
          : undefined
      }
    >
      {jornada &&
        (canManage ? (
          <div className="space-y-3">
            {onEnroll && (
              <div className="flex justify-end">
                <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => onEnroll(jornada)}>
                  <UserPlus className="h-4 w-4" />
                  Inscribir emprendedor
                </Button>
              </div>
            )}
            <AttendancePanel jornada={jornada} canManage={canManage} refreshKey={refreshKey} />
          </div>
        ) : (
          <PendingIntegrationNotice title="Registro de asistencia no habilitado">
            No tienes permiso para registrar la asistencia de esta jornada.
          </PendingIntegrationNotice>
        ))}
    </Modal>
  );
}
