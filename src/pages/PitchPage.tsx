import React, { useMemo, useState } from "react"
import SessionCalendar from "@/components/calendar/SessionCalendar"
import { ViewToggle, type ViewMode } from "@/components/ui/viewToggle"
import { MOCK_PITCH } from "@/features/pitch/mocks/PitchMocks"
import { PitchTable } from "@/features/pitch/components/PitchTable"
import type { Pitch } from "@/features/pitch/types/pitch"
import { PitchFilters } from "@/features/pitch/components/PitchFilters"

export function PitchPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [activeTab, setActiveTab] = useState("R5")

  const pitchesFiltrados = useMemo(() => {
    return MOCK_PITCH.filter((p) => p.etapa === activeTab)
  }, [activeTab])

  const handleEdit = (pitch: Pitch) => {
    console.log("Editar sesión pitch:", pitch.nombre)
  }

  const handleDelete = (pitch: Pitch) => {
    console.log("Eliminar sesión pitch:", pitch.nombre)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Gestión de Preparación y Pitch
          </h1>
        </div>
        <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
      </div>

      {viewMode === "list" ? (
        <>
          <PitchFilters activeTab={activeTab} onTabChange={setActiveTab} />

          <PitchTable
            data={pitchesFiltrados}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-4">
          <SessionCalendar module="pitch" readOnly={true} />
        </div>
      )}
    </div>
  )
}