import { useState } from 'react'
import { Download } from 'lucide-react'
import { EvaluationTabs } from '@/components/evaluations/EvaluationTabs'
import { EvaluationSummaryBar } from '@/components/evaluations/EvaluationSummaryBar'
import { EvaluationCard } from '@/components/evaluations/EvaluationCard'
import { evaluacionesMock } from '@/features/evaluations/mocks/evaluacionesMocks'
import { MOCK_RESULTS } from '@/features/evaluations/mocks/resultadoMocks'
import type { EvaluationResults } from '@/features/evaluations/types/resultado'
import { ResultTable } from '@/components/evaluations/ResultTable'
import { ResultFilters } from '@/components/evaluations/ResultFilters'

export function EvaluationsPage() {
  const [activeTab, setActiveTab] = useState('asignaciones')

  const handleEdit = (evaluationResult: EvaluationResults) => {
    console.log("Editar codigo:", evaluationResult.codigo);
  };

  const handleDelete = (evaluationResult: EvaluationResults) => {
    console.log("Eliminar codigo:", evaluationResult.codigo);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Gestión de Evaluaciones</h1>
      </div>

      <EvaluationTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'asignaciones' ? (
        <div className="space-y-4">
          <h1 className="text-lg font-bold text-slate-800">Asignaciones</h1>
          <EvaluationSummaryBar evaluaciones={evaluacionesMock} />
          <div className="space-y-3">
            {evaluacionesMock.map((evaluacion) => (
              <EvaluationCard key={evaluacion.id} evaluacion={evaluacion} />
            ))}
          </div>
        </div>
      ) : (
        <div className="p-6 space-y-4">
          <h1 className="text-lg font-bold text-slate-800">Resultados</h1>

          <ResultFilters/>

          <ResultTable
            data={MOCK_RESULTS}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      )}
    </div>
  )
}