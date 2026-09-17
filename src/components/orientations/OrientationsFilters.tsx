import { Search, Download, Plus, Grip } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function OrientationsFilters() {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <Grip className='h-4 w-4' />

        <div className="flex flex-wrap gap-3">
          <select className="rounded-md border px-3 py-2 text-sm text-slate-600">
            <option>Todos</option>
            <option>Presencial</option>
            <option>Virtual</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Buscar por jornada..." className="pl-9" />
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar
        </Button>
        <Button className="gap-2 bg-lime-500 hover:bg-lime-600">
          <Plus className="h-4 w-4" />
          Nueva Orientación
        </Button>
      </div>
    </div>
  )
}