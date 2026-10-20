import { useEffect, useMemo, useState } from "react";
import MinimalTable from "@/components/ui/table/MinimalTable";
import type { Project } from "@/features/projects/types/proyect";
import { buildProjectColumns } from "@/features/projects/columns";

export interface ProjectsTableProps {
  data: Project[];
  onDetail: (project: Project) => void;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
}

export function ProjectsTable({ data, onDetail, onEdit, onDelete }: ProjectsTableProps) {
  const columns = useMemo(
    () => buildProjectColumns({ onDetail, onEdit, onDelete }),
    [onDetail, onEdit, onDelete]
  );
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
      columns={columns}
      pageSize={dynamicPageSize}
    />
  );
}

export default ProjectsTable;