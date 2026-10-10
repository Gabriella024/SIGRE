import { useEffect, useState } from "react";
import MinimalTable from "@/components/ui/table/MinimalTable";
import type { User } from "@/features/users/types/users";
import { USER_COLUMNS } from "@/features/users/columns";

export interface UserTableProps {
  data: User[];
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
}

export function UsersTable({ data, onEdit, onDelete }: UserTableProps) {
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
    <MinimalTable<User>
          data={data}
          columns={USER_COLUMNS}
          pageSize={dynamicPageSize}
          onEdit={onEdit}
          onDelete={onDelete}
        />
  )
}