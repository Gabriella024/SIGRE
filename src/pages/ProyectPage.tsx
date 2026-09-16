import { DataTable } from '@/components/ui/data-table'
import { proyectoColumns } from '@/features/proyects/columns'
import { ProyectMock } from '@/features/proyects/mocks/ProyectMocks'
import { ProjectsFilters } from '@/components/proyects/ProjectsFilters'

export function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Gestión de Proyectos</h1>
      </div>

      <ProjectsFilters />
      <DataTable columns={proyectoColumns} data={ProyectMock} pageSize={5} />
    </div>
  )
}