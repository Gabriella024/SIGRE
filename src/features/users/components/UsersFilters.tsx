import { Plus, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { FiltersBar, type FilterConfig, type FilterActionHandlers } from '@/components/ui/filtersBar'


type Filters = {
  estado: string
  fechaCreacion: string
  fechaUltimoAcceso: string
}

const initialFilters: Filters = { estado: '', fechaCreacion: '', fechaUltimoAcceso: '' }

export function UsersFilters({ onCreate, onExport }: FilterActionHandlers) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<Filters>(initialFilters)

  const setFilter = (key: keyof Filters) => (value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }))

  const filterConfig: FilterConfig[] = [
    {
      key: 'estado',
      label: 'Estado',
      value: filters.estado,
      placeholder: 'Todos los estados',
      onChange: setFilter('estado'),
      options: [
        { value: 'activo', label: 'Activo' },
        { value: 'inactivo', label: 'Inactivo' },
        { value: 'finalizado', label: 'Finalizado' },
      ],
    },
    {
      key: 'fechaCreacion',
      label: 'Fecha de Creación',
      type: 'datetime',
      value: filters.fechaCreacion,
      onChange: setFilter('fechaCreacion'),
    },
    {
      key: 'fechaUltimoAcceso',
      label: 'Último acceso',
      type: 'datetime',
      value: filters.fechaUltimoAcceso,
      onChange: setFilter('fechaUltimoAcceso'),
    },
  ]

  return (


    <FiltersBar
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder="Buscar por nombre, documento o correo..."
      filters={filterConfig}
      onClearFilters={() => setFilters(initialFilters)}
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
              Nuevo Pitch
            </Button>
          )}
        </>
      }
    />

  )
}