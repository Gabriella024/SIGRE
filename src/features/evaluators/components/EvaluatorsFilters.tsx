import { Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { FiltersBar, type FilterConfig } from "@/components/ui/filtersBar";

type Filters = {
	estado: string
}

const initialFilters: Filters = { estado: '' }

export function EvaluatorsFilters() {
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
			],
		}
	]

	return (
		<FiltersBar
			searchTerm={searchTerm}
			onSearchChange={setSearchTerm}
			searchPlaceholder="Buscar por nombre, documento, especialidad, entidad o teléfono..."
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
						Nuevo Evaluador
					</Button>
				</>
			}
		/>

	)
}