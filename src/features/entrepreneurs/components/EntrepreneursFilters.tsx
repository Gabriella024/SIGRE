import { Download, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  FiltersBar,
  type FilterActionHandlers,
  type FilterConfig,
  type FilterOption,
} from '@/components/ui/filtersBar'
import { INITIAL_ENTREPRENEUR_FILTERS } from '../utils/entrepreneurUtils'
import type { EntrepreneurFilters } from '../types/entrepreneur'

type EntrepreneursFiltersProps = FilterActionHandlers & {
  value: EntrepreneurFilters
  onChange: (value: EntrepreneurFilters) => void
  estadoOptions: FilterOption[]
  centroOptions: FilterOption[]
}

export function EntrepreneursFilters({
  value,
  onChange,
  estadoOptions,
  centroOptions,
  onCreate,
  onExport,
}: EntrepreneursFiltersProps) {
  const setFilter = (key: keyof EntrepreneurFilters) => (next: string) =>
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
      key: 'centro',
      label: 'Centro SENA',
      value: value.centro,
      placeholder: 'Todos los centros',
      onChange: setFilter('centro'),
      options: centroOptions,
    },
  ]

  return (
    <FiltersBar
      searchTerm={value.search}
      onSearchChange={setFilter('search')}
      searchPlaceholder="Buscar por nombre, centro o programa..."
      filters={filterConfig}
      onClearFilters={() => onChange({ ...INITIAL_ENTREPRENEUR_FILTERS, search: value.search })}
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
              Nuevo emprendedor
            </Button>
          )}
        </>
      }
    />
  )
}
