import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

type EvaluationTabsProps = {
  activeTab: string
  onTabChange: (value: string) => void
}

export function EvaluationTabs({ activeTab, onTabChange }: EvaluationTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <TabsList>
        <TabsTrigger value="asignaciones">Asignaciones</TabsTrigger>
        <TabsTrigger value="resultados">Resultados Consolidados</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}