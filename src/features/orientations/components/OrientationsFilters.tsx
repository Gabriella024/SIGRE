import { Download, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { FiltersBar, type FilterConfig } from '@/components/ui/filtersBar'

type Filters = {
  estado: string
  modalidad: string
  fechaHoraAtencion: string
}

const initialFilters: Filters = { estado: '', modalidad: '', fechaHoraAtencion: '' }

export function OrientationsFilters() {
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
        { value: 'programada', label: 'Programada' },
        { value: 'finalizada', label: 'Finalizada' },
        { value: 'en proceso', label: 'En proceso' },
      ],
    },
    {
      key: 'modalidad',
      label: 'Modalidad',
      value: filters.modalidad,
      placeholder: 'Todos los municipios',
      onChange: setFilter('modalidad'),
      options: [],
    },
    {
    key: 'fechaHoraAtencion',
    label: 'Fecha y Hora',
    type: 'datetime',
    value: filters.fechaHoraAtencion,
    onChange: setFilter('fechaHoraAtencion'),
  },
  ]

  return (
    <FiltersBar
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder="Buscar por jornada..."
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
            Nueva Orientación
          </Button>
        </>
      }
    />
  )
}