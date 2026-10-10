import type { UserRole, UserStatus, UserStage } from "./types";

export function InitialsAvatar({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  const initials = (first + last).toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600"
      >
        {initials}
      </span>
      <span className="font-medium text-slate-800">{name}</span>
    </div>
  );
}

const badgeBase =
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";

const STATUS_STYLES: Record<UserStatus, string> = {
  Activo: "bg-emerald-100 text-emerald-800",
  Inactivo: "bg-rose-100 text-rose-800",
  Pendiente: "bg-amber-100 text-amber-800",
};

const ROLE_STYLES: Record<UserRole, string> = {
  Admin: "bg-indigo-100 text-indigo-800",
  Coordinador: "bg-violet-100 text-violet-800",
  Aprendiz: "bg-teal-100 text-teal-800",
};

const STAGE_STYLES: Record<UserStage, string> = {
  Lectiva: "bg-sky-100 text-sky-800",
  Productiva: "bg-orange-100 text-orange-800",
  Graduado: "bg-fuchsia-100 text-fuchsia-800",
};

export function StatusBadge({ status }: { status: UserStatus }) {
  return <span className={`${badgeBase} ${STATUS_STYLES[status]}`}>{status}</span>;
}

export function RoleBadge({ role }: { role: UserRole }) {
  return <span className={`${badgeBase} ${ROLE_STYLES[role]}`}>{role}</span>;
}

export function StageBadge({ stage }: { stage: UserStage }) {
  return <span className={`${badgeBase} ${STAGE_STYLES[stage]}`}>{stage}</span>;
}