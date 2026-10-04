import { Download, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FiltersBar, type FilterConfig } from '@/components/ui/filtersBar'

type ChallengesFiltersProps = {
  activeTab: string
  onTabChange: (value: string) => void
  showAddButton?: boolean
}

type Filters = {
  estado: string
  fechaHoraAtencion: string
}

const initialFilters: Filters = { estado: '', fechaHoraAtencion: '' }

export function ChallengesFilters({ activeTab, onTabChange, showAddButton = true }: ChallengesFiltersProps) {
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
        { value: 'programado', label: 'Programado' },
        { value: 'en curso', label: 'En curso' },
        { value: 'finalizado', label: 'Finalizado' },
        { value: 'cancelado', label: 'Cancelado' },
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
          <TabsTrigger value="R1">R1</TabsTrigger>
          <TabsTrigger value="R2">R2</TabsTrigger>
          <TabsTrigger value="R3">R3</TabsTrigger>
          <TabsTrigger value="R4" className="gap-1.5">
            R4
            <span className="rounded bg-lime-100 px-1.5 py-0.5 text-[10px] font-semibold text-lime-800">
              Sustentación
            </span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <FiltersBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por código o sesión..."
        filters={filterConfig}
        onClearFilters={() => setFilters(initialFilters)}
        actions={
          <>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            {showAddButton && (
              <Button className="gap-2 bg-lime-500 hover:bg-lime-600 text-slate-900 font-medium">
                <Plus className="h-4 w-4" />
                Nuevo Reto
              </Button>
            )}
          </>
        }
      />
    </div>
  )
}