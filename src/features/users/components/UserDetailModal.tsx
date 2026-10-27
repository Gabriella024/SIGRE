import { Pencil, Power } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DetailField } from "@/components/ui/detail-section";
import { Modal } from "@/components/ui/modal";
import { NullableText } from "@/components/ui/nullable-text";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatTimestamp } from "@/lib/format";

import { RoleBadge } from "./RoleBadge";
import { isActiveUser } from "../utils/userUtils";

import type { User } from "../types/users";

interface UserDetailModalProps {
  user: User | null;
  onClose: () => void;
  onEdit?: (user: User) => void;
  onToggleStatus?: (user: User) => void;
}

export function UserDetailModal({ user, onClose, onEdit, onToggleStatus }: UserDetailModalProps) {
  return (
    <Modal open={user !== null} onOpenChange={(next) => !next && onClose()} title="Detalle del usuario">
      {user && (
        <div className="space-y-5">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <DetailField label="Nombre" wide>
              {user.nombre}
            </DetailField>
            <DetailField label="Correo">
              <NullableText value={user.correo} />
            </DetailField>
            <DetailField label="Teléfono">
              <NullableText value={user.telefono} />
            </DetailField>
            <DetailField label="Tipo de documento">
              <NullableText value={user.tipoDocumento} />
            </DetailField>
            <DetailField label="Número de documento">
              <NullableText value={user.numeroDocumento} />
            </DetailField>
            <DetailField label="Municipio">
              <NullableText value={user.municipio && `${user.municipio}${user.departamento ? ` (${user.departamento})` : ""}`} />
            </DetailField>
            <DetailField label="Estado">
              <StatusBadge value={user.estado} />
            </DetailField>
            <DetailField label="Roles" wide>
              {user.roles.length === 0 ? (
                <span className="text-xs text-slate-400">Sin roles activos</span>
              ) : (
                <span className="flex flex-wrap gap-1.5">
                  {user.roles.map((role) => (
                    <RoleBadge key={role.id} rol={role.rol} />
                  ))}
                </span>
              )}
            </DetailField>
            <DetailField label="Último acceso">
              {user.ultimoAcceso ? formatTimestamp(user.ultimoAcceso) : "Nunca"}
            </DetailField>
            <DetailField label="Fecha de creación">
              {user.fechaCreacion ? formatTimestamp(user.fechaCreacion) : "—"}
            </DetailField>
          </dl>

          {(onEdit || onToggleStatus) && (
            <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
              {onToggleStatus && (
                <Button type="button" variant="outline" className="gap-2" onClick={() => onToggleStatus(user)}>
                  <Power className="h-4 w-4" />
                  {isActiveUser(user) ? "Desactivar" : "Activar"}
                </Button>
              )}
              {onEdit && (
                <Button type="button" className="gap-2 bg-lime-500 hover:bg-lime-600" onClick={() => onEdit(user)}>
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
