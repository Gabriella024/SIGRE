import { useEffect, useState } from "react";
import MinimalTable from "@/components/ui/table/MinimalTable";
import type { Pitch } from "@/features/pitch/types/pitch";
import { PITCH_COLUMNS } from "@/features/pitch/columns";

export interface PitchTableProps {
  data: Pitch[];
  onEdit?: (pitch: Pitch) => void;
  onDelete?: (pitch: Pitch) => void;
}

export function PitchTable({ data, onEdit, onDelete }: PitchTableProps) {
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
    <MinimalTable<Pitch>
      data={data}
      columns={PITCH_COLUMNS}
      pageSize={dynamicPageSize}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );

}