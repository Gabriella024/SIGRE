import { FiltersBar, type FilterConfig } from '@/components/ui/filtersBar'
import { INITIAL_RESULT_FILTERS } from '../utils/evaluationUtils'
import type { ResultFiltersValue } from '../types/resultado'

type ResultFiltersProps = {
  value: ResultFiltersValue
  onChange: (value: ResultFiltersValue) => void
}

export function ResultFilters({ value, onChange }: ResultFiltersProps) {
  const filterConfig: FilterConfig[] = [
    {
      key: 'resultado',
      label: 'Resultado',
      value: value.resultado,
      placeholder: 'Todos los resultados',
      onChange: (resultado) => onChange({ ...value, resultado }),
      options: [
        { value: 'Calificación completa', label: 'Calificación completa' },
        { value: 'En revisión', label: 'En revisión' },
      ],
    },
    {
      key: 'fechaPitch',
      label: 'Fecha del pitch',
      type: 'date',
      value: value.fechaPitch,
      onChange: (fechaPitch) => onChange({ ...value, fechaPitch }),
    }
  ]

  return (
    <FiltersBar
      searchTerm={value.search}
      onSearchChange={(search) => onChange({ ...value, search })}
      searchPlaceholder="Buscar por proyecto, emprendedor o evaluadores..."
      filters={filterConfig}
      onClearFilters={() => onChange(INITIAL_RESULT_FILTERS)}
    />
  )
}
