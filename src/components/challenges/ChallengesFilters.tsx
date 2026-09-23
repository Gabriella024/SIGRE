import { Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type ChallengesFiltersProps = {
  activeTab: string
  onTabChange: (value: string) => void
}

export function ChallengesFilters  ({activeTab, onTabChange}: ChallengesFiltersProps ) {
	return (
		<div className="space-y-3">
				<Tabs value={activeTab} onValueChange={onTabChange}>
          <TabsList>
            <TabsTrigger value="metricas">Métricas</TabsTrigger>
            <TabsTrigger value="R1">R1</TabsTrigger>
            <TabsTrigger value="R2">R2</TabsTrigger>
            <TabsTrigger value="R3">R3</TabsTrigger>
          </TabsList>
        </Tabs>


			<div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Buscar por código, sesión o modalidad..." className="pl-9" />
        </div>
        <select className="rounded-md border px-3 py-2 text-sm text-slate-600">
          <option>Todos los estados</option>
          <option>Programado</option>
          <option>En curso</option>
          <option>Finalizado</option>
          <option>Cancelado</option>
        </select>
        <Button className="gap-2 bg-lime-500 hover:bg-lime-600">
          <Download className="h-4 w-4" />
          Exportar
        </Button>
      </div>
		</div>
	)
}