import React from "react"
import { MOCK_PITCH } from "@/features/pitch/mocks/PitchMocks"
import { PitchTable } from "@/components/pitch/PitchTable"
import type { Pitch } from "@/features/pitch/types/pitch"
import { PitchFilters } from "@/components/pitch/PitchFilters"

export function PitchPage() {
  const handleEdit = (pitch: Pitch) => {
    console.log("Editar proyecto:", pitch.nombre);
  };

  const handleDelete = (pitch: Pitch) => {
    console.log("Eliminar proyecto:", pitch.nombre);
  };
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-slate-800">Gestión de Orientaciones</h1>

      <PitchFilters />

      <PitchTable
        data={MOCK_PITCH}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  )
}    