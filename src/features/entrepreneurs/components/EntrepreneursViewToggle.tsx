import { LayoutGrid, List, type LucideIcon } from "lucide-react";

import type { EntrepreneurView } from "../types/entrepreneur";

const OPTIONS: { value: EntrepreneurView; label: string; icon: LucideIcon }[] = [
  { value: "cards", label: "Tarjetas", icon: LayoutGrid },
  { value: "tabla", label: "Tabla", icon: List },
];

interface EntrepreneursViewToggleProps {
  value: EntrepreneurView;
  onChange: (view: EntrepreneurView) => void;
}

export function EntrepreneursViewToggle({ value, onChange }: EntrepreneursViewToggleProps) {
  return (
    <div role="group" aria-label="Tipo de vista" className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
      {OPTIONS.map(({ value: option, label, icon: Icon }) => {
        const active = option === value;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option)}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
              active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
