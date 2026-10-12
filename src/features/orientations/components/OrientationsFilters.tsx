import { Download, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  FiltersBar,
  type FilterActionHandlers,
  type FilterConfig,
  type FilterOption,
} from '@/components/ui/filtersBar'
import { INITIAL_ORIENTATION_FILTERS } from '../utils/orientationUtils'
import type { OrientationFilters } from '../types/orientations'

type OrientationsFiltersProps = FilterActionHandlers & {
  value: OrientationFilters
  onChange: (value: OrientationFilters) => void
  estadoOptions: FilterOption[]
  modalidadOptions: FilterOption[]
}

export function OrientationsFilters({
  value,
  onChange,
  estadoOptions,
  modalidadOptions,
  onCreate,
  onExport,
}: OrientationsFiltersProps) {
  const setFilter = (key: keyof OrientationFilters) => (next: string) =>
    onChange({ ...value, [key]: next })

  const filterConfig: FilterConfig[] = [
    {
      key: 'estado',
      label: 'Estado',
      value: value.estado,
      placeholder: 'Todos los estados',
      onChange: setFilter('estado'),
      options: estadoOptions,
    },
    {
      key: 'modalidad',
      label: 'Modalidad',
      value: value.modalidad,
      placeholder: 'Todas las modalidades',
      onChange: setFilter('modalidad'),
      options: modalidadOptions,
    },
    {
      key: 'fecha',
      label: 'Fecha',
      type: 'date',
      value: value.fecha,
      onChange: setFilter('fecha'),
    },
  ]

  return (
    <FiltersBar
      searchTerm={value.search}
      onSearchChange={setFilter('search')}
      searchPlaceholder="Buscar por jornada o lugar..."
      filters={filterConfig}
      onClearFilters={() => onChange({ ...INITIAL_ORIENTATION_FILTERS, search: value.search })}
      actions={
        <>
          {onExport && (
            <Button onClick={onExport} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          )}
          {onCreate && (
            <Button onClick={onCreate} className="gap-2 bg-lime-500 hover:bg-lime-600">
              <Plus className="h-4 w-4" />
              Nueva Orientación
            </Button>
          )}
        </>
      }
    />
  )
}
