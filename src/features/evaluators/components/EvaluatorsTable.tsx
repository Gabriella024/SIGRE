import { useEffect, useMemo, useState } from "react";
import MinimalTable from "@/components/ui/table/MinimalTable";
import type { Evaluator } from "@/features/evaluators/types/evaluators";
import { buildEvaluatorColumns } from "@/features/evaluators/columns";

export interface EvaluatorTableProps {
  data: Evaluator[];
  onEdit?: (evaluator: Evaluator) => void;
  onToggleEstado?: (evaluator: Evaluator) => void;
}

export function EvaluatorsTable({ data, onEdit, onToggleEstado }: EvaluatorTableProps) {
  const columns = useMemo(() => buildEvaluatorColumns({ onEdit, onToggleEstado }), [onEdit, onToggleEstado]);
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

  return <MinimalTable<Evaluator> data={data} columns={columns} pageSize={dynamicPageSize} />
}
