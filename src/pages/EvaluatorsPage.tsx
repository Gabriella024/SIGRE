import { useMemo, useState } from 'react'
import { EvaluatorsTable } from '@/components/evaluators/EvaluatorsTable'
import { MOCK_EVALUATORS } from '@/features/evaluators/mocks/EvaluatorsMocks'
import { EvaluatorsFilters } from '@/components/evaluators/EvaluatorsFilters'
import type { Evaluator } from '@/features/evaluators/types/evaluators'

export function EvaluatorPage() {
  const handleEdit = (evaluator: Evaluator) => {
      console.log("Editar proyecto:", evaluator.nombre);
    };
  
    const handleDelete = (evaluator: Evaluator) => {
      console.log("Eliminar proyecto:", evaluator.nombre);
    };

  return (
      <div className="p-6 space-y-4">
            <h1 className="text-2xl font-bold text-slate-800">Gestión de Evaluadores</h1>
            
            <EvaluatorsFilters/>
            
            <EvaluatorsTable
              data={MOCK_EVALUATORS}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
    )
}    