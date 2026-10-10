import { useEffect, useState } from "react";
import MinimalTable from "@/components/ui/table/MinimalTable";
import type { Orientacion } from '@/features/orientations/types/orientations'
import { ORIENTATION_COLUMNS } from "@/features/orientations/columns";

export interface OrientationTableProps {
  data: Orientacion[];
  onEdit?: (orientation: Orientacion) => void;
  onDelete?: (orientation: Orientacion) => void;
}

export function OrientationTable({ data, onEdit, onDelete }: OrientationTableProps) {
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
    <MinimalTable<Orientacion>
      data={data}
      columns={ORIENTATION_COLUMNS}
      pageSize={dynamicPageSize}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );

}