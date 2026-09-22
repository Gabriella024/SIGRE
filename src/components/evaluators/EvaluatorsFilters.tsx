import { Search, Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function EvaluatorsFilters() {
	return (
		<div className="space-y-3">
			<div className="flex flex-wrap gap-3">
				<select className="rounded-md border px-3 py-2 text-sm text-slate-600">
					<option>Todos los estados</option>
					<option>Activo</option>
					<option>Inactivo</option>
				</select>
			</div>

			<div className="flex items-center gap-3">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
					<Input placeholder="Buscar por nombre, documento, especialidad o entidad..." className="pl-9" />
				</div>
				<Button variant="outline" className="gap-2">
					<Download className="h-4 w-4" />
					Exportar
				</Button>
				<Button className="gap-2 bg-lime-500 hover:bg-lime-600">
					<Plus className="h-4 w-4" />
					Nuevo Evaluador
				</Button>
			</div>
		</div>
	)
}