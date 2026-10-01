import React from "react"
import { MOCK_ORIENTATIONS } from "@/features/orientations/mocks/OrientationsMocks"
import { OrientationTable } from "@/components/orientations/OrientationsTable"
import type { Orientacion } from "@/features/orientations/types/orientations"
import { OrientationsFilters } from "@/components/orientations/OrientationsFilters"


export function OrientationPage() {
  const handleEdit = (orientation: Orientacion) => {
    console.log("Editar proyecto:", orientation.nombre);
  };

  const handleDelete = (orientation: Orientacion) => {
    console.log("Eliminar proyecto:", orientation.nombre);
  };
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-slate-800">Gestión de Orientaciones</h1>

      <OrientationsFilters />

      <OrientationTable
        data={MOCK_ORIENTATIONS}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  )
}    