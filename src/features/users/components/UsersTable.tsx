import { useEffect, useMemo, useState } from "react";
import MinimalTable from "@/components/ui/table/MinimalTable";
import type { User } from "@/features/users/types/users";
import { createUserColumns, type UserRowActions } from "@/features/users/columns";

export interface UserTableProps extends UserRowActions {
  data: User[];
}

export function UsersTable({ data, onView, onEdit, onToggleStatus }: UserTableProps) {
  const [dynamicPageSize, setDynamicPageSize] = useState(8);
  const columns = useMemo(
    () => createUserColumns({ onView, onEdit, onToggleStatus }),
    [onView, onEdit, onToggleStatus]
  );

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
          columns={columns}
          pageSize={dynamicPageSize}
          selectable={false}
        />
  )
}
