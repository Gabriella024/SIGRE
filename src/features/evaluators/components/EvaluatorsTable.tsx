import React, { useEffect, useState } from "react";
import MinimalTable from "@/components/ui/table/MinimalTable";
import type { Evaluator } from "@/features/evaluators/types/evaluators";
import { EVALUATOR_COLUMNS } from "@/features/evaluators/columns";

export interface EvaluatorTableProps {
  data: Evaluator[];
  onEdit?: (evaluator: Evaluator) => void;
  onDelete?: (evaluator: Evaluator) => void;
}

export function EvaluatorsTable({ data, onEdit, onDelete }: EvaluatorTableProps) {
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
    <MinimalTable<Evaluator>
          data={data}
          columns={EVALUATOR_COLUMNS}
          pageSize={dynamicPageSize}
          onEdit={onEdit}
          onDelete={onDelete}
        />
  )
}