import { useEffect, useMemo, useState } from "react";
import MinimalTable from "@/components/ui/table/MinimalTable";
import type { Pitch, PitchPreparation } from "@/features/pitch/types/pitch";
import { PREPARATION_COLUMNS, buildPitchColumns } from "@/features/pitch/columns";

function useDynamicPageSize() {
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

  return dynamicPageSize;
}

export interface PitchTableProps {
  data: Pitch[];
  onDetail: (pitch: Pitch) => void;
  onEdit?: (pitch: Pitch) => void;
}

export function PitchTable({ data, onDetail, onEdit }: PitchTableProps) {
  const columns = useMemo(() => buildPitchColumns({ onDetail, onEdit }), [onDetail, onEdit]);
  const pageSize = useDynamicPageSize();
  return <MinimalTable<Pitch> data={data} columns={columns} pageSize={pageSize} />;
}

export function PitchPreparationTable({ data }: { data: PitchPreparation[] }) {
  const pageSize = useDynamicPageSize();
  return <MinimalTable<PitchPreparation> data={data} columns={PREPARATION_COLUMNS} pageSize={pageSize} />;
}
