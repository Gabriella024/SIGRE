import { useEffect, useState } from "react";
import MinimalTable from "@/components/ui/table/MinimalTable";
import type { Column } from "@/components/ui/table/types";
import type { Orientacion } from '@/features/orientations/types/orientations'

export interface OrientationTableProps {
  data: Orientacion[];
  columns: Column<Orientacion>[];
}

export function OrientationTable({ data, columns }: OrientationTableProps) {
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
      columns={columns}
      pageSize={dynamicPageSize}
    />
  );

}
