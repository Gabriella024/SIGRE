import { DataTable } from "@/components/ui/data-table";
import { orientationColumn } from "@/features/orientations/columns";
import { OrientationMock } from "@/features/orientations/mocks/OrientationsMocks";
import { OrientationsFilters } from "@/components/orientations/OrientationsFilters";

export function OrientationPage() {
  return (
     <div className="space-y-6">
      <div>
        <h1 className="text-2x1 font-bold text-slate-900">Gestión de Orientaciones</h1>
      </div>

      <OrientationsFilters />
            <DataTable columns={orientationColumn} data={OrientationMock} pageSize={5} />
     </div>   
    )
}    