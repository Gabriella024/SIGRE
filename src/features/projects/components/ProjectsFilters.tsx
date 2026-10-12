import { Download, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  FiltersBar,
  type FilterActionHandlers,
  type FilterConfig,
  type FilterOption,
} from '@/components/ui/filtersBar'
import { INITIAL_PROJECT_FILTERS } from '../utils/proyectUtils'
import type { ProjectFilters } from '../types/proyect'

type ProjectsFiltersProps = FilterActionHandlers & {
  value: ProjectFilters
  onChange: (value: ProjectFilters) => void
  estadoOptions: FilterOption[]
  sectorOptions: FilterOption[]
  etapaOptions: FilterOption[]
}

export function ProjectsFilters({
  value,
  onChange,
  estadoOptions,
  sectorOptions,
  etapaOptions,
  onCreate,
  onExport,
}: ProjectsFiltersProps) {
  const setFilter = (key: keyof ProjectFilters) => (next: string) =>
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
      key: 'sector',
      label: 'Sector',
      value: value.sector,
      placeholder: 'Todos los sectores',
      onChange: setFilter('sector'),
      options: sectorOptions,
    },
    {
      key: 'etapa',
      label: 'Etapa',
      value: value.etapa,
      placeholder: 'Todas las etapas',
      onChange: setFilter('etapa'),
      options: etapaOptions,
    },
    {
      key: 'fechaRegistro',
      label: 'Fecha de Registro',
      type: 'date',
      value: value.fechaRegistro,
      onChange: setFilter('fechaRegistro'),
    },
  ]

  return (
    <FiltersBar
      searchTerm={value.search}
      onSearchChange={setFilter('search')}
      searchPlaceholder="Buscar por proyecto, emprendedor o sector... "
      filters={filterConfig}
      onClearFilters={() => onChange({ ...INITIAL_PROJECT_FILTERS, search: value.search })}
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
              Nuevo Proyecto
            </Button>
          )}
        </>
      }
    />
  )
}
