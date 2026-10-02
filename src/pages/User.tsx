import React from 'react'
import { UsersTable } from '@/components/users/UsersTable'
import { UsersFilters } from '@/components/users/UsersFilters'
import { MOCK_USERS } from '@/features/users/mocks/UserMocks'
import type { User } from '@/features/users/types/users'

export function UsersPage() {
  const handleEdit = (user: User) => {
    console.log("Editar usuario:", user.nombre);
  };

  const handleDelete = (user: User) => {
    console.log("Eliminar usuario:", user.nombre);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Gestión de Usuarios</h1>
      </div>

      <UsersFilters />

      <UsersTable
        data={MOCK_USERS}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}