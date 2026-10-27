import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FiltersBar, type FilterConfig, type FilterOption } from '@/components/ui/filtersBar'
import { INITIAL_CHALLENGE_FILTERS } from "../utils/challengeUtils"
import type { ChallengeFilters } from "../types/Challenge"

type ChallengesFiltersProps = {
  value: ChallengeFilters
  onChange: (value: ChallengeFilters) => void
  niveles: string[]
  estadoOptions: FilterOption[]
  onCreate?: () => void
}

const ALL = "__todos__"

export function ChallengesFilters({ value, onChange, niveles, estadoOptions, onCreate }: ChallengesFiltersProps) {
  const set = (key: keyof ChallengeFilters) => (next: string) => onChange({ ...value, [key]: next })

  const filterConfig: FilterConfig[] = [
    {
      key: 'estado',
      label: 'Estado',
      value: value.estado,
      placeholder: 'Todos los estados',
      onChange: set('estado'),
      options: estadoOptions,
    },
  ]

  return (
    <div className="space-y-4">
      <Tabs value={value.nivel || ALL} onValueChange={(next) => set('nivel')(next === ALL ? '' : next)}>
        <TabsList>
          <TabsTrigger value={ALL}>Todos</TabsTrigger>
          {niveles.map((nivel) => (
            <TabsTrigger key={nivel} value={nivel}>{nivel}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <FiltersBar
        searchTerm={value.search}
        onSearchChange={set('search')}
        searchPlaceholder="Buscar por título, descripción o nivel..."
        filters={filterConfig}
        onClearFilters={() => onChange({ ...INITIAL_CHALLENGE_FILTERS, nivel: value.nivel })}
        actions={
          onCreate && (
            <Button onClick={onCreate} className="gap-2 bg-lime-500 hover:bg-lime-600 text-slate-900 font-medium">
              <Plus className="h-4 w-4" />
              Nuevo Reto
            </Button>
          )
        }
      />
    </div>
  )
}
