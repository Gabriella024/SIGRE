// pages/ProjectsPage.tsx
import React from "react";
import { MOCK_PROJECTS } from "@/features/proyects/mocks/ProyectMocks";
import ProjectsTable from "@/features/proyects/components/ProjectsTable";
import type { Project } from "@/features/proyects/types/proyect";
import { ProjectsFilters } from "@/features/proyects/components/ProjectsFilters";


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