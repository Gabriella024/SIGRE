import { DataTable } from '@/components/ui/data-table'
import { UsersFilters } from '@/components/users/UsersFilters'
import { usuarioColumns } from '@/features/users/columns'
import { usuariosMock } from '@/features/users/mocks/UserMocks'

export function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
      </div>
      
      <UsersFilters />

      <DataTable
        columns={usuarioColumns}
        data={usuariosMock}
        pageSize={5}
        enableRowSelection
      />
    </div>
  )
}