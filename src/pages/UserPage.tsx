import { UsersTable } from '@/features/users/components/UsersTable'
import { UsersFilters } from '@/features/users/components/UsersFilters'
import { MOCK_USERS } from '@/features/users/mocks/UserMocks'

export function UsersPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Gestión de Usuarios</h1>
      </div>

      <UsersFilters />

      <UsersTable data={MOCK_USERS} />
    </div>
  );
}