import { DataTable } from "@/components/ui/data-table";
import { usuariosColumns } from "@/features/users/columns";
import { UserMock } from "@/features/users/mocks/UserMocks";
import { UsersFilters } from "@/components/users/UsersFilters";

export function UserPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2x1 font-bold text-slate-900">Gestión de Usuarios</h1>
      </div>

       <UsersFilters />
          <DataTable columns={usuariosColumns} data={UserMock} pageSize={5} />
    </div>
  )
}