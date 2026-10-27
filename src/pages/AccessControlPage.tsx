import { useMemo, useState } from "react";

import UsuariosSection from "../features/access-control/components/UsersSection";
import RolesSection from "@/features/access-control/components/RolesSection";
import PermisosSection from "@/features/access-control/components/PermissionsSection";
import { UserRolesModal } from "@/features/access-control/components/UserRolesModal";
import { useAccessControl } from "@/features/access-control/hooks/useAccessControl";
import {
  useAccessAdminMutations,
  useAccessAdminPermissions,
  useRolePermissions,
  useRoles,
  useScreenActions,
} from "@/features/access-control/hooks/useAccessAdmin";
import { sortRoles } from "@/features/access-control/utils/accessControlUtils";
import { useUsers } from "@/features/users/hooks/useUsers";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { formatStatusLabel, normalizeText } from "@/lib/format";

import type { User } from "@/features/users/types/users";

interface ControlAccesoViewProps {
  code?: string;
}

export default function ControlAccesoView({
  code = "CAC-01",
}: ControlAccesoViewProps) {
  const users = useUsers();
  const roles = useRoles();
  const screenActions = useScreenActions();
  const rolePermissions = useRolePermissions();
  const { canEdit } = useAccessAdminPermissions();
  const mutations = useAccessAdminMutations();
  const { roles: ownRoles, permissions: ownPermissions, refreshPermissions } = useAccessControl();
  const [editingRoles, setEditingRoles] = useState<User | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const sortedRoles = useMemo(() => (roles.data ? sortRoles(roles.data) : null), [roles.data]);

  const openRoles = (user: User) => {
    mutations.roles.reset();
    setNotice(null);
    setEditingRoles(user);
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">

      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#0f2f4a]">
            Control de acceso
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Administra usuarios, roles y permisos de la aplicación.
          </p>
        </div>

        <span className="rounded-md bg-slate-200/70 px-2.5 py-1 font-mono text-[11px] font-semibold text-slate-600">
          {code}
        </span>
      </header>

      {notice && (
        <div className="mb-6">
          <FeedbackMessage type="success" message={notice} />
        </div>
      )}

      <UsuariosSection
        users={users.data}
        isLoading={users.isLoading}
        error={users.error}
        onRetry={users.reload}
        onEditRoles={canEdit && sortedRoles ? openRoles : undefined}
      />

      <hr className="my-10 border-t border-slate-300/70" />

      <RolesSection
        roles={sortedRoles}
        users={users.data}
        isLoading={roles.isLoading}
        error={roles.error}
        onRetry={roles.reload}
      />

      <hr className="my-10 border-t border-slate-300/70" />

      <PermisosSection
        roles={sortedRoles ?? []}
        screenActions={screenActions}
        rolePermissions={rolePermissions}
        ownPermissionsCount={ownPermissions.length}
        ownRoles={ownRoles}
        feedback={mutations.permissions}
        onSave={canEdit ? mutations.permissions.run : undefined}
        onSaved={(roleName) => {
          setNotice(`Se guardaron los permisos del rol ${formatStatusLabel(roleName)}.`);
          rolePermissions.reload();
          if (ownRoles.some((role) => role === normalizeText(roleName))) void refreshPermissions();
        }}
      />

      <UserRolesModal
        user={editingRoles}
        roles={sortedRoles ?? []}
        feedback={mutations.roles}
        onSubmit={async (user, roleIds) => {
          const result = await mutations.roles.run(user.id, user.updatedAt, roleIds);
          if (result.success) {
            setNotice(`Se actualizaron los roles de ${user.nombre}.`);
            users.reload();
          }
          return result;
        }}
        onClose={() => setEditingRoles(null)}
        onReload={() => {
          setEditingRoles(null);
          users.reload();
        }}
      />
    </div>
  );
}
