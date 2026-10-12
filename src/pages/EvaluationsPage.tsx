import { useState } from 'react'
import { EvaluationTabs } from '@/features/evaluations/components/EvaluationTabs'
import { EvaluationSummaryBar } from '@/features/evaluations/components/EvaluationSummaryBar'
import { EvaluationCard } from '@/features/evaluations/components/EvaluationCard'
import { evaluacionesMock } from '@/features/evaluations/mocks/evaluacionesMocks'
import { MOCK_RESULTS } from '@/features/evaluations/mocks/resultadoMocks'
import { ResultTable } from '@/features/evaluations/components/ResultTable'
import { ResultFilters } from '@/features/evaluations/components/ResultFilters'
import { PendingIntegrationNotice } from '@/components/ui/pending-integration'

export function EvaluationsPage() {
  const [activeTab, setActiveTab] = useState('asignaciones')

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Gestión de Evaluaciones</h1>
      </div>

      <EvaluationTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'asignaciones' ? (
        <div className="space-y-4">
          <h1 className="text-lg font-bold text-slate-800">Asignaciones</h1>
          <PendingIntegrationNotice>
            La asignación de evaluadores y la calificación se habilitarán cuando exista la integración con Supabase. Los registros mostrados son de ejemplo.
          </PendingIntegrationNotice>
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

          <ResultTable data={MOCK_RESULTS} />
        </div>
      )}
    </div>
  )
}