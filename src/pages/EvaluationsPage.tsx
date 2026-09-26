import { useState } from 'react'
import { Download } from 'lucide-react'
import { EvaluationTabs } from '@/components/evaluations/EvaluationTabs'
import { EvaluationSummaryBar } from '@/components/evaluations/EvaluationSummaryBar'
import { EvaluationCard } from '@/components/evaluations/EvaluationCard'
import { ResultsSummaryPills } from '@/components/evaluations/ResultsSumaryPills'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { resultadosColumns } from '@/features/evaluations/resultadosColumns'
import { evaluacionesMock } from '@/features/evaluations/mocks/evaluacionesMocks'
import { resultadosMock } from '@/features/evaluations/mocks/resultadoMocks'

export function EvaluationsPage() {
  const [activeTab, setActiveTab] = useState('asignaciones')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Evaluaciones</h1>
      </div>

      <EvaluationTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'asignaciones' ? (
        <div className="space-y-4">
          <EvaluationSummaryBar evaluaciones={evaluacionesMock} />
          <div className="space-y-3">
            {evaluacionesMock.map((evaluacion) => (
              <EvaluationCard key={evaluacion.id} evaluacion={evaluacion} />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <ResultsSummaryPills resultados={resultadosMock} />
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar resultados
            </Button>
          </div>
          <DataTable columns={resultadosColumns} data={resultadosMock} pageSize={9} />
        </div>
      )}
    </div>
  )
}