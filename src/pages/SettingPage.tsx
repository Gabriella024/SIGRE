import MunicipiosSection from "../components/settingss/MunicipiosSection";
import PlantillasCorreoSection from "../components/settingss/PlantillasCorreoSection";
import ModulosPantallasSection from "../components/settingss/ModulosPantallasSection";

interface ConfiguracionProps {
  code?: string;
}

export default function ConfiguracionPage({
  code = "CPS-01",
}: ConfiguracionProps) {
  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8">

      <header className="mb-10 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#0f2f4a]">
            Configuración
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Parámetros generales del sistema
          </p>
        </div>

        <span className="rounded-md bg-slate-200/70 px-2.5 py-1 font-mono text-[11px] font-semibold text-slate-600">
          {code}
        </span>
      </header>

      <MunicipiosSection />

      <div className="my-12 border-t border-slate-200" />

      <PlantillasCorreoSection />

      <div className="my-12 border-t border-slate-200" />

      <ModulosPantallasSection />

    </div>
  );
}