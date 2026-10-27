import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { MutationAlert } from "@/components/ui/mutation-alert";
import { MISSING_VERSION_MESSAGE } from "@/features/users/utils/userUtils";
import { formatStatusLabel } from "@/lib/format";

import type { MutationFeedback } from "@/hooks/useAdminMutation";
import type { MutationResult } from "@/lib/adminOperation";
import type { User } from "@/features/users/types/users";
import type { AccessRole } from "../types/types";

interface UserRolesModalProps {
  user: User | null;
  roles: AccessRole[];
  feedback: MutationFeedback;
  onSubmit: (user: User, roleIds: number[]) => Promise<MutationResult>;
  onClose: () => void;
  onReload: () => void;
}

function UserRolesForm({ user, roles, feedback, onSubmit, onClose, onReload }: UserRolesModalProps & { user: User }) {
  const initial = user.roles.map((role) => role.rolId);
  const [selected, setSelected] = useState<Set<number>>(() => new Set(initial));
  const dirty = selected.size !== initial.length || initial.some((id) => !selected.has(id));
  const missingVersion = !user.updatedAt;
  const blocked = feedback.isSubmitting || feedback.conflict || missingVersion;

  const toggle = (roleId: number) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(roleId)) next.delete(roleId);
      else next.add(roleId);
      return next;
    });

  const submit = async () => {
    const result = await onSubmit(user, [...selected]);
    if (result.success) onClose();
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Selecciona los roles de <span className="font-semibold text-slate-900">{user.nombre}</span>. Debe conservar al
        menos uno.
      </p>

      <fieldset disabled={blocked} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {roles.map((role) => (
          <label
            key={role.id}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
          >
            <input
              type="checkbox"
              checked={selected.has(role.id)}
              onChange={() => toggle(role.id)}
              className="h-4 w-4 accent-[#39a900]"
            />
            {formatStatusLabel(role.name)}
          </label>
        ))}
      </fieldset>

      {selected.size === 0 && <p className="text-xs text-rose-600">Debes seleccionar al menos un rol.</p>}

      {missingVersion ? (
        <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {MISSING_VERSION_MESSAGE}
        </div>
      ) : (
        <MutationAlert feedback={feedback} onReload={onReload} />
      )}

      <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onClose} disabled={feedback.isSubmitting}>
          Cancelar
        </Button>
        <Button
          type="button"
          className="gap-2 bg-[#39a900] hover:bg-[#2f8f00]"
          onClick={() => void submit()}
          disabled={blocked || feedback.pendingBackend !== null || !dirty || selected.size === 0}
        >
          {feedback.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {feedback.isSubmitting ? "Guardando..." : "Guardar roles"}
        </Button>
      </div>
    </div>
  );
}

export function UserRolesModal(props: UserRolesModalProps) {
  return (
    <Modal
      open={props.user !== null}
      onOpenChange={(next) => {
        if (!next && !props.feedback.isSubmitting) props.onClose();
      }}
      title="Roles del usuario"
    >
      {props.user && <UserRolesForm key={props.user.id} {...props} user={props.user} />}
    </Modal>
  );
}
