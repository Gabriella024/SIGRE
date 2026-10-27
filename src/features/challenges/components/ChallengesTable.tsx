import { useEffect, useMemo, useState } from "react";
import MinimalTable from "@/components/ui/table/MinimalTable";
import type { Challenge } from "@/features/challenges/types/Challenge";
import { buildChallengeColumns } from "@/features/challenges/columns";

export interface ChallengeTableProps {
  data: Challenge[];
  onDetail: (challenge: Challenge) => void;
  onEdit?: (challenge: Challenge) => void;
}

export function ChallengesTable({ data, onDetail, onEdit }: ChallengeTableProps) {
  const columns = useMemo(() => buildChallengeColumns({ onDetail, onEdit }), [onDetail, onEdit]);
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

  return <MinimalTable<Challenge> data={data} columns={columns} pageSize={dynamicPageSize} />
}
