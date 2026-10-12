import type { Column } from '@/components/ui/table/types'
import { NullableText } from '@/components/ui/nullable-text'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatDateOnly, formatTime } from '@/lib/format'

import type { Orientacion } from './types/orientations'
import { isUrl } from './utils/orientationUtils'

function LugarLink({ value }: { value: string | null }) {
  if (value && isUrl(value)) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sky-700 underline hover:text-sky-900"
      >
        Abrir enlace
      </a>
    )
  }

  return <NullableText value={value} />
}

export const ORIENTATION_COLUMNS: Column<Orientacion>[] = [
  {
    key: 'tema',
    label: 'JORNADA',
    sortable: true,
    render: (row) => (
      <span className="font-semibold text-slate-900">{row.tema}</span>
    ),
  },
  {
    key: 'fechaHora',
    label: 'FECHA Y HORA',
    sortable: true,
    render: (row) =>
      `${formatDateOnly(row.fecha)} · ${formatTime(row.horaInicio)}–${formatTime(row.horaFin)}`,
  },
  {
    key: 'modalidad',
    label: 'MODALIDAD',
    sortable: true,
    render: (row) => <NullableText value={row.modalidad} />,
  },
  {
    key: 'lugarLink',
    label: 'LUGAR Y LINK',
    sortable: true,
    render: (row) => <LugarLink value={row.lugarLink} />,
  },
  {
    key: 'audiencia',
    label: 'AUDIENCIA ESPERADA',
    sortable: true,
    render: (row) => <NullableText value={row.audiencia} />,
  },
  {
    key: 'estado',
    label: 'ESTADO',
    sortable: true,
    render: (row) => <StatusBadge value={row.estado} />,
  },
]
