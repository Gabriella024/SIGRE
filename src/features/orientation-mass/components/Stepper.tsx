import { Check } from 'lucide-react';

interface StepperProps {
  currentStep?: 1 | 2 | 3;
  onSelectStep?: (step: 1 | 2 | 3) => void;
}

export function Stepper({ currentStep = 1, onSelectStep }: StepperProps) {
  const steps = [
    { number: 1, title: 'Cargar archivo' },
    { number: 2, title: 'Revisar resultado' },
    { number: 3, title: 'Confirmar' },
  ] as const;

  return (
    <nav aria-label="Progreso de carga" className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl p-4 md:px-6 my-6 overflow-x-auto">
      {steps.map((step, idx) => {
        const isCurrent = step.number === currentStep;
        const isDone = step.number < currentStep;

        return (
          <div key={step.number} className="flex items-center gap-4 flex-1 min-w-max">
            <button
              type="button"
              disabled={!isDone && !isCurrent}
              onClick={() => isDone && onSelectStep?.(step.number)}
              className={`flex items-center gap-2.5 font-medium text-sm transition-colors ${isDone ? 'cursor-pointer hover:text-brand-800' : 'cursor-default'
                } ${isCurrent ? 'text-slate-900 font-semibold' : 'text-slate-500'}`}
            >
              <span
                className={`grid place-items-center w-6 h-6 text-xs rounded-full border transition-colors ${isCurrent
                  ? 'bg-brand-700 border-brand-700 text-white font-bold'
                  : isDone
                    ? 'bg-brand-700 border-brand-700 text-white font-semibold'
                    : 'bg-white border-slate-300 text-slate-600'
                  }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : step.number}
              </span>
              <span>{step.title}</span>
            </button>

            {idx < steps.length - 1 && (
              <span
                className={`flex-1 h-px min-w-[20px] transition-colors ${isDone ? 'bg-brand-700' : 'bg-slate-200'
                  }`}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}