import type { Column } from "@/components/ui/table/types";
import { AvatarInitials } from '@/components/ui/avatar-initials'
import type { User, EstadoUsuario } from "./types/users";
import { RoleBadge } from "@/components/users/RoleBadge";

function EstadoBadge({ estado }: { estado: EstadoUsuario }) {
  const styles: Record<EstadoUsuario, string> = {
    Activo: "bg-emerald-100 text-emerald-700",
    Inactivo: "bg-rose-100 text-rose-700",
    Suspendido: "bg-gray-100 text-gray-800",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[estado]}`}>
      {estado}
    </span>
  );
}

export const USER_COLUMNS: Column<User>[] = [
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
  },
  {
    key: "roles",
    label: "ROL(ES)",
    sortable: false,
    render: (row) => (
      <div className="flex flex-wrap gap-1.5">
        {row.roles.map((rol) => (
          <RoleBadge key={rol} rol={rol}/>
        ))}
      </div>
    )
  },
  {
    key: "estado",
    label: "ESTADO",
    sortable: false,
    render: (row) => <EstadoBadge estado={row.estado} />,
  },
  {
    key: "ultimoAcceso",
    label: "ÚLTIMO ACCESO",
    sortable: true,
  },
  {
    key: "fechaCreacion",
    label: "FECHA DE CREACIÓN",
    sortable: true,
  },
]