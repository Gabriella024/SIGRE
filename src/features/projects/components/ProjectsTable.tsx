import { useEffect, useState } from "react";
import MinimalTable from "@/components/ui/table/MinimalTable";
import type { Project } from "@/features/projects/types/proyect";
import { PROJECT_COLUMNS } from "@/features/projects/columns";

export interface ProjectsTableProps {
  data: Project[];
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
}

export function ProjectsTable({ data, onEdit, onDelete }: ProjectsTableProps) {
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
    <MinimalTable<Project>
      data={data}
      columns={PROJECT_COLUMNS}
      pageSize={dynamicPageSize}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
}

export default ProjectsTable;