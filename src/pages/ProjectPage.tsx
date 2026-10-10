import { MOCK_PROJECTS } from "@/features/projects/mocks/ProyectMocks";
import ProjectsTable from "@/features/projects/components/ProjectsTable";
import type { Project } from "@/features/projects/types/proyect";
import { ProjectsFilters } from "@/features/projects/components/ProjectsFilters";


export function ProjectsPage() {
  const handleEdit = (project: Project) => {
    console.log("Editar proyecto:", project.nombre);
  };

  const handleDelete = (project: Project) => {
    console.log("Eliminar proyecto:", project.nombre);
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-slate-800">Gestión de Proyectos</h1>
      
      <ProjectsFilters/>
      
      <ProjectsTable
        data={MOCK_PROJECTS}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}