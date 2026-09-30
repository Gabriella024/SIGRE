import { Download, Plus, Grip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from 'react'
import { FiltersBar, type FilterConfig } from '@/components/ui/filtersBar'

type Filters = {
  estado: string
  modalidad: string
}

const initialFilters: Filters = { estado: '', modalidad: '' }

export function PitchFilters() {

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
      key: 'modalidad',
      label: 'Modalidad',
      value: filters.modalidad,
      placeholder: 'Todos las modalidades',
      onChange: setFilter('modalidad'),
      options: [
        { value: 'programado', label: 'Programado' },
        { value: 'cerrado', label: 'Cerrado' },
        { value: 'en evaluación', label: 'En evaluación' },
      ],
    },
  ]

  return (
    <FiltersBar
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder="Buscar por sesión..."
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
            Nuevo Pitch
          </Button>
        </>
      }
    />
  )
}