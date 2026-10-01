import React, { useEffect, useState } from "react";
import MinimalTable from "@/components/ui/table/MinimalTable";
import type { EvaluationResults } from "@/features/evaluations/types/resultado";
import { RESULT_COLUMNS } from "@/features/evaluations/resultadosColumns";

export interface EvaluationResultsTableProps {
  data: EvaluationResults[];
  onEdit?: (evaluationResult: EvaluationResults) => void;
  onDelete?: (evaluationResult: EvaluationResults) => void;
}

export function ResultTable({ data, onEdit, onDelete }: EvaluationResultsTableProps) {
  const [dynamicPageSize, setDynamicPageSize] = useState(8);

  useEffect(() => {
    const calculatePageSize = () => {
      const windowHeight = window.innerHeight;
      if (windowHeight > 1000) {
        setDynamicPageSize(12);
      } else if (windowHeight > 800) {
        setDynamicPageSize(8);
      } else {
        setDynamicPageSize(5);
      }
    };

    calculatePageSize();
    window.addEventListener("resize", calculatePageSize);
    return () => window.removeEventListener("resize", calculatePageSize);
  }, []);

  return (
    <MinimalTable<EvaluationResults>
      data={data}
      columns={RESULT_COLUMNS}
      pageSize={dynamicPageSize}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  )
}