import React from "react"
import { MOCK_ENTREPRENEURS } from "@/features/entrepreneurs/mocks/EntrepreneursMocks"
import { EntrepreneursTable } from "@/features/entrepreneurs/components/EntrepreneursTable"
import type { Entrepreneur } from "@/features/entrepreneurs/types/entrepreneur"
import { EntrepreneursFilters } from "@/features/entrepreneurs/components/EntrepreneursFilters"

export function EntrepreneursPage() {
  const handleEdit = (project: Entrepreneur) => {
      console.log("Editar proyecto:", project.nombre);
    };
  
    const handleDelete = (project: Entrepreneur) => {
      console.log("Eliminar proyecto:", project.nombre);
    };

  return (
    <div className="p-6 space-y-4">
          <h1 className="text-2xl font-bold text-slate-800">Gestión de Emprendedores</h1>
          
          <EntrepreneursFilters/>
          
          <EntrepreneursTable
            data={MOCK_ENTREPRENEURS}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
  )
}