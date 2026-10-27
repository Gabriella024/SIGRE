import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

type EvaluationTabsProps = {
  activeTab: string
  onTabChange: (value: string) => void
  showResults: boolean
}

export function EvaluationTabs({ activeTab, onTabChange, showResults }: EvaluationTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <TabsList>
        <TabsTrigger value="asignaciones">Asignaciones</TabsTrigger>
        {showResults && <TabsTrigger value="resultados">Resultados Consolidados</TabsTrigger>}
      </TabsList>
    </Tabs>
  )
}
