// pages/ProjectsPage.tsx
import React from "react";
import { MOCK_PROJECTS } from "@/features/proyects/mocks/ProyectMocks";
import ProjectsTable from "@/components/proyects/ProjectsTable";
import type { Project } from "@/features/proyects/types/proyect";
import { ProjectsFilters } from "@/components/proyects/ProjectsFilters";


export default function ProjectsPage() {
  const handleEdit = (project: Project) => {
    console.log("Editar proyecto:", project.nombre);
  };

  const handleDelete = (project: Project) => {
    console.log("Eliminar proyecto:", project.nombre);
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-slate-800">Proyectos</h1>
      
      <ProjectsFilters/>
      
      <ProjectsTable
        data={MOCK_PROJECTS}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}