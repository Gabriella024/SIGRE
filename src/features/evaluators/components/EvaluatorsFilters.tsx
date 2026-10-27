import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FiltersBar, type FilterConfig, type FilterOption } from "@/components/ui/filtersBar";
import { INITIAL_EVALUATOR_FILTERS } from "../utils/evaluatorUtils";
import type { EvaluatorFilters } from "../types/evaluators";

type EvaluatorsFiltersProps = {
	value: EvaluatorFilters
	onChange: (value: EvaluatorFilters) => void
	estadoOptions: FilterOption[]
	onCreate?: () => void
}

export function EvaluatorsFilters({ value, onChange, estadoOptions, onCreate }: EvaluatorsFiltersProps) {
	const filterConfig: FilterConfig[] = [
		{
			key: 'estado',
			label: 'Estado',
			value: value.estado,
			placeholder: 'Todos los estados',
			onChange: (estado) => onChange({ ...value, estado }),
			options: estadoOptions,
		}
	]

	return (
		<FiltersBar
			searchTerm={value.search}
			onSearchChange={(search) => onChange({ ...value, search })}
			searchPlaceholder="Buscar por nombre, documento, especialidad, entidad o teléfono..."
			filters={filterConfig}
			onClearFilters={() => onChange(INITIAL_EVALUATOR_FILTERS)}
			actions={
				onCreate && (
					<Button onClick={onCreate} className="gap-2 bg-lime-500 hover:bg-lime-600">
						<Plus className="h-4 w-4" />
						Nuevo Evaluador
					</Button>
				)
			}
		/>
	)
}
