import { Eye, Pencil, Power } from "lucide-react";

import type { Column } from "@/components/ui/table/types";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { NullableText } from "@/components/ui/nullable-text";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatTimestamp } from "@/lib/format";
import { RoleBadge } from "@/features/users/components/RoleBadge";

import { isActiveUser } from "./utils/userUtils";

import type { User } from "./types/users";

export interface UserRowActions {
  onView: (user: User) => void;
  onEdit?: (user: User) => void;
  onToggleStatus?: (user: User) => void;
}

const actionClass = "rounded-md p-2 text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400";

export function createUserColumns({ onView, onEdit, onToggleStatus }: UserRowActions): Column<User>[] {
  return [
    {
      key: "nombre",
      label: "NOMBRE",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <AvatarInitials nombre={row.nombre} />
          <span className="font-medium text-slate-900">{row.nombre}</span>
        </div>
      ),
    },
    {
      key: "correo",
      label: "CORREO",
      sortable: true,
      render: (row) => <NullableText value={row.correo} />,
    },
    {
      key: "roles",
      label: "ROL(ES)",
      render: (row) =>
        row.roles.length === 0 ? (
          <span className="text-xs text-slate-400">Sin roles</span>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {row.roles.map((role) => (
              <RoleBadge key={role.id} rol={role.rol} />
            ))}
          </div>
        ),
    },
    {
      key: "estado",
      label: "ESTADO",
      render: (row) => <StatusBadge value={row.estado} />,
    },
    {
      key: "ultimoAcceso",
      label: "ÚLTIMO ACCESO",
      sortable: true,
      render: (row) => (row.ultimoAcceso ? formatTimestamp(row.ultimoAcceso) : <span className="text-xs text-slate-400">Nunca</span>),
    },
    {
      key: "fechaCreacion",
      label: "FECHA DE CREACIÓN",
      sortable: true,
      render: (row) => (row.fechaCreacion ? formatTimestamp(row.fechaCreacion) : "—"),
    },
    {
      key: "acciones",
      label: "ACCIONES",
      align: "right",
      render: (row) => (
        <div className="flex justify-end gap-1">
          <button type="button" onClick={() => onView(row)} aria-label={`Ver ${row.nombre}`} className={actionClass}>
            <Eye className="h-4 w-4" />
          </button>
          {onEdit && (
            <button type="button" onClick={() => onEdit(row)} aria-label={`Editar ${row.nombre}`} className={actionClass}>
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {onToggleStatus && (
            <button
              type="button"
              onClick={() => onToggleStatus(row)}
              aria-label={`${isActiveUser(row) ? "Desactivar" : "Activar"} ${row.nombre}`}
              title={isActiveUser(row) ? "Desactivar" : "Activar"}
              className={`rounded-md p-2 ${isActiveUser(row) ? "text-red-500 hover:bg-red-50" : "text-green-600 hover:bg-green-50"}`}
            >
              <Power className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];
}
