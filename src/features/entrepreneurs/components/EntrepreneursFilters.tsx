import { useState } from 'react'
import { Download, Plus, Grip } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FiltersBar, type FilterConfig } from '@/components/ui/filtersBar'

type Filters = {
  estado: string
  municipio: string
}

const initialFilters: Filters = { estado: '', municipio: '' }

export function EntrepreneursFilters() {
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
        { value: 'suspendido', label: 'Suspendido' },
      ],
    },
    {
      key: 'municipio',
      label: 'Municipio',
      value: filters.municipio,
      placeholder: 'Todos los municipios',
      onChange: setFilter('municipio'),
      options: [],
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
          <Grip className='h-4 w-4' />

          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button className="gap-2 bg-lime-500 hover:bg-lime-600">
            <Plus className="h-4 w-4" />
            Nuevo Pitch
          </Button>
        </>
      }
    />
  )
}