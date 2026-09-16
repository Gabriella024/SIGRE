import { DataTable } from "@/components/ui/data-table";
import { enmprendedorColumns } from "@/features/entrepreneurs/columns";
import { EntrepreneurMock } from "@/features/entrepreneurs/mocks/EntrepreneursMocks";
import { EntrepreneursFilters } from "@/entrepreneurs/EntrepreneursFilters";

export function EntrepreneurPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2x1 font-bold text-slate-900">Gestión de Emprendedores</h1>
      </div>

      <EntrepreneursFilters />
      <DataTable columns={enmprendedorColumns} data={EntrepreneurMock} pageSize={5} />
    </div>
  )
}