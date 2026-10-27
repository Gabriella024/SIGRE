import type { ReactNode } from 'react'
import { Download, Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  FiltersBar,
  type FilterActionHandlers,
  type FilterConfig,
  type FilterOption,
} from '@/components/ui/filtersBar'
import { INITIAL_ENTREPRENEUR_FILTERS, ORIENTADOR_FILTER_OPTIONS } from '../utils/entrepreneurUtils'
import type { EntrepreneurFilters } from '../types/entrepreneur'

type EntrepreneursFiltersProps = FilterActionHandlers & {
  value: EntrepreneurFilters
  onChange: (value: EntrepreneurFilters) => void
  estadoOptions: FilterOption[]
  centroOptions: FilterOption[]
  nivelOptions: FilterOption[]
  tipoOptions: FilterOption[]
  viewToggle?: ReactNode
  isExporting?: boolean
  showOrientadorFilter?: boolean
}

export function EntrepreneursFilters({
  value,
  onChange,
  estadoOptions,
  centroOptions,
  nivelOptions,
  tipoOptions,
  viewToggle,
  isExporting = false,
  showOrientadorFilter = true,
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
    {
      key: 'nivelFormacion',
      label: 'Nivel de formación',
      value: value.nivelFormacion,
      placeholder: 'Todos los niveles',
      onChange: setFilter('nivelFormacion'),
      options: nivelOptions,
    },
    {
      key: 'tipo',
      label: 'Tipo de emprendedor',
      value: value.tipo,
      placeholder: 'Todos los tipos',
      onChange: setFilter('tipo'),
      options: tipoOptions,
    },
  ]

  if (showOrientadorFilter) {
    filterConfig.push({
      key: 'orientador',
      label: 'Orientador',
      value: value.orientador,
      placeholder: 'Todos',
      onChange: setFilter('orientador'),
      options: ORIENTADOR_FILTER_OPTIONS,
    })
  }

  return (
    <FiltersBar
      searchTerm={value.search}
      onSearchChange={setFilter('search')}
      searchPlaceholder="Buscar por nombre, centro, programa, nivel, tipo u orientador..."
      filters={filterConfig}
      onClearFilters={() => onChange({ ...INITIAL_ENTREPRENEUR_FILTERS, search: value.search })}
      actions={
        <>
          {viewToggle}
          {onExport && (
            <Button onClick={onExport} variant="outline" className="gap-2" disabled={isExporting} aria-busy={isExporting}>
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {isExporting ? 'Exportando…' : 'Exportar'}
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
