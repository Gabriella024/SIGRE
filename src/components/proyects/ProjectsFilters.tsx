import { useState } from 'react'
import { Download, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FiltersBar, type FilterConfig } from '@/components/ui/filtersBar'

type Filters = {
  estado: string
  municipio: string
  etapa: string
}

const initialFilters: Filters = { estado: '', municipio: '', etapa: '' }

export function ProjectsFilters() {
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
      key: 'municipio',
      label: 'Municipio',
      value: filters.municipio,
      placeholder: 'Todos los municipios',
      onChange: setFilter('municipio'),
      options: [],
    },
    {
      key: 'etapa',
      label: 'Etapa',
      value: filters.etapa,
      placeholder: 'Todas las etapas',
      onChange: setFilter('etapa'),
      options: [
        { value: 'registro', label: 'Registro' },
        { value: 'orientacion', label: 'Orientación' },
        { value: 'retos', label: 'Retos' },
        { value: 'pitch', label: 'Pitch' },
      ],
    },
  ]

  return (
    <FiltersBar
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder="Buscar por proyecto, emprendedor o sector... "
      filters={filterConfig}
      onClearFilters={() => setFilters(initialFilters)}
      actions={
        <>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button className="gap-2 bg-lime-500 hover:bg-lime-600">
            <Plus className="h-4 w-4" />
            Nuevo Miniperfil
          </Button>
        </>
      }
    />
  )
}
