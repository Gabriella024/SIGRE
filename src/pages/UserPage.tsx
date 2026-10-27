import { useCallback, useMemo, useState } from 'react'

import { UsersTable } from '@/features/users/components/UsersTable'
import { UsersFilters } from '@/features/users/components/UsersFilters'
import { UserDetailModal } from '@/features/users/components/UserDetailModal'
import { UserEditModal } from '@/features/users/components/UserEditModal'
import { UserStatusModal } from '@/features/users/components/UserStatusModal'
import { UserInviteModal } from '@/features/users/components/UserInviteModal'
import { useUserAccess, useUserMutations, useUsers } from '@/features/users/hooks/useUsers'
import { INITIAL_USER_FILTERS, filterUsers, toStatusTarget } from '@/features/users/utils/userUtils'
import { useMunicipios } from '@/features/settings/hooks/useSettings'
import { useRoles } from '@/features/access-control/hooks/useAccessAdmin'
import { sortRoles } from '@/features/access-control/utils/accessControlUtils'
import { FeedbackMessage } from '@/components/ui/feedback-message'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/query-state'
import { distinctOptions } from '@/lib/format'

import type { User, UserFilters } from '@/features/users/types/users'

export function UsersPage() {
  const { data, error, isLoading, reload } = useUsers()
  const { canCreate, canEdit } = useUserAccess()
  const mutations = useUserMutations()
  const municipios = useMunicipios()
  const roles = useRoles()
  const [filters, setFilters] = useState<UserFilters>(INITIAL_USER_FILTERS)
  const [viewing, setViewing] = useState<User | null>(null)
  const [editing, setEditing] = useState<User | null>(null)
  const [changingStatus, setChangingStatus] = useState<User | null>(null)
  const [inviting, setInviting] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const rows = useMemo(() => data ?? [], [data])
  const filtered = useMemo(() => filterUsers(rows, filters), [rows, filters])
  const estadoOptions = useMemo(() => distinctOptions(rows.map((row) => row.estado)), [rows])
  const rolOptions = useMemo(() => distinctOptions(rows.flatMap((row) => row.roles.map((role) => role.rol))), [rows])
  const sortedRoles = useMemo(() => (roles.data ? sortRoles(roles.data) : null), [roles.data])

  const { edit, status, invite } = mutations
  const resetEdit = edit.reset
  const resetStatus = status.reset

  const openEdit = useCallback((user: User) => {
    resetEdit()
    setNotice(null)
    setViewing(null)
    setEditing(user)
  }, [resetEdit])

  const openStatus = useCallback((user: User) => {
    resetStatus()
    setNotice(null)
    setViewing(null)
    setChangingStatus(user)
  }, [resetStatus])

  const openInvite = () => {
    invite.reset()
    setNotice(null)
    setInviting(true)
  }

  const afterSuccess = (message: string) => {
    setNotice(message)
    reload()
  }

  const statusTarget = changingStatus ? toStatusTarget(changingStatus) : null

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Gestión de Usuarios</h1>
      </div>

      <UsersFilters
        filters={filters}
        onChange={setFilters}
        estadoOptions={estadoOptions}
        rolOptions={rolOptions}
        onCreate={canCreate ? openInvite : undefined}
      />

      {notice && <FeedbackMessage type="success" message={notice} />}

      {isLoading ? (
        <LoadingState message="Cargando usuarios..." />
      ) : error ? (
        <ErrorState message="No fue posible cargar los usuarios." detail={error} onRetry={reload} />
      ) : rows.length === 0 ? (
        <EmptyState message="No hay usuarios registrados o visibles para tu usuario." />
      ) : filtered.length === 0 ? (
        <EmptyState message="No hay usuarios que coincidan con la búsqueda y los filtros actuales." />
      ) : (
        <UsersTable
          data={filtered}
          onView={setViewing}
          onEdit={canEdit ? openEdit : undefined}
          onToggleStatus={canEdit ? openStatus : undefined}
        />
      )}

      <UserDetailModal
        user={viewing}
        onClose={() => setViewing(null)}
        onEdit={canEdit ? openEdit : undefined}
        onToggleStatus={canEdit ? openStatus : undefined}
      />

      <UserEditModal
        user={editing}
        municipios={municipios}
        feedback={edit}
        onSubmit={async (user, values) => {
          const result = await edit.run(user, values)
          if (result.success) afterSuccess('Los datos del usuario se guardaron correctamente.')
          return result
        }}
        onClose={() => setEditing(null)}
        onReload={() => {
          setEditing(null)
          reload()
        }}
      />

      <UserStatusModal
        user={changingStatus}
        target={statusTarget}
        feedback={status}
        onSubmit={async (target, justificacion) => {
          const result = await status.run(target, justificacion)
          if (result.success) afterSuccess(`El usuario quedó ${target.estadoNuevo}.`)
          return result
        }}
        onClose={() => setChangingStatus(null)}
        onReload={() => {
          setChangingStatus(null)
          reload()
        }}
      />

      <UserInviteModal
        open={inviting}
        roles={{ ...roles, data: sortedRoles }}
        municipios={municipios}
        feedback={invite}
        onSubmit={async (values) => {
          const result = await invite.run(values)
          if (result.success) afterSuccess(`Se envió la invitación a ${values.correo}.`)
          return result
        }}
        onClose={() => setInviting(false)}
      />
    </div>
  );
}
