import { DataTable } from "@/components/ui/data-table";
import { PitchMock } from "@/features/pitch/mocks/PitchMocks";
import { PitchFilters } from "@/components/pitch/PitchFilters";
import { pitchColumn } from "@/features/pitch/columns";

export function PitchPage() {
  return (
     <div className="space-y-6">
      <div>
        <h1 className="text-2x1 font-bold text-slate-900">Gestión de Orientaciones</h1>
      </div>

      <PitchFilters />
            <DataTable columns={pitchColumn} data={PitchMock} pageSize={5} />
     </div>   
    )
}    