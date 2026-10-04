import { Download, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FiltersBar, type FilterConfig } from '@/components/ui/filtersBar'

type PitchFiltersProps = {
  activeTab: string
  onTabChange: (value: string) => void
}

type Filters = {
  estado: string
  modalidad: string
  fechaHoraAtencion: string
}

const initialFilters: Filters = { estado: '', modalidad: '', fechaHoraAtencion: '' }

export function PitchFilters({ activeTab, onTabChange }: PitchFiltersProps) {
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
        { value: 'Programado', label: 'Programado' },
        { value: 'Cerrado', label: 'Cerrado' },
        { value: 'En Evaluación', label: 'En Evaluación' },
      ],
    },
    {
      key: 'modalidad',
      label: 'Modalidad',
      value: filters.modalidad,
      placeholder: 'Todas las modalidades',
      onChange: setFilter('modalidad'),
      options: [
        { value: 'Virtual', label: 'Virtual' },
        { value: 'Presencial', label: 'Presencial' },
      ],
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
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={onTabChange}>
        <TabsList>
          <TabsTrigger value="R5" className="gap-1.5">
            R5
            <span className="text-[11px] text-slate-500 font-normal">(Prep. Pitch)</span>
          </TabsTrigger>
          <TabsTrigger value="R6" className="gap-1.5">
            R6
            <span className="text-[11px] text-slate-500 font-normal">(Pitch)</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

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
            <Button className="gap-2 bg-lime-500 hover:bg-lime-600 text-slate-900 font-medium">
              <Plus className="h-4 w-4" />
              Nueva sesión
            </Button>
          </>
        }
      />
    </div>
  )
}