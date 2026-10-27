import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FiltersBar, type FilterConfig, type FilterOption } from '@/components/ui/filtersBar'

import { INITIAL_USER_FILTERS } from '../utils/userUtils'

import type { UserFilters } from '../types/users'

interface UsersFiltersProps {
  filters: UserFilters
  onChange: (filters: UserFilters) => void
  estadoOptions: FilterOption[]
  rolOptions: FilterOption[]
  onCreate?: () => void
}

export function UsersFilters({ filters, onChange, estadoOptions, rolOptions, onCreate }: UsersFiltersProps) {
  const setFilter = (key: keyof UserFilters) => (value: string) => onChange({ ...filters, [key]: value })

  const filterConfig: FilterConfig[] = [
    {
      key: 'estado',
      label: 'Estado',
      value: filters.estado,
      placeholder: 'Todos los estados',
      onChange: setFilter('estado'),
      options: estadoOptions,
    },
    {
      key: 'rol',
      label: 'Rol',
      value: filters.rol,
      placeholder: 'Todos los roles',
      onChange: setFilter('rol'),
      options: rolOptions,
    },
    {
      key: 'fechaCreacion',
      label: 'Fecha de Creación',
      type: 'date',
      value: filters.fechaCreacion,
      onChange: setFilter('fechaCreacion'),
    },
    {
      key: 'ultimoAcceso',
      label: 'Último acceso',
      type: 'date',
      value: filters.ultimoAcceso,
      onChange: setFilter('ultimoAcceso'),
    },
  ]

  return (
    <FiltersBar
      searchTerm={filters.search}
      onSearchChange={setFilter('search')}
      searchPlaceholder="Buscar por nombre, documento o correo..."
      filters={filterConfig}
      onClearFilters={() => onChange({ ...INITIAL_USER_FILTERS, search: filters.search })}
      actions={
        onCreate && (
          <Button onClick={onCreate} className="gap-2 bg-lime-500 hover:bg-lime-600">
            <UserPlus className="h-4 w-4" />
            Invitar usuario
          </Button>
        )
      }
    />
  )
}
