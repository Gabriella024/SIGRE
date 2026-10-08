import UsuariosSection from "../features/access-control/components/UsersSection";
import RolesSection from "../components/accessControl/RolesSection";
import PermisosSection from "../components/accessControl/PermissionsSection";

interface ControlAccesoViewProps {
  code?: string;
}

export default function ControlAccesoView({
  code = "CAC-01",
}: ControlAccesoViewProps) {
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

      <UsuariosSection />

      <hr className="my-10 border-t border-slate-300/70" />

      <RolesSection />

      <hr className="my-10 border-t border-slate-300/70" />

      <PermisosSection />
    </div>
  );
}