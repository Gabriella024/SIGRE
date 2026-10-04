import React, { useState } from "react"
import SessionCalendar from "@/components/calendar/SessionCalendar"
import { ViewToggle, type ViewMode } from "@/components/ui/viewToggle"
import { MOCK_PITCH } from "@/features/pitch/mocks/PitchMocks"
import { PitchTable } from "@/components/pitch/PitchTable"
import type { Pitch } from "@/features/pitch/types/pitch"
import { PitchFilters } from "@/components/pitch/PitchFilters"

export function PitchPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const handleEdit = (pitch: Pitch) => {
    console.log("Editar proyecto:", pitch.nombre);
  };

  const handleDelete = (pitch: Pitch) => {
    console.log("Eliminar proyecto:", pitch.nombre);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">
          Gestión de Preparación y Pitch
        </h1>
        <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
      </div>

      {viewMode === "list" ? (
        <>
          <PitchFilters />

          <PitchTable
            data={MOCK_PITCH}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <SessionCalendar module="pitch" />
        </div>
      )}
    </div>
  )
}    