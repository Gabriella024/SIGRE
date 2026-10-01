import React, { useEffect, useState } from "react";
import MinimalTable from "@/components/ui/table/MinimalTable";
import type { Entrepreneur } from "@/features/entrepreneurs/types/entrepreneur";
import { ENTREPRENEUR_COLUMNS } from "@/features/entrepreneurs/columns";

export interface ProjectsTableProps {
  data: Entrepreneur[];
  onEdit?: (project: Entrepreneur) => void;
  onDelete?: (project: Entrepreneur) => void;
}

export function EntrepreneursTable({ data, onEdit, onDelete }: ProjectsTableProps) {
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
    <MinimalTable<Entrepreneur>
      data={data}
      columns={ENTREPRENEUR_COLUMNS}
      pageSize={dynamicPageSize}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  )
}