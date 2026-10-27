import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FiltersBar, type FilterConfig, type FilterOption } from '@/components/ui/filtersBar'
import { INITIAL_PITCH_FILTERS } from "../utils/pitchUtils"
import type { PitchFilters as PitchFiltersValue, PitchStage } from "../types/pitch"

type PitchFiltersProps = {
  activeTab: PitchStage
  onTabChange: (value: PitchStage) => void
  showPreparation: boolean
  value: PitchFiltersValue
  onChange: (value: PitchFiltersValue) => void
  estadoOptions: FilterOption[]
  modalidadOptions: FilterOption[]
  onCreate?: () => void
}

export function PitchFilters({
  activeTab,
  onTabChange,
  showPreparation,
  value,
  onChange,
  estadoOptions,
  modalidadOptions,
  onCreate,
}: PitchFiltersProps) {
  const set = (key: keyof PitchFiltersValue) => (next: string) => onChange({ ...value, [key]: next })

  const filterConfig: FilterConfig[] = [
    {
      key: 'estado',
      label: 'Estado',
      value: value.estado,
      placeholder: 'Todos los estados',
      onChange: set('estado'),
      options: estadoOptions,
    },
    ...(activeTab === 'R6'
      ? [
          {
            key: 'modalidad',
            label: 'Modalidad',
            value: value.modalidad,
            placeholder: 'Todas las modalidades',
            onChange: set('modalidad'),
            options: modalidadOptions,
          },
        ]
      : []),
    {
      key: 'fecha',
      label: 'Fecha',
      type: 'date',
      value: value.fecha,
      onChange: set('fecha'),
    },
  ]

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(next) => onTabChange(next === 'R5' ? 'R5' : 'R6')}>
        <TabsList>
          {showPreparation && (
            <TabsTrigger value="R5" className="gap-1.5">
              R5
              <span className="text-[11px] text-slate-500 font-normal">(Prep. Pitch)</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="R6" className="gap-1.5">
            R6
            <span className="text-[11px] text-slate-500 font-normal">(Pitch)</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <FiltersBar
        searchTerm={value.search}
        onSearchChange={set('search')}
        searchPlaceholder="Buscar por proyecto, emprendedor, lugar o evaluador..."
        filters={filterConfig}
        onClearFilters={() => onChange(INITIAL_PITCH_FILTERS)}
        actions={
          onCreate && activeTab === 'R6' && (
            <Button onClick={onCreate} className="gap-2 bg-lime-500 hover:bg-lime-600 text-slate-900 font-medium">
              <Plus className="h-4 w-4" />
              Programar pitch
            </Button>
          )
        }
      />
    </div>
  )
}
