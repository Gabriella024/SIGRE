import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FiltersBar, type FilterConfig } from '@/components/ui/filtersBar'

type Filters = {
  resultado: string
  fechaPitch: string
}

const initialFilters: Filters = { resultado: '', fechaPitch: '' }


export function ResultFilters() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<Filters>(initialFilters)

  const setFilter = (key: keyof Filters) => (value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }))

  const filterConfig: FilterConfig[] = [
    {
      key: 'resultado',
      label: 'Resultado',
      value: filters.resultado,
      placeholder: 'Todos los Resultado',
      onChange: setFilter('resultado'),
      options: [
        { value: 'completado', label: 'Completado' },
        { value: 'rechazado', label: 'Rechazado' },
        { value: 'en revión', label: 'En revión' },
      ],
    },
    {
      key: 'fechaRegistro',
      label: 'Fecha de Registro',
      type: 'date',
      value: filters.fechaPitch,
      onChange: setFilter('fechaPitch'),
    }
  ]

  return (
    <FiltersBar
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder="Buscar por código, nombre o evaluadores... "
      filters={filterConfig}
      onClearFilters={() => setFilters(initialFilters)}
      actions={
        <>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>

        </>
      }
    />
  )
}