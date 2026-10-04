import React, { useState } from "react";
import SessionCalendar from "@/components/calendar/SessionCalendar";
import { ViewToggle, type ViewMode } from "@/components/ui/viewToggle";
import { MOCK_ORIENTATIONS } from "@/features/orientations/mocks/OrientationsMocks";
import { OrientationTable } from "@/components/orientations/OrientationsTable";
import type { Orientacion } from "@/features/orientations/types/orientations";
import { OrientationsFilters } from "@/components/orientations/OrientationsFilters";

export function OrientationPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const handleEdit = (orientation: Orientacion) => {
    console.log("Editar proyecto:", orientation.nombre);
  };

  const handleDelete = (orientation: Orientacion) => {
    console.log("Eliminar proyecto:", orientation.nombre);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Gestión de Orientaciones
        </h1>
        <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
      </div>

      {viewMode === "list" ? (
        <>
          <OrientationsFilters />
          <OrientationTable
            data={MOCK_ORIENTATIONS}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <SessionCalendar module="orientaciones" />
        </div>
      )}
    </div>
  );
}