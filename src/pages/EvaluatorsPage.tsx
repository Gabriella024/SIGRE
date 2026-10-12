import { EvaluatorsTable } from '@/features/evaluators/components/EvaluatorsTable'
import { MOCK_EVALUATORS } from '@/features/evaluators/mocks/EvaluatorsMocks'
import { EvaluatorsFilters } from '@/features/evaluators/components/EvaluatorsFilters'

export function EvaluatorPage() {
  

  return (
      <div className="p-6 space-y-4">
            <h1 className="text-2xl font-bold text-slate-800">Gestión de Evaluadores</h1>
            
            <EvaluatorsFilters/>
            
            <EvaluatorsTable data={MOCK_EVALUATORS} />
          </div>
    )
}    