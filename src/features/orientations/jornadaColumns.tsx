import type { ReactNode } from "react";
import { Eye, Pencil } from "lucide-react";

import type { Column } from "@/components/ui/table/types";
import { NullableText } from "@/components/ui/nullable-text";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateOnly, formatTime } from "@/lib/format";

import { AttendanceButton, EnrollButton, LugarLink, PendingValue } from "./components/JornadaCells";
import { modalidadLabel } from "./utils/orientationUtils";

import type { Orientacion } from "./types/orientations";

const iconButton =
  "rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";

const temaColumn: Column<Orientacion> = {
  key: "tema",
  label: "JORNADA",
  sortable: true,
  render: (row) => <span className="font-semibold text-slate-900">{row.tema}</span>,
};

const fechaColumn: Column<Orientacion> = {
  key: "fechaHora",
  label: "FECHA",
  sortable: true,
  render: (row) => formatDateOnly(row.fecha),
};

const horarioColumn: Column<Orientacion> = {
  key: "horario",
  label: "HORARIO",
  render: (row) => `${formatTime(row.horaInicio)}–${formatTime(row.horaFin)}`,
};

const fechaHoraColumn: Column<Orientacion> = {
  key: "fechaHora",
  label: "FECHA Y HORA",
  sortable: true,
  render: (row) =>
    `${formatDateOnly(row.fecha)} · ${formatTime(row.horaInicio)}–${formatTime(row.horaFin)}`,
};

const modalidadColumn: Column<Orientacion> = {
  key: "modalidad",
  label: "MODALIDAD",
  sortable: true,
  render: (row) => <NullableText value={modalidadLabel(row.modalidad)} />,
};

const lugarColumn: Column<Orientacion> = {
  key: "lugarLink",
  label: "LUGAR O ENLACE",
  sortable: true,
  render: (row) => <LugarLink value={row.lugarLink} />,
};

const estadoColumn: Column<Orientacion> = {
  key: "estado",
  label: "ESTADO",
  sortable: true,
  render: (row) => <StatusBadge value={row.estado} />,
};

const cupoColumn: Column<Orientacion> = {
  key: "cupo",
  label: "CUPO",
  align: "center",
  sortable: true,
  render: (row) => <NullableText value={row.cupo === null ? null : String(row.cupo)} />,
};

const pendingColumn = (key: string, label: string): Column<Orientacion> => ({
  key,
  label,
  align: "center",
  render: () => <PendingValue />,
});

type DetailHandler = (row: Orientacion) => void;

export function buildAdminColumns({
  onDetail,
  onEdit,
  onAttendance,
  onEnroll,
}: {
  onDetail: DetailHandler;
  onEdit?: DetailHandler;
  onAttendance?: DetailHandler;
  onEnroll?: DetailHandler;
}): Column<Orientacion>[] {
  return [
    temaColumn,
    fechaColumn,
    horarioColumn,
    modalidadColumn,
    lugarColumn,
    cupoColumn,
    estadoColumn,
    {
      key: "acciones",
      label: "ACCIONES",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button type="button" className={iconButton} onClick={() => onDetail(row)} aria-label="Ver detalles" title="Ver detalles">
            <Eye className="h-4 w-4" />
          </button>
          {onEdit && (
            <button type="button" className={iconButton} onClick={() => onEdit(row)} aria-label="Editar" title="Editar">
              <Pencil className="h-4 w-4" />
            </button>
          )}
          <AttendanceButton className={iconButton} onClick={onAttendance && (() => onAttendance(row))} />
          {onEnroll && <EnrollButton className={iconButton} onClick={() => onEnroll(row)} />}
        </div>
      ),
    },
  ];
}

export function buildCoordinatorColumns({ onDetail }: { onDetail: DetailHandler }): Column<Orientacion>[] {
  return [
    temaColumn,
    fechaColumn,
    horarioColumn,
    modalidadColumn,
    lugarColumn,
    cupoColumn,
    {
      key: "orientador",
      label: "ORIENTADOR",
      render: (row) =>
        row.idOrientador ? <PendingValue label="Nombre del orientador pendiente de integración" /> : <span className="text-xs text-slate-400">Sin asignar</span>,
    },
    estadoColumn,
    {
      key: "acciones",
      label: "ACCIONES",
      align: "right",
      render: (row) => (
        <button type="button" className={iconButton} onClick={() => onDetail(row)} aria-label="Ver detalles" title="Ver detalles">
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ];
}

export function buildOrientadorColumns({
  onDetail,
  onAttendance,
  onEnroll,
}: {
  onDetail: DetailHandler;
  onAttendance?: DetailHandler;
  onEnroll?: DetailHandler;
}): Column<Orientacion>[] {
  return [
    temaColumn,
    fechaHoraColumn,
    modalidadColumn,
    lugarColumn,
    cupoColumn,
    pendingColumn("inscritos", "INSCRITOS"),
    pendingColumn("asistentes", "ASISTENTES"),
    pendingColumn("noAsistentes", "NO ASISTENTES"),
    {
      key: "acciones",
      label: "ACCIONES",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button type="button" className={iconButton} onClick={() => onDetail(row)} aria-label="Ver detalles" title="Ver detalles">
            <Eye className="h-4 w-4" />
          </button>
          <AttendanceButton className={iconButton} onClick={onAttendance && (() => onAttendance(row))} />
          {onEnroll && <EnrollButton className={iconButton} onClick={() => onEnroll(row)} />}
        </div>
      ),
    },
  ];
}

export function buildAvailableColumns({
  enrollCell,
}: {
  enrollCell: (row: Orientacion) => ReactNode;
}): Column<Orientacion>[] {
  return [
    temaColumn,
    fechaHoraColumn,
    modalidadColumn,
    lugarColumn,
    cupoColumn,
    {
      key: "acciones",
      label: "INSCRIPCIÓN",
      align: "right",
      render: enrollCell,
    },
  ];
}
