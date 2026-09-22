import { DataTable } from "@/components/ui/data-table";
import { EvaluatorsFilters } from "@/components/evaluators/EvaluatorsFilters";
import { EvaluatorMocks } from "@/features/evaluators/mocks/EvaluatorsMocks";
import { EvaluatorsColumn } from "@/features/evaluators/columns";

export function EvaluatorPage() {
  return (
     <div className="space-y-6">
      <div>
        <h1 className="text-2x1 font-bold text-slate-900">Gestión de Evaluadores</h1>
      </div>

      <EvaluatorsFilters />
            <DataTable columns={EvaluatorsColumn} data={EvaluatorMocks} pageSize={5} />
     </div>   
    )
}    